/**
 * update-player-stats
 *
 * Pulls top scorers from football-data.org for the 10 main competitions
 * we care about, matches scorer names against LR's `players` table, and
 * updates season_goals / season_assists / season_games / stats_updated_at.
 *
 * Free tier of football-data.org allows 10 requests / minute → we pace at
 * 7 s between competition calls. Total run time ≈ 75 s.
 *
 * Auth : custom shared secret (Authorization: Bearer <PIPELINE_SECRET>).
 * verify_jwt is set to false at deploy time because we authenticate via
 * the secret header — this is the standard pattern for scheduled cron
 * triggers in Supabase, where no end-user JWT is involved.
 *
 * Env vars expected (Project Settings → Edge Functions → Secrets) :
 *   - FOOTBALL_DATA_API_KEY  : free key from https://www.football-data.org/client/register
 *   - PIPELINE_SECRET        : random opaque string, also passed by the
 *                              cron caller in the Authorization header
 *
 * Schedule : weekly, Sundays around 23:05 UTC, via Supabase pg_cron →
 * net.http_post(...). See README.md for the SQL.
 *
 * --- Club consistency check ---
 *
 * Match by name only would silently update the wrong row when two players
 * share a name (we hit this with Arnaud Kalimuendo : LR's plays at
 * Nottingham Forest, football-data.org returns a Bundesliga homonym at
 * Eintracht Frankfurt). We require the LR `current_club` and the API
 * `team.name` to share at least one significant 4+ char token. Loose
 * enough to handle "Real Betis" vs "Real Betis Balompié", strict enough
 * to reject the Kalimuendo case. Rejects are surfaced in the response
 * `rejected_detail` for manual review.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FD_API = "https://api.football-data.org/v4";

// limit=500 covers the entire scorers list of every comp on the free tier
// (the actual ceiling tops at ~266 in PL). Ensures we never silently drop
// a Léopards player who happens to score outside the top 100.
const SCORERS_LIMIT = 500;

// 10 competitions chosen to cover ~95 % of LR's diaspora-EU players. Add
// more (MLS, Süper Lig, etc.) if/when LR's footprint widens.
const COMPS: { code: string; label: string }[] = [
  { code: "PL", label: "Premier League" },
  { code: "PD", label: "La Liga" },
  { code: "BL1", label: "Bundesliga" },
  { code: "SA", label: "Serie A" },
  { code: "FL1", label: "Ligue 1" },
  { code: "DED", label: "Eredivisie" },
  { code: "PPL", label: "Primeira Liga" },
  { code: "ELC", label: "Championship" },
  { code: "BSA", label: "Brasileirao Série A" },
  { code: "CL", label: "UEFA Champions League" },
];

const RATE_LIMIT_DELAY_MS = 7000;

// Tokens too generic to use as match keys ("FC", "United"...).
const CLUB_STOPWORDS = new Set([
  "fc", "cf", "ac", "sc", "sk", "as", "ss", "ssc", "us", "vfb", "vfl",
  "sv", "sg", "de", "of", "the", "la", "le", "el", "al", "club", "calcio",
  "city", "united", "olympique", "royal", "royale", "sporting", "stade",
  "1893", "1899", "1909", "1900", "1903", "1904", "1905", "1906", "1907", "1908",
]);

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !CLUB_STOPWORDS.has(t)),
  );
}

function clubsMatch(lrClub: string | null, apiTeam: string | null): boolean {
  if (!lrClub || !apiTeam) return false;
  const lrTokens = tokenize(lrClub);
  const apiTokens = tokenize(apiTeam);
  for (const t of lrTokens) if (apiTokens.has(t)) return true;
  return false;
}

/** Strip accents, normalise hyphens & apostrophes, lowercase. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(async (req: Request) => {
  // ---- Custom auth via shared secret ----
  const auth = req.headers.get("Authorization") || "";
  const expected = Deno.env.get("PIPELINE_SECRET");
  if (!expected) {
    return jsonResp({ ok: false, error: "PIPELINE_SECRET not configured" }, 500);
  }
  if (auth !== `Bearer ${expected}`) {
    return jsonResp({ ok: false, error: "Unauthorized" }, 401);
  }

  const fdKey = Deno.env.get("FOOTBALL_DATA_API_KEY");
  if (!fdKey) {
    return jsonResp({ ok: false, error: "FOOTBALL_DATA_API_KEY not configured" }, 500);
  }

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Pull id, name AND current_club for the consistency check.
  const { data: players, error: loadErr } = await supa
    .from("players")
    .select("id, name, current_club")
    .neq("eligibility_status", "ineligible");

  if (loadErr) {
    return jsonResp({ ok: false, error: loadErr.message }, 500);
  }

  // name → array of {id, club} (handle homonyms in our own DB too)
  const lookup = new Map<string, Array<{ id: number; club: string | null }>>();
  for (const p of players || []) {
    const k = normalize(p.name as string);
    const arr = lookup.get(k) ?? [];
    arr.push({ id: p.id as number, club: (p.current_club as string) ?? null });
    lookup.set(k, arr);
  }

  const result = {
    ok: true,
    competitions: COMPS.length,
    players_in_db: players?.length ?? 0,
    matched_name: 0,
    matched_with_club: 0,
    rejected_club_mismatch: 0,
    updated: 0,
    matches_detail: [] as Array<{
      comp: string;
      lr_name: string;
      api_team: string;
      lr_club: string | null;
      goals: number;
      assists: number;
      matches: number;
    }>,
    rejected_detail: [] as Array<{
      lr_name: string;
      lr_club: string | null;
      api_team: string;
      comp: string;
    }>,
    errors: [] as string[],
  };

  // Aggregate per player across all comps before writing. Without this,
  // a player who scores in PL + CL gets two consecutive UPDATEs and the
  // last-seen comp overwrites the others (Wissa lost his PL stats to
  // his CL stats in v5).
  type Agg = {
    name: string;
    club: string | null;
    goals: number;
    assists: number;
    games: number;
    comps: string[];
  };
  const aggregates = new Map<number, Agg>();

  // ---- Pass 1 : collect aggregates ----
  for (const comp of COMPS) {
    try {
      const r = await fetch(
        `${FD_API}/competitions/${comp.code}/scorers?limit=${SCORERS_LIMIT}`,
        { headers: { "X-Auth-Token": fdKey } },
      );
      if (!r.ok) {
        result.errors.push(`${comp.code}: HTTP ${r.status}`);
        await new Promise((res) => setTimeout(res, RATE_LIMIT_DELAY_MS));
        continue;
      }
      const data = await r.json();
      for (const sc of data.scorers || []) {
        const candidates = lookup.get(normalize(sc.player?.name || ""));
        if (!candidates || candidates.length === 0) continue;
        result.matched_name++;

        const apiTeam = sc.team?.name ?? null;
        const winner = candidates.find((c) => clubsMatch(c.club, apiTeam));
        if (!winner) {
          result.rejected_club_mismatch++;
          result.rejected_detail.push({
            lr_name: sc.player.name,
            lr_club: candidates[0].club,
            api_team: apiTeam || "?",
            comp: comp.code,
          });
          continue;
        }
        result.matched_with_club++;

        const prev = aggregates.get(winner.id) ?? {
          name: sc.player.name as string,
          club: winner.club,
          goals: 0,
          assists: 0,
          games: 0,
          comps: [] as string[],
        };
        prev.goals += sc.goals ?? 0;
        prev.assists += sc.assists ?? 0;
        prev.games += sc.playedMatches ?? 0;
        prev.comps.push(comp.code);
        aggregates.set(winner.id, prev);
      }
    } catch (e) {
      result.errors.push(`${comp.code}: ${(e as Error).message}`);
    }
    await new Promise((res) => setTimeout(res, RATE_LIMIT_DELAY_MS));
  }

  // ---- Pass 2 : write aggregated values, one UPDATE per player ----
  const now = new Date().toISOString();
  for (const [lrId, agg] of aggregates) {
    const update = {
      season_goals: agg.goals,
      season_assists: agg.assists,
      season_games: agg.games,
      stats_updated_at: now,
    };
    const { error: ue } = await supa.from("players").update(update).eq("id", lrId);
    if (ue) {
      result.errors.push(`update ${lrId}: ${ue.message}`);
    } else {
      result.updated++;
      result.matches_detail.push({
        comp: agg.comps.join("+"),
        lr_name: agg.name,
        api_team: "(aggregated)",
        lr_club: agg.club,
        goals: agg.goals,
        assists: agg.assists,
        matches: agg.games,
      });
    }
  }

  return jsonResp(result);
});

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
