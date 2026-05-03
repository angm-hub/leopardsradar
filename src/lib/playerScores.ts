import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

/**
 * Player statistical profile — score model.
 *
 * Computes 6 axes per player, mapped to a 0-100 scale, suitable for a
 * radar/hexagon visualisation. Architecture :
 *
 *   - 4 universal axes (same definition for every position) : Volume,
 *     Régularité, Niveau championnat, Présence Léopards
 *   - 2 position-specific axes that anchor the silhouette to the role :
 *     a Goalkeeper hexagon never reads like an Attacker hexagon.
 *
 * Source data : `season_*` fields from the players table + a manually
 * curated club → league tier mapping. No external dependency in V1.
 *
 * Each score is bounded [0, 100]. When a metric is unknown (data gap),
 * we return `null` instead of a fictitious zero — the UI then renders an
 * "—" mark and collapses that axis to the centre. Honesty over polish.
 */

// ---------- Types ----------

export type AxisKey =
  | "volume"
  | "regularity"
  | "league"
  | "leopards"
  | "role_a" // first role-specific axis
  | "role_b"; // second role-specific axis

export interface AxisScore {
  /** Score in [0, 100], or null when the underlying data is missing. */
  value: number | null;
  /** Short label shown around the hexagon (mono uppercase, ~12 chars max). */
  label: string;
  /** Long form shown on hover / in the legend. */
  fullLabel: string;
  /** Raw human-readable value (e.g. "0.32 buts/90", "27 caps"), shown next to the axis name. */
  raw: string;
}

export interface PlayerScores {
  axes: Record<AxisKey, AxisScore>;
  /** Order to render the 6 vertices, clockwise from the top. */
  order: AxisKey[];
  /** Position the score model was computed for ("Attaquant", etc.). Null if no position. */
  positionLabel: string | null;
}

// ---------- Club → league tier mapping ----------

/**
 * Tier of the player's current league. Used as a quality multiplier on
 * the "Niveau championnat" axis. Curated by hand because no free API
 * gives a reliable league tier mapping post FBref shutdown (2026).
 *
 *  - 100 : Premier League, La Liga, Bundesliga, Serie A, Ligue 1
 *  - 70  : Eredivisie, Primeira Liga, Belgian Pro League, Süper Lig,
 *          Championship, Bundesliga 2, Serie B, La Liga 2, MLS
 *  - 45  : other top European leagues, Saudi Pro League, Brasileirão
 *  - 25  : everything else
 *
 * The matching is token-based (see clubMatches() below) so trivial
 * variations like "Real Betis" vs "Real Betis Balompié" both resolve.
 */
const T1_CLUBS = new Set([
  // Premier League
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton & Hove Albion",
  "Chelsea", "Crystal Palace", "Everton", "Fulham", "Liverpool",
  "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest",
  "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers",
  // La Liga
  "Real Madrid", "FC Barcelona", "Atlético Madrid", "Sevilla FC", "Real Betis",
  "Real Sociedad", "Athletic Bilbao", "Villarreal CF", "Valencia CF",
  // Bundesliga
  "Bayern München", "Borussia Dortmund", "RB Leipzig", "Bayer 04 Leverkusen",
  "Eintracht Frankfurt", "VfB Stuttgart", "Borussia Mönchengladbach",
  "VfL Wolfsburg", "SC Freiburg", "TSG Hoffenheim",
  // Serie A
  "Inter", "AC Milan", "Juventus FC", "SSC Napoli", "AS Roma", "Lazio",
  "Atalanta", "ACF Fiorentina", "Bologna FC",
  // Ligue 1 (saison 2025-26)
  "Paris Saint-Germain", "Olympique Marseille", "AS Monaco", "OGC Nice",
  "Olympique Lyonnais", "RC Lens", "LOSC Lille", "Stade Rennais",
  "Stade Brestois 29", "FC Metz", "FC Nantes", "FC Lorient",
  "Le Havre AC", "Angers SCO", "AJ Auxerre", "Toulouse FC",
  "Stade de Reims", "Montpellier HSC", "FC Toulouse",
]);

