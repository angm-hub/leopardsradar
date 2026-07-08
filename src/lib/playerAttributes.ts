/**
 * playerAttributes.ts — 15 attributs /20 style ScoutingStats
 *
 * Calcule 15 attributs notés 1-20 pour un joueur de champ, groupés en 3 familles :
 *   ATTACKING (5) · TECHNICAL (5) · PHYSICAL (5)
 *
 * Méthode :
 *   1. Calculer la valeur brute de chaque attribut depuis player_stats_advanced
 *   2. Ranker le joueur vs tous les joueurs du même poste (Defender / Midfield / Attack)
 *   3. Percentile → note 1-20 : Math.round((percentile / 100) * 19) + 1
 *   4. Si data manquante : null (affiché "n.d." en UI, jamais 0)
 *
 * GK : 5 attributs spécifiques remplacent les 15 standards (saves, clean_sheets, etc.)
 *
 * Pour V1 : proxy honnête — toutes les vraies stats Wyscout-grade ne sont pas dispo.
 * Les notes donnent une idée réaliste du profil, pas une précision scientifique.
 */

import type { DBPosition } from "@/types/dbPlayer";

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────

export interface PlayerStatsAdvancedRow {
  // Identité
  player_id: number;
  season: string;
  competition: string;
  competition_tier: number | null;
  matches_played: number;
  minutes_played: number;
  // Offensif
  goals: number;
  assists: number;
  xg: number | null;
  xag: number | null;
  key_passes: number | null;
  // Possession
  progressive_carries: number | null;
  progressive_passes: number | null;
  touches: number | null;
  carries: number | null;
  dribbles_completed: number | null;
  dribbles_attempted: number | null;
  long_pass_pct: number | null;
  // Défensif
  tackles_won: number | null;
  interceptions: number | null;
  blocks: number | null;
  clearances: number | null;
  aerial_duels_won: number | null;
  aerial_duels_total: number | null;
  high_recoveries: number | null;
  // GK
  saves: number | null;
  shots_on_target_faced: number | null;
  clean_sheets: number | null;
  post_shot_xg: number | null;
}

/** Valeur brute calculée pour un attribut donné */
export interface RawAttributeValue {
  /** Valeur numérique brute (ex: 0.42 pour goals/90, 0.73 pour aerial %) */
  value: number | null;
  /** Label court affiché (ex: "GOALS PER 90") */
  label: string;
}

/** Note 1-20 calculée par percentile */
export interface AttributeScore {
  key: string;
  label: string;
  note: number | null;  // null = données insuffisantes
  percentile: number | null;
  rawValue: number | null;
  rawLabel: string;  // ex: "0.42 / 90" · affiché en tooltip
}

export interface AttributeFamily {
  label: string;  // "ATTACKING" | "TECHNICAL" | "PHYSICAL"
  attributes: AttributeScore[];
}

export interface AttributeProfile {
  attacking: AttributeFamily;
  technical: AttributeFamily;
  physical: AttributeFamily;
  isGk: boolean;
}

export interface KeyInsight {
  type: "elite" | "strong" | "limited";
  text: string;
}

