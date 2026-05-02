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
  // Ligue 1
  "Paris Saint-Germain", "Olympique Marseille", "AS Monaco", "OGC Nice",
  "Olympique Lyonnais", "RC Lens", "LOSC Lille", "Stade Rennais", "Stade Brestois 29",
]);

const T2_CLUBS = new Set([
  // Championship
  "Burnley", "Leeds United", "Sunderland AFC", "Sheffield United",
  // Eredivisie
  "Ajax", "PSV Eindhoven", "Feyenoord", "AZ Alkmaar", "FC Twente",
  // Primeira Liga
  "FC Porto", "SL Benfica", "Sporting CP", "Braga", "Vitória SC",
  // Belgian Pro League
  "Royal Antwerp", "Club Brugge", "RSC Anderlecht", "KAA Gent", "Standard Liège",
  "Royal Léopold FC", "Royale Union Saint-Gilloise",
  // Süper Lig
  "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor",
  // Bundesliga 2 / Serie B / La Liga 2 / Ligue 2
  "Hannover 96", "Hertha BSC", "Hamburger SV", "FC St. Pauli",
  "Cremonese", "Frosinone", "Empoli", "Cagliari",
  "Real Valladolid", "Granada", "Las Palmas",
  "SM Caen", "FC Metz", "Le Havre AC", "AJ Auxerre", "Saint-Étienne",
  // MLS
  "Inter Miami", "LAFC", "LA Galaxy", "Toronto FC", "Atlanta United",
  // Forge FC (Canadian Premier League — kept low T2 for diaspora visibility)
  "Forge FC",
]);

/**
 * Map a current_club string to a league tier score 0-100.
 * Returns null when the club is unknown — the axis falls back to "—".
 */
export function leagueTierScore(currentClub: string | null): number | null {
  if (!currentClub) return null;
  if (T1_CLUBS.has(currentClub)) return 100;
  if (T2_CLUBS.has(currentClub)) return 70;
  // Unknown European / world clubs default to T3 estimate, not null,
  // because we have a club name — we just don't recognise it.
  return 45;
}

// ---------- Score computations ----------

const FULL_SEASON_MIN = 38 * 90; // 3420 min ≈ 100 % minutes baseline (top 5 leagues)

function clamp01to100(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

/** Volume — % of a full season's minutes the player has logged. */
function volumeScore(minutes: number): number | null {
  if (minutes <= 0) return null;
  return clamp01to100((minutes / FULL_SEASON_MIN) * 100);
}

/**
 * Régularité — average minutes per appearance, mapped so that 90 min/game
 * = 100 (always plays the full match). Not the same as "matches started"
 * (we don't have that field), but a good proxy : a sub gets ~30 min, a
 * starter gets 80-90 min.
 */
function regularityScore(games: number, minutes: number): number | null {
  if (games <= 0 || minutes <= 0) return null;
  const minPerGame = minutes / games;
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

/** Goals or assists per 90 → 0-100 score. 1 goal/90 = 100 for an attacker. */
function per90Score(absolute: number, minutes: number, target: number): number | null {
  if (minutes <= 0) return null;
  const per90 = (absolute * 90) / minutes;
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
    const score = per90Score(p.season_assists, p.season_minutes, 0.4);
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
    const score = per90Score(p.season_goals, p.season_minutes, 1);
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
    const score = per90Score(p.season_assists, p.season_minutes, 0.4);
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
    value: volumeScore(player.season_minutes),
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
  if (T1_CLUBS.has(club)) return "Top 5 EU";
  if (T2_CLUBS.has(club)) return "Sous-élite";
  return "Autre";
}