const T2_CLUBS = new Set([
  // Championship
  "Burnley", "Leeds United", "Sunderland AFC", "Sheffield United",
  "Stoke City", "Hull City", "Watford", "Sheffield Wednesday",
  "West Bromwich Albion", "Plymouth Argyle", "Rotherham United",
  "Cambridge United", "Cardiff City", "Ipswich Town",
  // Eredivisie
  "Ajax", "PSV Eindhoven", "Feyenoord", "AZ Alkmaar", "FC Twente",
  "Sparta Rotterdam", "FC Volendam", "Fortuna Sittard", "NEC Nijmegen",
  // Primeira Liga
  "FC Porto", "SL Benfica", "Sporting CP", "Braga", "Vitória SC",
  "Rio Ave",
  // Belgian Pro League (D1A)
  "Royal Antwerp", "Club Brugge", "RSC Anderlecht", "KAA Gent",
  "Standard Liège", "Royal Léopold", "Royale Union Saint-Gilloise",
  "KRC Genk", "KV Mechelen", "Cercle Brugge", "Beerschot",
  "Westerlo", "Kortrijk", "OH Leuven",
  // Süper Lig
  "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor",
  "Sivasspor", "Samsunspor", "Bandirmaspor", "Alanyaspor",
  // Swiss Super League
  "BSC Young Boys", "FC Basel", "Servette", "FC Zürich", "FC Lugano",
  "FC Luzern", "Lausanne-Sport", "Grasshopper",
  // Polish Ekstraklasa
  "Legia Warszawa", "Lech Poznań", "Jagiellonia Bialystok", "Raków Częstochowa",
  // Scottish Premiership
  "Celtic FC", "Rangers FC", "Hearts of Midlothian", "Hibernian",
  "Aberdeen FC",
  // Greek Super League / Cyprus
  "Olympiacos", "Panathinaikos", "AEK Athens", "PAOK", "APOEL",
  "Aris Limassol",
  // Bundesliga 2 / Serie B / La Liga 2 / Ligue 2
  "Hannover 96", "Hertha BSC", "Hamburger SV", "FC St. Pauli",
  "Cremonese", "Frosinone", "Empoli", "Cagliari",
  "Real Valladolid", "Granada", "Las Palmas", "Castellón",
  "SM Caen", "Saint-Étienne",
  "Red Star FC", "Pau FC", "EA Guingamp", "Bastia",
  "Quevilly Rouen", "USL Dunkerque",
  // MLS
  "Inter Miami", "LAFC", "LA Galaxy", "Toronto FC", "Atlanta United",
  // Forge FC (Canadian Premier League — kept low T2 for diaspora visibility)
  "Forge FC",
]);

// Tokens too generic to use as match keys ("FC", "United"...).
const CLUB_STOPWORDS = new Set([
  "fc", "cf", "ac", "sc", "sk", "as", "ss", "ssc", "us", "vfb", "vfl",
  "sv", "sg", "de", "of", "the", "la", "le", "el", "al", "club", "calcio",
  "city", "united", "olympique", "royal", "royale", "sporting", "stade",
  "1893", "1899", "1909", "1900", "1903", "1904", "1905", "1906", "1907", "1908",
  "primavera", "futures", "u21", "u23",
]);

function clubTokens(club: string): Set<string> {
  return new Set(
    club
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !CLUB_STOPWORDS.has(t)),
  );
}

const T1_TOKEN_SETS = [...T1_CLUBS].map((c) => ({ club: c, tokens: clubTokens(c) }));
const T2_TOKEN_SETS = [...T2_CLUBS].map((c) => ({ club: c, tokens: clubTokens(c) }));

function tokenOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const t of a) if (b.has(t)) return true;
  return false;
}

/**
 * Map a current_club string to a league tier score 0-100.
 * Token-based fuzzy match so name variations resolve transparently
 * ("Real Betis" / "Real Betis Balompié" / "Newcastle United" / "Newcastle United FC").
 * Returns null when no club is provided ; never null when we have a club —
 * unknown clubs land at 45 (T3 estimate) so the axis stays informative.
 */
export function leagueTierScore(currentClub: string | null): number | null {
  if (!currentClub) return null;
  const tokens = clubTokens(currentClub);
  if (tokens.size === 0) return 45;
  for (const entry of T1_TOKEN_SETS) {
    if (tokenOverlap(tokens, entry.tokens)) return 100;
  }
  for (const entry of T2_TOKEN_SETS) {
    if (tokenOverlap(tokens, entry.tokens)) return 70;
  }
  return 45;
}

// ---------- Score computations ----------

