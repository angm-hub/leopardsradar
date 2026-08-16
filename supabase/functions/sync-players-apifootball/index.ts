// sync-players-apifootball
// ─────────────────────────────────────────────────────────────────────────────
// Récupère les statistiques de saison (matchs, buts, passes, minutes, note)
// via API-Football (api-sports v3) et les écrit dans public.players, pour
// nourrir le score Léopards (axes A1 impact, A2 volume) et l'axe note client.
//
// Le score Léopards (compute_leopards_score) s'active dès 2 axes dispo :
//   A1 impact = (buts+passes)/90 (min >= 450), A2 volume = minutes,
//   A3 valeur marchande, A4 selections. Remplir les minutes debloque A1+A2.
//
// Auth : token partage dans app_config.players_sync_token (header x-sync-token).
// Clé API : app_config.apifootball_key. Deployer avec verify_jwt=false.
//
// Body JSON (POST) :
//   { "token": "...", "season": 2025, "limit": 50,
//     "only_confirmed": false, "only_missing_stats": true, "persist_apf_id": true }
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const API_BASE = "https://v3.football.api-sports.io";
const DEFAULT_SEASON = 2025; // saison 2025-2026 (API-Football = annee de debut)
const CALL_DELAY_MS = 350;   // pacing anti rate-limit

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function lastNameQuery(name: string): string {
  const parts = (name || "").trim().split(/\s+/);
  return parts.length ? parts[parts.length - 1] : name;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── config + secrets depuis app_config ────────────────────────────────────
  const { data: cfg, error: cfgErr } = await supabase.from("app_config")
    .select("key, value").in("key", ["apifootball_key", "players_sync_token"]);
  if (cfgErr) return json({ error: "app_config unreadable", detail: cfgErr.message }, 500);
  const conf = Object.fromEntries((cfg ?? []).map((r) => [r.key, r.value]));
  const apiKey = conf.apifootball_key;
  if (!apiKey) return json({ error: "apifootball_key manquant dans app_config" }, 500);

  // ── auth ──────────────────────────────────────────────────────────────────
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* body vide accepte */ }
  const token = (body.token as string) ?? req.headers.get("x-sync-token") ?? "";
  if (conf.players_sync_token && token !== conf.players_sync_token) {
    return json({ error: "token invalide" }, 401);
  }

  const season = Number(body.season ?? DEFAULT_SEASON);
  const limit = Math.min(Number(body.limit ?? 40), 300);
  const onlyConfirmed = body.only_confirmed === true;
  const onlyMissingStats = body.only_missing_stats !== false; // defaut true
  const persistApfId = body.persist_apf_id === true;
  const apiHeaders = { "x-apisports-key": apiKey };

  // ── selection des joueurs a traiter ───────────────────────────────────────
  let q = supabase.from("players")
    .select("id, name, date_of_birth, transfermarkt_id, radar_tier, season_minutes, season_games")
    .eq("archived", false)
    .neq("eligibility_status", "ineligible")
    .order("stats_updated_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (onlyConfirmed) q = q.in("radar_tier", ["TIER1_CONFIRME", "TIER2_TRES_PROBABLE"]);
  if (onlyMissingStats) q = q.or("season_games.is.null,season_games.eq.0");

  const { data: players, error: selErr } = await q;
  if (selErr) return json({ error: "select players failed", detail: selErr.message }, 500);

  const started = new Date().toISOString();
  let processed = 0, matched = 0, updated = 0, errors = 0;
  const details: Array<Record<string, unknown>> = [];

  const apiGet = async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: apiHeaders });
    if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
    return await res.json();
  };

  for (const p of players ?? []) {
    processed++;
    try {
      const tm = String(p.transfermarkt_id ?? "").trim();
      let apfId: string | null = tm.startsWith("apf-") ? tm.slice(4) : null;

      // Fallback : match par nom (last name) + date de naissance stricte.
      if (!apfId) {
        if (!p.date_of_birth) { details.push({ id: p.id, skip: "no_dob" }); continue; }
        const prof = await apiGet(`/players/profiles?search=${encodeURIComponent(lastNameQuery(p.name))}`);
        await sleep(CALL_DELAY_MS);
        const hit = (prof?.response ?? []).find(
          (r: any) => r?.player?.birth?.date === p.date_of_birth,
        );
        if (!hit) { details.push({ id: p.id, name: p.name, skip: "no_apf_match" }); continue; }
        apfId = String(hit.player.id);
        if (persistApfId && !tm) {
          await supabase.from("players").update({ transfermarkt_id: `apf-${apfId}` }).eq("id", p.id);
        }
      }
      matched++;

      // Stats de saison (statistics[] = un bloc par competition -> agreger).
      const stats = await apiGet(`/players?id=${apfId}&season=${season}`);
      await sleep(CALL_DELAY_MS);
      const arr = stats?.response?.[0]?.statistics ?? [];
      let games = 0, goals = 0, assists = 0, minutes = 0, ratingWeighted = 0, ratingMin = 0;
      for (const s of arr) {
        const g = Number(s?.games?.appearences ?? 0);   // API spelling: appearences
        const m = Number(s?.games?.minutes ?? 0);
        games += g;
        minutes += m;
        goals += Number(s?.goals?.total ?? 0);
        assists += Number(s?.goals?.assists ?? 0);        // assists sous goals.assists
        const r = parseFloat(s?.games?.rating ?? "");
        if (!isNaN(r) && m > 0) { ratingWeighted += r * m; ratingMin += m; }
      }
      const rating = ratingMin > 0 ? Math.round((ratingWeighted / ratingMin) * 100) / 100 : null;

      // On n'ecrase pas des stats existantes par des zeros vides.
      if (games === 0 && minutes === 0 && (p.season_games ?? 0) > 0) {
        details.push({ id: p.id, name: p.name, apf: apfId, skip: "empty_would_wipe" });
        continue;
      }

      const { error: upErr } = await supabase.from("players").update({
        season_games: games, season_goals: goals, season_assists: assists,
        season_minutes: minutes, season_rating: rating,
        stats_updated_at: new Date().toISOString(),
      }).eq("id", p.id);
      if (upErr) throw new Error(upErr.message);

      updated++;
      details.push({ id: p.id, name: p.name, apf: apfId, games, goals, assists, minutes, rating });
    } catch (e) {
      errors++;
      details.push({ id: p.id, name: p.name, error: String(e?.message ?? e) });
    }
  }

  const finished = new Date().toISOString();
  await supabase.from("sync_logs").insert({
    job_name: "sync-players-apifootball",
    status: errors > processed / 2 ? "partial" : "ok",
    players_processed: processed, players_updated: updated, errors_count: errors,
    started_at: started, finished_at: finished,
  });

  return json({ season, processed, matched, updated, errors, details });
});
