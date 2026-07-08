// Edge Function: sync-matches-apifootball
// Synchronise la table matches depuis API-Football (team Congo DR = 1508).
// Recupere les N derniers resultats + les N prochains fixtures, upsert par
// fixture_id. La cle API et le token d'appel vivent dans app_config (RLS
// sans policy : lisible uniquement en service role).
//
// Auth : verify_jwt desactive, la fonction exige l'en-tete x-sync-token
// (compare a app_config.matches_sync_token). Appelee par pg_cron chaque jour
// (job 'sync-matches-apifootball', 05h20 UTC).
//
// Deployee le 2026-07-08 (v2). Source de verite du code : ce fichier.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const TEAM_RDC = 1508;
const API_BASE = "https://v3.football.api-sports.io";

const OPPONENTS_FR: Record<string, { name: string; code: string; flag: string | null }> = {
  "Equatorial Guinea": { name: "Guinée équatoriale", code: "EQG", flag: "🇬🇶" },
  "Zimbabwe": { name: "Zimbabwe", code: "ZIM", flag: "🇿🇼" },
  "Sierra Leone": { name: "Sierra Leone", code: "SLE", flag: "🇸🇱" },
  "England": { name: "Angleterre", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "Portugal": { name: "Portugal", code: "POR", flag: "🇵🇹" },
  "Colombia": { name: "Colombie", code: "COL", flag: "🇨🇴" },
  "Uzbekistan": { name: "Ouzbékistan", code: "UZB", flag: "🇺🇿" },
  "Denmark": { name: "Danemark", code: "DEN", flag: "🇩🇰" },
  "Chile": { name: "Chili", code: "CHI", flag: "🇨🇱" },
  "Jamaica": { name: "Jamaïque", code: "JAM", flag: "🇯🇲" },
  "Bermuda": { name: "Bermudes", code: "BER", flag: "🇧🇲" },
  "Senegal": { name: "Sénégal", code: "SEN", flag: "🇸🇳" },
  "Cameroon": { name: "Cameroun", code: "CMR", flag: "🇨🇲" },
  "Nigeria": { name: "Nigeria", code: "NGA", flag: "🇳🇬" },
  "Morocco": { name: "Maroc", code: "MAR", flag: "🇲🇦" },
  "Ivory Coast": { name: "Côte d'Ivoire", code: "CIV", flag: "🇨🇮" },
};

function mapStatus(short: string): string {
  if (["NS", "TBD"].includes(short)) return "scheduled";
  if (["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "SUSP", "INT"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (short === "PST") return "postponed";
  return "cancelled"; // CANC, ABD, AWD, WO
}

function frCompetition(league: { name: string; season?: number }, round: string | null): string {
  const r = round ?? "";
  if (league.name === "World Cup") {
    const g = r.match(/Group Stage - (\d)/);
    if (g) return `Coupe du Monde ${league.season ?? ""} · Phase de groupes (J${g[1]})`.trim();
    const knockouts: Record<string, string> = {
      "Round of 32": "Seizièmes de finale",
      "Round of 16": "Huitièmes de finale",
      "Quarter-finals": "Quarts de finale",
      "Semi-finals": "Demi-finales",
      "Final": "Finale",
    };
    return `Coupe du Monde ${league.season ?? ""} · ${knockouts[r] ?? r}`.trim();
  }
  if (league.name.startsWith("Africa Cup of Nations") && league.name.includes("Qualification")) {
    const j = r.match(/Qualification - (\d)/);
    return j ? `Qualifications CAN · J${j[1]}` : "Qualifications CAN";
  }
  if (league.name === "Friendlies") return "Match amical";
  if (league.name === "Africa Cup of Nations") return `CAN ${league.season ?? ""}`.trim();
  if (league.name.includes("World Cup") && league.name.includes("Qualification")) {
    return "Qualifications Coupe du Monde";
  }
  return round ? `${league.name} · ${round}` : league.name;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth custom : token partage stocke en base
  const { data: cfg, error: cfgErr } = await supabase
    .from("app_config")
    .select("key, value")
    .in("key", ["apifootball_key", "matches_sync_token"]);
  if (cfgErr || !cfg) {
    return new Response(JSON.stringify({ error: "config unavailable" }), { status: 500 });
  }
  const conf = Object.fromEntries(cfg.map((r: { key: string; value: string }) => [r.key, r.value]));
  if (req.headers.get("x-sync-token") !== conf.matches_sync_token) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const apiHeaders = { "x-apisports-key": conf.apifootball_key };
  const urls = [
    `${API_BASE}/fixtures?team=${TEAM_RDC}&last=6`,
    `${API_BASE}/fixtures?team=${TEAM_RDC}&next=10`,
  ];

  // deno-lint-ignore no-explicit-any
  const fixtures: any[] = [];
  for (const url of urls) {
    const r = await fetch(url, { headers: apiHeaders });
    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: `api-football HTTP ${r.status}` }),
        { status: 502 },
      );
    }
    const body = await r.json();
    if (Array.isArray(body.errors) ? body.errors.length : Object.keys(body.errors ?? {}).length) {
      return new Response(JSON.stringify({ error: "api-football", detail: body.errors }), { status: 502 });
    }
    fixtures.push(...(body.response ?? []));
  }

  let upserted = 0;
  const problems: string[] = [];

  for (const f of fixtures) {
    try {
      const fx = f.fixture;
      const isHome = f.teams.home.id === TEAM_RDC;
      const oppRaw = isHome ? f.teams.away : f.teams.home;
      const opp = OPPONENTS_FR[oppRaw.name] ?? { name: oppRaw.name, code: null, flag: null };
      const status = mapStatus(fx.status?.short ?? "NS");
      const scoreRdc = isHome ? f.goals.home : f.goals.away;
      const scoreOpp = isHome ? f.goals.away : f.goals.home;

      const row = {
        fixture_id: fx.id,
        kickoff_at: fx.date,
        opponent_name: opp.name,
        opponent_code: opp.code,
        opponent_flag: opp.flag,
        competition: frCompetition(f.league ?? { name: "?" }, f.league?.round ?? null),
        venue: fx.venue?.name ?? null,
        city: fx.venue?.city ?? null,
        home_or_away: isHome ? "home" : "away",
        status,
        score_rdc: scoreRdc,
        score_opponent: scoreOpp,
        is_published: true,
        notes: `Sync API-Football ${new Date().toISOString().slice(0, 10)}`,
        updated_at: new Date().toISOString(),
      };

      // Les matchs deja verifies FIFA a la main sont figes : le sync ne les
      // reecrit pas (tournoi termine, aucun champ ne doit plus bouger).
      const FROZEN = [1539003, 1539008, 1539013, 1567307, 1543822, 1544367];
      if (FROZEN.includes(fx.id)) {
        continue;
      }

      const { error } = await supabase
        .from("matches")
        .upsert(row, { onConflict: "fixture_id" });
      if (error) {
        problems.push(`${fx.id}: ${error.message}`);
      } else {
        upserted++;
      }
    } catch (e) {
      problems.push(String(e).slice(0, 120));
    }
  }

  await supabase.from("sync_logs").insert({
    job_name: "sync-matches-apifootball",
    status: problems.length === 0 ? "success" : (upserted > 0 ? "partial" : "failure"),
    players_processed: fixtures.length,
    players_updated: upserted,
    errors_count: problems.length,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({ fetched: fixtures.length, upserted, problems }),
    { headers: { "Content-Type": "application/json" } },
  );
});
