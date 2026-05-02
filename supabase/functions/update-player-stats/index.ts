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
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FD_API = "https://api.football-data.org/v4";

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

  // ---- Load all eligible LR players we want to enrich ----
  const { data: players, error: loadErr } = await supa
    .from("players")
    .select("id, name")
    .neq("eligibility_status", "ineligible");

  if (loadErr) {
    return jsonResp({ ok: false, error: loadErr.message }, 500);
  }

  // Build the normalised name → id lookup once.
  const lookup = new Map<string, number>();
  for (const p of players || []) {
    lookup.set(normalize(p.name as string), p.id as number);
  }

  const result = {
    ok: true,
    competitions: COMPS.length,
    players_in_db: players?.length ?? 0,
    matched: 0,
    updated: 0,
    errors: [] as string[],
  };

  for (const comp of COMPS) {
    try {
      const r = await fetch(
        `${FD_API}/competitions/${comp.code}/scorers?limit=100`,
        { headers: { "X-Auth-Token": fdKey } },
      );
      if (!r.ok) {
        result.errors.push(`${comp.code}: HTTP ${r.status}`);
      } else {
        const data = await r.json();
        for (const sc of data.scorers || []) {
          const lrId = lookup.get(normalize(sc.player?.name || ""));
          if (!lrId) continue;
          result.matched++;
          const update = {
            season_goals: sc.goals ?? 0,
            season_assists: sc.assists ?? 0,
            season_games: sc.playedMatches ?? 0,
            stats_updated_at: new Date().toISOString(),
          };
          const { error: ue } = await supa
            .from("players")
            .update(update)
            .eq("id", lrId);
          if (ue) result.errors.push(`update ${lrId}: ${ue.message}`);
          else result.updated++;
        }
      }
    } catch (e) {
      result.errors.push(`${comp.code}: ${(e as Error).message}`);
    }
    // pace requests to stay under 10 req/min
    await new Promise((res) => setTimeout(res, RATE_LIMIT_DELAY_MS));
  }

  return jsonResp(result);
});

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