export interface TopStrength {
  label: string;  // ex: "GOALS PER 90"
  rawValue: string;  // ex: "0.79"
  percentile: number;  // ex: 96
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de calcul brut
// ─────────────────────────────────────────────────────────────────────────────

function per90(absolute: number | null, minutes: number): number | null {
  if (absolute === null || minutes <= 0) return null;
  return (absolute * 90) / minutes;
}

function ratio(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

function safeNum(v: number | null | undefined): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  return v;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction valeurs brutes — joueurs de champ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agrège les rows player_stats_advanced (toutes compétitions d'une saison)
 * en une seule row totalisée pour le calcul des attributs.
 */
function aggregateStats(rows: PlayerStatsAdvancedRow[]): PlayerStatsAdvancedRow | null {
  if (rows.length === 0) return null;
  const base = rows[0];
  if (rows.length === 1) return base;

  // Somme les compteurs, conserve player_id / season / competition
  const agg: PlayerStatsAdvancedRow = {
    player_id: base.player_id,
    season: base.season,
    competition: "all",
    competition_tier: null,
    matches_played: 0,
    minutes_played: 0,
    goals: 0,
    assists: 0,
    xg: 0,
    xag: 0,
    key_passes: 0,
    progressive_carries: 0,
    progressive_passes: 0,
    touches: 0,
    carries: 0,
    dribbles_completed: 0,
    dribbles_attempted: 0,
    long_pass_pct: null,
    tackles_won: 0,
    interceptions: 0,
    blocks: 0,
    clearances: 0,
    aerial_duels_won: 0,
    aerial_duels_total: 0,
    high_recoveries: 0,
    saves: 0,
    shots_on_target_faced: 0,
    clean_sheets: 0,
    post_shot_xg: 0,
  };

  let longPassWeightedSum = 0;
  let longPassTotalMin = 0;

  for (const r of rows) {
    agg.matches_played += r.matches_played;
    agg.minutes_played += r.minutes_played;
    agg.goals += r.goals;
    agg.assists += r.assists;
    if (r.xg !== null) (agg.xg as number) += r.xg;
    if (r.xag !== null) (agg.xag as number) += r.xag;
    if (r.key_passes !== null) (agg.key_passes as number) += r.key_passes;
    if (r.progressive_carries !== null) (agg.progressive_carries as number) += r.progressive_carries;
    if (r.progressive_passes !== null) (agg.progressive_passes as number) += r.progressive_passes;
    if (r.touches !== null) (agg.touches as number) += r.touches;
    if (r.carries !== null) (agg.carries as number) += r.carries;
    if (r.dribbles_completed !== null) (agg.dribbles_completed as number) += r.dribbles_completed;
    if (r.dribbles_attempted !== null) (agg.dribbles_attempted as number) += r.dribbles_attempted;
    if (r.long_pass_pct !== null && r.minutes_played > 0) {
      longPassWeightedSum += r.long_pass_pct * r.minutes_played;
      longPassTotalMin += r.minutes_played;
    }
    if (r.tackles_won !== null) (agg.tackles_won as number) += r.tackles_won;
    if (r.interceptions !== null) (agg.interceptions as number) += r.interceptions;
    if (r.blocks !== null) (agg.blocks as number) += r.blocks;
    if (r.clearances !== null) (agg.clearances as number) += r.clearances;
    if (r.aerial_duels_won !== null) (agg.aerial_duels_won as number) += r.aerial_duels_won;
    if (r.aerial_duels_total !== null) (agg.aerial_duels_total as number) += r.aerial_duels_total;
    if (r.high_recoveries !== null) (agg.high_recoveries as number) += r.high_recoveries;
    if (r.saves !== null) (agg.saves as number) += r.saves;
    if (r.shots_on_target_faced !== null) (agg.shots_on_target_faced as number) += r.shots_on_target_faced;
    if (r.clean_sheets !== null) (agg.clean_sheets as number) += r.clean_sheets;
    if (r.post_shot_xg !== null) (agg.post_shot_xg as number) += r.post_shot_xg;
  }

  // Long pass pct = moyenne pondérée par les minutes
  agg.long_pass_pct = longPassTotalMin > 0 ? longPassWeightedSum / longPassTotalMin : null;

  // Nullify accumulations that stayed at 0 if all rows were null
  // (les champs initialisés à 0 mais jamais alimentés restent 0 — on les
  // laisse tel quel car 0 est une vraie valeur pour ces métriques)

  return agg;
}

/**
 * Calcule les 15 valeurs brutes (raw) pour un joueur de champ.
 * Returns un Record<string, number | null>.
 */
function computeRawValues(s: PlayerStatsAdvancedRow): Record<string, number | null> {
  const min = s.minutes_played;

  // ── ATTACKING ──
  // 1. Finishing : goals / shots_on_target proxy via xg (shot volume proxy)
  //    V1 proxy: goals/90 (pure efficacité marqueur)
  const finishing = per90(s.goals, min);

  // 2. Goal Threat : xg per 90 (proxy pour volume de tirs dangereux)
  const goalThreat = per90(s.xg, min);

  // 3. Goal Contribution : (goals + assists) per 90
  const goalContrib = per90(s.goals + s.assists, min);

  // 4. OTB Involvement : touches per 90 (proxy off the ball)
  const otbInvolvement = per90(s.touches, min);

  // 5. Creativity : (key_passes + xag) per 90
  const creativityNum = (safeNum(s.key_passes) ?? 0) + (safeNum(s.xag) ?? 0);
  const creativity = (s.key_passes !== null || s.xag !== null) ? per90(creativityNum, min) : null;

  // ── TECHNICAL ──
  // 6. Dribbling : dribbles_completed / dribbles_attempted
  const dribbling = ratio(s.dribbles_completed, s.dribbles_attempted);

  // 7. Ball Retention : progressive_carries per 90 (proxy possession progressive)
  const ballRetention = per90(s.progressive_carries, min);

  // 8. Short Pass : progressive_passes per 90
  const shortPass = per90(s.progressive_passes, min);

  // 9. Long Pass : long_pass_pct (%)
  const longPass = safeNum(s.long_pass_pct);

  // 10. Crossing : assists per 90 (low confidence proxy — crosses non dispo)
  const crossing = per90(s.assists, min);

  // ── PHYSICAL ──
  // 11. Aerial : aerial_duels_won / aerial_duels_total
  const aerial = ratio(s.aerial_duels_won, s.aerial_duels_total);

  // 12. Physicality : (aerial_duels_total + tackles_won) per 90
  const physNum = (safeNum(s.aerial_duels_total) ?? 0) + (safeNum(s.tackles_won) ?? 0);
  const physicality = (s.aerial_duels_total !== null || s.tackles_won !== null)
    ? per90(physNum, min)
    : null;

  // 13. Stamina : minutes_played / matches_played (proxy endurance)
  const stamina = s.matches_played > 0 ? s.minutes_played / s.matches_played : null;

  // 14. Ball Recovery : (interceptions + tackles_won + high_recoveries) per 90
  const recovNum = (safeNum(s.interceptions) ?? 0) + (safeNum(s.tackles_won) ?? 0) + (safeNum(s.high_recoveries) ?? 0);
  const ballRecovery = (s.interceptions !== null || s.tackles_won !== null || s.high_recoveries !== null)
    ? per90(recovNum, min)
    : null;

  // 15. Def Awareness : (blocks + clearances + interceptions) per 90
  const defNum = (safeNum(s.blocks) ?? 0) + (safeNum(s.clearances) ?? 0) + (safeNum(s.interceptions) ?? 0);
  const defAwareness = (s.blocks !== null || s.clearances !== null || s.interceptions !== null)
    ? per90(defNum, min)
    : null;

  return {
    finishing,
    goalThreat,
    goalContrib,
    otbInvolvement,
    creativity,
    dribbling,
    ballRetention,
    shortPass,
    longPass,
    crossing,
    aerial,
    physicality,
    stamina,
    ballRecovery,
    defAwareness,
  };
}

/**
 * Valeurs brutes pour un GK (5 attributs spécifiques).
 */
function computeGkRawValues(s: PlayerStatsAdvancedRow): Record<string, number | null> {
  const min = s.minutes_played;
  return {
    // Save % : saves / shots_on_target_faced
    savePct: ratio(s.saves, s.shots_on_target_faced),
    // Saves per 90
    savesPer90: per90(s.saves, min),
    // Clean sheet %
    cleanSheetPct: s.matches_played > 0 ? (safeNum(s.clean_sheets) ?? 0) / s.matches_played : null,
    // Post-shot xG conceded per 90 (inversé : moins = mieux — géré dans la normalisation)
    postShotXgPer90: per90(s.post_shot_xg, min),
    // Minutes per match (stamina proxy)
    stamina: s.matches_played > 0 ? s.minutes_played / s.matches_played : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation percentile → note /20
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le percentile d'une valeur dans un tableau de valeurs.
 * Retourne 0-100. Gère les valeurs inversées (ex: conceded_xg : moins = mieux).
 */
function computePercentile(value: number, allValues: number[], inverted = false): number {
  if (allValues.length === 0) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  const rank = sorted.filter((v) => (inverted ? v > value : v < value)).length;
  const ties = sorted.filter((v) => v === value).length;
  const percentile = ((rank + ties * 0.5) / sorted.length) * 100;
  return Math.max(0, Math.min(100, percentile));
}

/** Percentile → note 1-20 */
function percentileToNote(percentile: number): number {
  return Math.max(1, Math.min(20, Math.round((percentile / 100) * 19) + 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels humains lisibles pour les attributs bruts
// ─────────────────────────────────────────────────────────────────────────────

const ATTR_RAW_FORMAT: Record<string, (v: number) => string> = {
  finishing: (v) => `${v.toFixed(2)} / 90`,
  goalThreat: (v) => `xG ${v.toFixed(2)} / 90`,
  goalContrib: (v) => `${v.toFixed(2)} G+A / 90`,
  otbInvolvement: (v) => `${Math.round(v)} touches / 90`,
  creativity: (v) => `${v.toFixed(2)} KP+xAG / 90`,
  dribbling: (v) => `${(v * 100).toFixed(0)}% dribbles réussis`,
  ballRetention: (v) => `${v.toFixed(1)} prog. carries / 90`,
  shortPass: (v) => `${v.toFixed(1)} prog. passes / 90`,
  longPass: (v) => `${(v * 100).toFixed(0)}% long passes`,
  crossing: (v) => `${v.toFixed(2)} PD / 90`,
  aerial: (v) => `${(v * 100).toFixed(0)}% duels aériens`,
  physicality: (v) => `${v.toFixed(1)} aérien+tackle / 90`,
  stamina: (v) => `${Math.round(v)} min / match`,
  ballRecovery: (v) => `${v.toFixed(1)} récup / 90`,
  defAwareness: (v) => `${v.toFixed(1)} déf. actions / 90`,
  // GK
  savePct: (v) => `${(v * 100).toFixed(0)}% arrêts`,
  savesPer90: (v) => `${v.toFixed(1)} arrêts / 90`,
  cleanSheetPct: (v) => `${(v * 100).toFixed(0)}% clean sheets`,
  postShotXgPer90: (v) => `${v.toFixed(2)} PSxG concédé / 90`,
  stamina_gk: (v) => `${Math.round(v)} min / match`,
};

function formatRaw(key: string, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n.d.";
  const fmt = ATTR_RAW_FORMAT[key];
  if (!fmt) return value.toFixed(2);
  return fmt(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Définitions des attributs — labels et familles
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_ATTRIBUTES = {
  attacking: [
    { key: "finishing",      label: "Finishing" },
    { key: "goalThreat",     label: "Goal Threat" },
    { key: "goalContrib",    label: "Goal Contrib." },
    { key: "otbInvolvement", label: "OTB Involvement" },
    { key: "creativity",     label: "Creativity" },
  ],
  technical: [
    { key: "dribbling",      label: "Dribbling" },
    { key: "ballRetention",  label: "Ball Retention" },
    { key: "shortPass",      label: "Short Pass" },
    { key: "longPass",       label: "Long Pass" },
    { key: "crossing",       label: "Crossing" },
  ],
  physical: [
    { key: "aerial",         label: "Aerial" },
    { key: "physicality",    label: "Physicality" },
    { key: "stamina",        label: "Stamina" },
    { key: "ballRecovery",   label: "Ball Recovery" },
    { key: "defAwareness",   label: "Def. Awareness" },
  ],
} as const;

const GK_ATTRIBUTES = [
  { key: "savePct",        label: "Save %" },
  { key: "savesPer90",     label: "Saves / 90" },
  { key: "cleanSheetPct",  label: "Clean Sheets" },
  { key: "postShotXgPer90", label: "PSxG Conceded" },
  { key: "stamina",        label: "Stamina" },
];

// Attributs inversés (moins = mieux) — seul postShotXgPer90 pour GK
const INVERTED_ATTRS = new Set(["postShotXgPer90"]);

// ─────────────────────────────────────────────────────────────────────────────
// TOP STRENGTHS label mapping (per-90 labels pour l'affichage)
// ─────────────────────────────────────────────────────────────────────────────

const STRENGTH_LABELS: Record<string, string> = {
  finishing:      "GOALS PER 90",
  goalThreat:     "XG PER 90",
  goalContrib:    "GOAL CONTRIBUTIONS PER 90",
  otbInvolvement: "TOUCHES PER 90",
  creativity:     "KEY PASSES + XAG PER 90",
  dribbling:      "DRIBBLE SUCCESS RATE",
  ballRetention:  "PROGRESSIVE CARRIES PER 90",
  shortPass:      "PROGRESSIVE PASSES PER 90",
  longPass:       "LONG PASS COMPLETION",
  crossing:       "ASSISTS PER 90",
  aerial:         "AERIAL DUELS WON",
  physicality:    "AERIAL + TACKLES PER 90",
  stamina:        "MINUTES PER GAME",
  ballRecovery:   "BALL RECOVERIES PER 90",
  defAwareness:   "DEFENSIVE ACTIONS PER 90",
};

// ─────────────────────────────────────────────────────────────────────────────
// Fonction principale : computeAttributes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule les 15 attributs /20 pour un joueur donné.
 *
 * @param playerStats    Rows player_stats_advanced de CE joueur (toutes compétitions)
 * @param allPlayersStats Rows de TOUS les joueurs du même poste (pour le percentile)
 * @param position       Position du joueur
 * @returns AttributeProfile complet
 */
export function computeAttributes(
  playerStats: PlayerStatsAdvancedRow[],
  allPlayersStats: PlayerStatsAdvancedRow[],
  position: DBPosition,
): AttributeProfile {
  const isGk = position === "Goalkeeper";

  const playerAgg = aggregateStats(playerStats);
  if (!playerAgg) {
    // Aucune stat — retourner profil vide
    return buildEmptyProfile(isGk);
  }

  if (isGk) {
    return computeGkProfile(playerAgg, allPlayersStats);
  }

  return computeFieldProfile(playerAgg, allPlayersStats);
}

// ── GK Profile ──────────────────────────────────────────────────────────────

function computeGkProfile(
  playerAgg: PlayerStatsAdvancedRow,
  allStats: PlayerStatsAdvancedRow[],
): AttributeProfile {
  const playerRaw = computeGkRawValues(playerAgg);

  // Récupérer les valeurs brutes de tous les GKs pour le percentile
  const allRaws: Record<string, number[]> = {};
  for (const key of GK_ATTRIBUTES.map((a) => a.key)) {
    allRaws[key] = [];
  }
  for (const row of allStats) {
    const agg = row; // déjà agrégé à l'extérieur si besoin
    const raw = computeGkRawValues(agg);
    for (const key of GK_ATTRIBUTES.map((a) => a.key)) {
      const v = raw[key];
      if (v !== null && Number.isFinite(v)) {
        allRaws[key].push(v);
      }
    }
  }

  const gkScores: AttributeScore[] = GK_ATTRIBUTES.map(({ key, label }) => {
    const value = playerRaw[key];
    if (value === null || !Number.isFinite(value)) {
      return { key, label, note: null, percentile: null, rawValue: null, rawLabel: "n.d." };
    }
    const inverted = INVERTED_ATTRS.has(key);
    const percentile = computePercentile(value, allRaws[key], inverted);
    const note = percentileToNote(percentile);
    return {
      key,
      label,
      note,
      percentile: Math.round(percentile),
      rawValue: value,
      rawLabel: formatRaw(key, value),
    };
  });

  // Pour GK : 5 attrs dans "attacking" par convention d'affichage simplifié
  return {
    isGk: true,
    attacking: { label: "GOALKEEPER", attributes: gkScores },
    technical: { label: "TECHNICAL", attributes: [] },
    physical: { label: "PHYSICAL", attributes: [] },
  };
}

// ── Field Player Profile ─────────────────────────────────────────────────────

function computeFieldProfile(
  playerAgg: PlayerStatsAdvancedRow,
  allStats: PlayerStatsAdvancedRow[],
): AttributeProfile {
  const playerRaw = computeRawValues(playerAgg);

  // Récupérer les valeurs brutes de tous les joueurs du même poste
  const allKeys = [
    ...FIELD_ATTRIBUTES.attacking.map((a) => a.key),
    ...FIELD_ATTRIBUTES.technical.map((a) => a.key),
    ...FIELD_ATTRIBUTES.physical.map((a) => a.key),
  ];
  const allRaws: Record<string, number[]> = {};
  for (const key of allKeys) allRaws[key] = [];

  for (const row of allStats) {
    const raw = computeRawValues(row);
    for (const key of allKeys) {
      const v = raw[key];
      if (v !== null && Number.isFinite(v)) {
        allRaws[key].push(v);
      }
    }
  }

  function buildFamily(
    familyLabel: string,
    attrDefs: readonly { key: string; label: string }[],
  ): AttributeFamily {
    return {
      label: familyLabel,
      attributes: attrDefs.map(({ key, label }) => {
        const value = playerRaw[key];
        if (value === null || !Number.isFinite(value)) {
          return { key, label, note: null, percentile: null, rawValue: null, rawLabel: "n.d." };
        }
        const inverted = INVERTED_ATTRS.has(key);
        // Si pas de données comparatives (0 autres joueurs), on retourne une note centrale
        const pool = allRaws[key];
        const percentile = pool.length > 0
          ? computePercentile(value, pool, inverted)
          : 50;
        const note = percentileToNote(percentile);
        return {
          key,
          label,
          note,
          percentile: Math.round(percentile),
          rawValue: value,
          rawLabel: formatRaw(key, value),
        };
      }),
    };
  }

  return {
    isGk: false,
    attacking: buildFamily("ATTACKING", FIELD_ATTRIBUTES.attacking),
    technical: buildFamily("TECHNICAL", FIELD_ATTRIBUTES.technical),
    physical: buildFamily("PHYSICAL", FIELD_ATTRIBUTES.physical),
  };
}

// ── Empty Profile ────────────────────────────────────────────────────────────

function buildEmptyProfile(isGk: boolean): AttributeProfile {
  const emptyAttrs = (labels: readonly { key: string; label: string }[]): AttributeScore[] =>
    labels.map(({ key, label }) => ({
      key, label, note: null, percentile: null, rawValue: null, rawLabel: "n.d.",
    }));

  if (isGk) {
    return {
      isGk: true,
      attacking: { label: "GOALKEEPER", attributes: emptyAttrs(GK_ATTRIBUTES) },
      technical: { label: "TECHNICAL", attributes: [] },
      physical: { label: "PHYSICAL", attributes: [] },
    };
  }

  return {
    isGk: false,
    attacking: { label: "ATTACKING", attributes: emptyAttrs(FIELD_ATTRIBUTES.attacking) },
    technical: { label: "TECHNICAL", attributes: emptyAttrs(FIELD_ATTRIBUTES.technical) },
    physical: { label: "PHYSICAL", attributes: emptyAttrs(FIELD_ATTRIBUTES.physical) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY INSIGHTS — auto-génération
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère 2-3 bullets Key Insights depuis le profil attributs.
 * Règle :
 *   - note >= 15 → "Elite {label} {note}" ou "Strong {label} {note}, {label2} {note2}"
 *   - note <= 8  → "Limited {label} {note}"
 *   - Tous moyens → "Profil polyvalent"
 */
export function computeKeyInsights(profile: AttributeProfile): KeyInsight[] {
  const allAttrs: AttributeScore[] = [
    ...profile.attacking.attributes,
    ...profile.technical.attributes,
    ...profile.physical.attributes,
  ].filter((a) => a.note !== null);

  if (allAttrs.length === 0) return [];

  const sorted = [...allAttrs].sort((a, b) => (b.note ?? 0) - (a.note ?? 0));
  const top = sorted.filter((a) => (a.note ?? 0) >= 15);
  const bottom = sorted.filter((a) => (a.note ?? 0) <= 8);

  const insights: KeyInsight[] = [];

  if (top.length >= 1) {
    const first = top[0];
    const second = top[1];
    if (first && (first.note ?? 0) >= 17) {
      insights.push({
        type: "elite",
        text: `Elite ${first.label} · ${first.note}/20`,
      });
      if (second && (second.note ?? 0) >= 15) {
        insights.push({
          type: "strong",
          text: `Strong ${second.label} (${second.note})`,
        });
      }
    } else if (first) {
      const others = top.slice(0, 2).map((a) => `${a.label} ${a.note}`).join(", ");
      insights.push({
        type: "strong",
        text: `Strong ${others}`,
      });
    }
  }

  if (bottom.length >= 1) {
    const limited = bottom.slice(0, 2).map((a) => `${a.label} ${a.note}`).join(", ");
    insights.push({
      type: "limited",
      text: `Limited ${limited}`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "strong",
      text: "Profil polyvalent · pas de dominante marquée",
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP STRENGTHS — 3-5 stats brutes avec meilleur percentile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne les 5 attributs avec le meilleur percentile pour l'affichage
 * "TOP STRENGTHS vs même poste".
 */
export function computeTopStrengths(profile: AttributeProfile): TopStrength[] {
  const allAttrs: AttributeScore[] = [
    ...profile.attacking.attributes,
    ...profile.technical.attributes,
    ...profile.physical.attributes,
  ].filter((a) => a.percentile !== null && a.rawValue !== null);

  const sorted = [...allAttrs]
    .sort((a, b) => (b.percentile ?? 0) - (a.percentile ?? 0))
    .slice(0, 5);

  return sorted.map((a) => ({
    label: STRENGTH_LABELS[a.key] ?? a.label.toUpperCase(),
    rawValue: a.rawLabel,
    percentile: a.percentile ?? 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Export du hook data shape (pour usePlayerAttributes)
// ─────────────────────────────────────────────────────────────────────────────

export type { PlayerStatsAdvancedRow as PlayerStatsRow };