const FULL_SEASON_MIN = 38 * 90; // 3420 min ≈ 100 % minutes baseline (top 5 leagues)
const ESTIMATED_MIN_PER_GAME = 80; // proxy for an average starter

function clamp01to100(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

/**
 * Best-effort minutes : prefer the explicit `season_minutes` if we have it,
 * otherwise estimate from `season_games × 80` (a reasonable proxy for an
 * average starter in a top European league). Returns null when neither is
 * available so the dependent axes can collapse to "—".
 *
 * The estimation is honest about its nature — the methodology page mentions
 * that the football-data.org free /scorers endpoint exposes goals + assists
 * + matches but not minutes. The hexagon is a snapshot of the silhouette,
 * not a financial figure ; a games-based estimate keeps the silhouette
 * meaningful for the dozens of attackers we now track.
 */
function effectiveMinutes(games: number, minutes: number): number | null {
  if (minutes > 0) return minutes;
  if (games > 0) return games * ESTIMATED_MIN_PER_GAME;
  return null;
}

/** Volume — % of a full season's minutes the player has logged. */
function volumeScore(games: number, minutes: number): number | null {
  const m = effectiveMinutes(games, minutes);
  if (m === null) return null;
  return clamp01to100((m / FULL_SEASON_MIN) * 100);
}

/**
 * Régularité — average minutes per appearance, mapped so that 90 min/game
 * = 100 (always plays the full match). When `season_minutes` is missing,
 * the proxy collapses to the estimation constant (80) which scores ~89 —
 * conservative but readable.
 */
function regularityScore(games: number, minutes: number): number | null {
  if (games <= 0) return null;
  const m = effectiveMinutes(games, minutes);
  if (m === null) return null;
  const minPerGame = m / games;
  return clamp01to100((minPerGame / 90) * 100);
}

/**
 * Léopards — caps_rdc per "year of senior eligibility" (age - 16),
 * mapped so that ~3 caps/year = 100 (very engaged international).
 * A 28-year-old with 36 caps scores ~100 ; a 22-year-old with 6 caps
 * scores ~33.
 */
function leopardsScore(caps: number, age: number | null): number | null {
  if (caps <= 0) return 0;
  const seniorYears = age && age > 16 ? age - 16 : null;
  if (!seniorYears) return clamp01to100(caps * 5); // fallback when age missing
  const capsPerYear = caps / seniorYears;
  return clamp01to100((capsPerYear / 3) * 100);
}

/**
 * Goals or assists per 90 → 0-100 score. 1 goal/90 = 100 for an attacker.
 * Uses `effectiveMinutes` so the score stays meaningful when only games
 * are populated (the football-data.org /scorers endpoint case).
 */
function per90Score(absolute: number, games: number, minutes: number, target: number): number | null {
  const m = effectiveMinutes(games, minutes);
  if (m === null) return null;
  const per90 = (absolute * 90) / m;
  return clamp01to100((per90 / target) * 100);
}

// ---------- Per-position axis recipes ----------

interface RoleAxes {
  positionLabel: string;
  roleA: (player: DBPlayer) => AxisScore;
  roleB: (player: DBPlayer) => AxisScore;
}

const goalkeeperAxes: RoleAxes = {
  positionLabel: "Gardien",
  // We don't have clean sheets / goals against in DB → fall back to
  // graceful unknowns. When the edge function ships, this will populate.
  roleA: () => ({
    value: null,
    label: "Clean sheets",
    fullLabel: "Matchs sans encaisser (% des matchs joués)",
    raw: "—",
  }),
  roleB: () => ({
    value: null,
    label: "Buts encaissés",
    fullLabel: "Buts encaissés / 90 min (inversé : moins = plus haut)",
    raw: "—",
  }),
};

const defenderAxes: RoleAxes = {
  positionLabel: "Défenseur",
  roleA: () => ({
    value: null,
    label: "Solidité",
    fullLabel: "Buts encaissés équipe / 90 (inversé) — donnée à venir",
    raw: "—",
  }),
  roleB: () => ({
    value: null,
    label: "Construction",
    fullLabel: "Passes complétées % — donnée à venir",
    raw: "—",
  }),
};

const midfieldAxes: RoleAxes = {
  positionLabel: "Milieu",
  // Création approximée par les passes décisives observables.
  roleA: (p) => {
    const score = per90Score(p.season_assists, p.season_games, p.season_minutes, 0.4);
    const per90 =
      p.season_minutes > 0
        ? ((p.season_assists * 90) / p.season_minutes).toFixed(2)
        : null;
    return {
      value: score,
      label: "Création",
      fullLabel: "Passes décisives par 90 min",
      raw: per90 ? `${per90} PD/90` : "—",
    };
  },
  roleB: () => ({
    value: null,
    label: "Activité",
    fullLabel: "Tackles + interceptions / 90 — donnée à venir",
    raw: "—",
  }),
};

const attackerAxes: RoleAxes = {
  positionLabel: "Attaquant",
  roleA: (p) => {
    // 1 but / 90 = 100. Saka 2023-24 ≈ 0.4. Haaland ≈ 1.0+.
    const score = per90Score(p.season_goals, p.season_games, p.season_minutes, 1);
    const per90 =
      p.season_minutes > 0
        ? ((p.season_goals * 90) / p.season_minutes).toFixed(2)
        : null;
    return {
      value: score,
      label: "Finition",
      fullLabel: "Buts par 90 min",
      raw: per90 ? `${per90} buts/90` : "—",
    };
  },
  roleB: (p) => {
    // 0.4 PD/90 = 100 (Saka tier).
    const score = per90Score(p.season_assists, p.season_games, p.season_minutes, 0.4);
    const per90 =
      p.season_minutes > 0
        ? ((p.season_assists * 90) / p.season_minutes).toFixed(2)
        : null;
    return {
      value: score,
      label: "Création",
      fullLabel: "Passes décisives par 90 min",
      raw: per90 ? `${per90} PD/90` : "—",
    };
  },
};

const ROLE_AXES: Record<DBPosition, RoleAxes> = {
  Goalkeeper: goalkeeperAxes,
  Defender: defenderAxes,
  Midfield: midfieldAxes,
  Attack: attackerAxes,
};

// ---------- Public API ----------

/**
 * Compute the 6 axis scores for a player. Always returns a complete
 * shape — missing data is signalled by null values and "—" raw labels.
 */
export function computePlayerScores(player: DBPlayer): PlayerScores {
  const role = player.position ? ROLE_AXES[player.position] : null;

  const volume: AxisScore = {
    value: volumeScore(player.season_games, player.season_minutes),
    label: "Volume",
    fullLabel: "% des minutes possibles d'une saison complète",
    raw:
      player.season_minutes > 0
        ? `${player.season_minutes.toLocaleString("fr-FR")} min`
        : "—",
  };

  const regularity: AxisScore = {
    value: regularityScore(player.season_games, player.season_minutes),
    label: "Régularité",
    fullLabel: "Minutes moyennes par match (titulaire ≈ 90)",
    raw:
      player.season_games > 0 && player.season_minutes > 0
        ? `${Math.round(player.season_minutes / player.season_games)} min/match`
        : "—",
  };

  const league: AxisScore = {
    value: leagueTierScore(player.current_club),
    label: "Niveau",
    fullLabel: "Tier UEFA du championnat actuel",
    raw: leagueTierLabel(player.current_club),
  };

  const leopards: AxisScore = {
    value: leopardsScore(player.caps_rdc, player.age),
    label: "Léopards",
    fullLabel: "Sélections RDC normalisées par âge",
    raw:
      player.caps_rdc > 0
        ? `${player.caps_rdc} cap${player.caps_rdc > 1 ? "s" : ""}`
        : "—",
  };

  const roleA: AxisScore = role
    ? role.roleA(player)
    : { value: null, label: "—", fullLabel: "", raw: "—" };

  const roleB: AxisScore = role
    ? role.roleB(player)
    : { value: null, label: "—", fullLabel: "", raw: "—" };

  return {
    axes: { volume, regularity, league, leopards, role_a: roleA, role_b: roleB },
    // Clockwise from the top : universals top, then role A right, role B
    // bottom-right, regularity bottom, league bottom-left, léopards left.
    // This keeps the silhouette readable across positions.
    order: ["volume", "role_a", "role_b", "regularity", "league", "leopards"],
    positionLabel: role?.positionLabel ?? null,
  };
}

function leagueTierLabel(club: string | null): string {
  if (!club) return "—";
  const score = leagueTierScore(club);
  if (score === 100) return "Top 5 EU";
  if (score === 70) return "Sous-élite";
  return "Autre";
}
