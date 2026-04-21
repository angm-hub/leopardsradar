// Sync DR Congo national team matches from TheSportsDB
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RDC_TEAM_ID = "136475"; // DR Congo (TheSportsDB)
// Strict match only — "Congo" alone refers to Congo-Brazzaville and gives wrong data.
const RDC_NAMES = ["DR Congo", "Congo DR"];

interface TsdbEvent {
  idEvent: string;
  strEvent?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strLeague?: string;
  strTimestamp?: string | null;
  dateEvent?: string;
  strTime?: string;
  strVenue?: string | null;
  strCity?: string | null;
  strCountry?: string | null;
  strStatus?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
}

function isRdc(name: string | undefined): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  // Exact-ish match: must literally contain "dr congo" or "congo dr".
  return RDC_NAMES.some((x) => n === x.toLowerCase() || n.includes(x.toLowerCase()));
}

function mapStatus(s: string | null | undefined): string {
  if (!s) return "scheduled";
  const x = s.toLowerCase();
  if (x.includes("finished") || x.includes("ft")) return "finished";
  if (x.includes("live") || x.includes("ht") || x.includes("1h") || x.includes("2h")) return "live";
  if (x.includes("postponed")) return "postponed";
  if (x.includes("cancel")) return "cancelled";
  return "scheduled";
}

function buildKickoff(e: TsdbEvent): string | null {
  if (e.strTimestamp) {
    const d = new Date(e.strTimestamp + "Z");
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  if (e.dateEvent) {
    const t = e.strTime && e.strTime !== "00:00:00" ? e.strTime : "18:00:00";
    const d = new Date(`${e.dateEvent}T${t}Z`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function competitionShort(league: string | undefined): string {
  if (!league) return "International";
  const l = league.toLowerCase();
  if (l.includes("world cup qualifying caf") || l.includes("wc qualifying") || l.includes("world cup qual")) return "Qualif. CDM";
  if (l.includes("inter-confederation")) return "Barrages CDM";
  if (l.includes("african cup of nations qualifying") || l.includes("afcon qualifying") || l.includes("afcon qual")) return "Qualif. CAN";
  if (l.includes("african cup of nations") || l.includes("afcon")) return "CAN";
  if (l.includes("fifa world cup")) return "Coupe du monde";
  if (l.includes("friendly")) return "Amical";
  return league;
}

const FLAGS: Record<string, string> = {
  "morocco": "🇲🇦", "senegal": "🇸🇳", "ivory coast": "🇨🇮", "cote d'ivoire": "🇨🇮",
  "nigeria": "🇳🇬", "ghana": "🇬🇭", "cameroon": "🇨🇲", "egypt": "🇪🇬",
  "algeria": "🇩🇿", "tunisia": "🇹🇳", "mali": "🇲🇱", "guinea": "🇬🇳",
  "burkina faso": "🇧🇫", "south africa": "🇿🇦", "zambia": "🇿🇲", "angola": "🇦🇴",
  "uganda": "🇺🇬", "kenya": "🇰🇪", "tanzania": "🇹🇿", "rwanda": "🇷🇼",
  "burundi": "🇧🇮", "central african republic": "🇨🇫", "gabon": "🇬🇦",
  "congo": "🇨🇬", "equatorial guinea": "🇬🇶", "togo": "🇹🇬", "benin": "🇧🇯",
  "mauritania": "🇲🇷", "sudan": "🇸🇩", "south sudan": "🇸🇸", "ethiopia": "🇪🇹",
  "namibia": "🇳🇦", "botswana": "🇧🇼", "zimbabwe": "🇿🇼", "mozambique": "🇲🇿",
  "madagascar": "🇲🇬", "comoros": "🇰🇲", "cape verde": "🇨🇻", "gambia": "🇬🇲",
  "guinea-bissau": "🇬🇼", "liberia": "🇱🇷", "sierra leone": "🇸🇱",
  "jamaica": "🇯🇲", "france": "🇫🇷", "belgium": "🇧🇪", "england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "brazil": "🇧🇷", "argentina": "🇦🇷",
};
function flagFor(name: string): string | null {
  return FLAGS[name.toLowerCase().trim()] ?? null;
}
function code3(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

async function fetchTsdb(path: string): Promise<TsdbEvent[]> {
  const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/${path}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events || data.results || []) as TsdbEvent[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const [next, last] = await Promise.all([
      fetchTsdb(`eventsnext.php?id=${RDC_TEAM_ID}`),
      fetchTsdb(`eventslast.php?id=${RDC_TEAM_ID}`),
    ]);

    // TheSportsDB sometimes returns wrong events for national team IDs — filter strictly.
    const all = [...next, ...last].filter(
      (e) => isRdc(e.strHomeTeam) || isRdc(e.strAwayTeam) ||
             e.idHomeTeam === RDC_TEAM_ID || e.idAwayTeam === RDC_TEAM_ID,
    );

    const seen = new Set<string>();
    const rows: any[] = [];
    for (const e of all) {
      if (seen.has(e.idEvent)) continue;
      seen.add(e.idEvent);

      const rdcIsHome = isRdc(e.strHomeTeam) || e.idHomeTeam === RDC_TEAM_ID;
      const opponentName = rdcIsHome ? e.strAwayTeam : e.strHomeTeam;
      const kickoff = buildKickoff(e);
      if (!kickoff || !opponentName) continue;

      const status = mapStatus(e.strStatus);
      const homeScore = e.intHomeScore != null ? Number(e.intHomeScore) : null;
      const awayScore = e.intAwayScore != null ? Number(e.intAwayScore) : null;

      rows.push({
        external_id: `tsdb:${e.idEvent}`,
        source: "thesportsdb",
        kickoff_at: kickoff,
        opponent_name: opponentName,
        opponent_code: code3(opponentName),
        opponent_flag: flagFor(opponentName),
        competition: competitionShort(e.strLeague),
        venue: e.strVenue ?? null,
        city: e.strCity ?? null,
        country: e.strCountry ?? null,
        home_or_away: rdcIsHome ? "home" : "away",
        status,
        score_rdc: status === "finished" ? (rdcIsHome ? homeScore : awayScore) : null,
        score_opponent: status === "finished" ? (rdcIsHome ? awayScore : homeScore) : null,
        is_published: true,
        updated_at: new Date().toISOString(),
      });
    }

    // Never overwrite manually curated matches (Wikipedia-sourced, etc.)
    let upserted = 0;
    let skipped = 0;
    if (rows.length) {
      const externalIds = rows.map((r) => r.external_id);
      const { data: existing } = await supabase
        .from("matches")
        .select("external_id, source")
        .in("external_id", externalIds);
      const protectedIds = new Set(
        (existing ?? [])
          .filter((r: any) => typeof r.source === "string" && r.source.startsWith("manual"))
          .map((r: any) => r.external_id),
      );
      const safeRows = rows.filter((r) => !protectedIds.has(r.external_id));
      skipped = rows.length - safeRows.length;
      if (safeRows.length) {
        const { error, count } = await supabase
          .from("matches")
          .upsert(safeRows, { onConflict: "external_id", count: "exact" });
        if (error) throw error;
        upserted = count ?? safeRows.length;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, fetched: all.length, upserted, sample: rows.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sync-matches failed:", e);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
