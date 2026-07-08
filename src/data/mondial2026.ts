/**
 * Mondial 2026 — bilan RDC, données figées post-tournoi.
 *
 * Scores, dates, stades et buteurs vérifiés contre l'API officielle FIFA
 * (competition 17, saison 285023, matchs 23/48/72/80) et recoupés ESPN /
 * FIFA.com / The Athletic le 8 juillet 2026. Statistiques de jeu (possession,
 * tirs, xG) et notes joueurs : API-Football, agrégées sur les 4 matchs
 * (garde-fou None distinct de 0 appliqué à la collecte).
 *
 * Le tournoi est terminé pour la RDC : ces données ne bougent plus, elles
 * sont committées plutôt que servies par Supabase (0 requête, indexable).
 */

export interface MondialMatch {
  /** Identifiant de fixture API-Football, pour traçabilité. */
  fixtureId: number;
  dateIso: string;
  dateLabel: string;
  stage: string;
  opponent: string;
  opponentCode: string;
  scoreRdc: number;
  scoreOpponent: number;
  outcome: "V" | "N" | "D";
  venue: string;
  city: string;
  /** Buteurs RDC, vérifiés multi-sources. */
  scorersRdc: string[];
  /** Ligne collective RDC sur ce match (source API-Football). */
  stats: { poss: number; tirs: number; cadres: number; xg: number };
}

export const MONDIAL_MATCHES: MondialMatch[] = [
  {
    fixtureId: 1539003,
    dateIso: "2026-06-17T17:00:00Z",
    dateLabel: "17 juin 2026",
    stage: "Phase de groupes · J1",
    opponent: "Portugal",
    opponentCode: "POR",
    scoreRdc: 1,
    scoreOpponent: 1,
    outcome: "N",
    venue: "NRG Stadium",
    city: "Houston",
    scorersRdc: ["Yoane Wissa (de la tête)"],
    stats: { poss: 25, tirs: 8, cadres: 2, xg: 0.87 },
  },
  {
    fixtureId: 1539008,
    dateIso: "2026-06-24T02:00:00Z",
    dateLabel: "23 juin 2026 (soir, heure locale)",
    stage: "Phase de groupes · J2",
    opponent: "Colombie",
    opponentCode: "COL",
    scoreRdc: 0,
    scoreOpponent: 1,
    outcome: "D",
    venue: "Estadio Akron",
    city: "Guadalajara",
    scorersRdc: [],
    stats: { poss: 36, tirs: 7, cadres: 1, xg: 0.37 },
  },
  {
    fixtureId: 1539013,
    dateIso: "2026-06-27T23:30:00Z",
    dateLabel: "27 juin 2026",
    stage: "Phase de groupes · J3",
    opponent: "Ouzbékistan",
    opponentCode: "UZB",
    scoreRdc: 3,
    scoreOpponent: 1,
    outcome: "V",
    venue: "Mercedes-Benz Stadium",
    city: "Atlanta",
    scorersRdc: ["Yoane Wissa (2, dont 1 pénalty)", "Fiston Mayele"],
    stats: { poss: 58, tirs: 19, cadres: 4, xg: 2.18 },
  },
  {
    fixtureId: 1567307,
    dateIso: "2026-07-01T16:00:00Z",
    dateLabel: "1er juillet 2026",
    stage: "Seizièmes de finale",
    opponent: "Angleterre",
    opponentCode: "ENG",
    scoreRdc: 1,
    scoreOpponent: 2,
    outcome: "D",
    venue: "Mercedes-Benz Stadium",
    city: "Atlanta",
    scorersRdc: ["Brian Cipenga (7e)"],
    stats: { poss: 40, tirs: 7, cadres: 2, xg: 0.77 },
  },
];

export interface MondialPlayer {
  name: string;
  pos: string;
  minutes: number;
  apps: number;
  /** Note moyenne API-Football sur le tournoi. */
  rating: number;
  goals: number;
  assists: number;
  highlight: string;
}

/** Les joueurs marquants du tournoi (minutes, buts, notes API-Football). */
export const MONDIAL_PLAYERS: MondialPlayer[] = [
  {
    name: "Yoane Wissa",
    pos: "Attaquant",
    minutes: 369,
    apps: 4,
    rating: 7.03,
    goals: 3,
    assists: 0,
    highlight: "3 des 5 buts congolais. Meilleure note de l'effectif.",
  },
  {
    name: "Aaron Wan-Bissaka",
    pos: "Défenseur",
    minutes: 364,
    apps: 4,
    rating: 6.93,
    goals: 0,
    assists: 0,
    highlight: "Titulaire sur les 4 matchs, couloir droit verrouillé.",
  },
  {
    name: "Noah Sadiki",
    pos: "Milieu",
    minutes: 267,
    apps: 4,
    rating: 6.88,
    goals: 0,
    assists: 0,
    highlight: "Le métronome. Présent sur les 4 matchs.",
  },
  {
    name: "Arthur Masuaku",
    pos: "Défenseur",
    minutes: 318,
    apps: 4,
    rating: 6.85,
    goals: 0,
    assists: 1,
    highlight: "1 passe décisive, pied gauche précieux sur coups de pied arrêtés.",
  },
  {
    name: "Brian Cipenga",
    pos: "Attaquant",
    minutes: 148,
    apps: 2,
    rating: 6.65,
    goals: 1,
    assists: 0,
    highlight: "Le but contre l'Angleterre en 16es, à la 7e minute.",
  },
];

export const MONDIAL_SUMMARY = {
  played: 4,
  wins: 1,
  draws: 1,
  losses: 2,
  goalsFor: 5,
  goalsAgainst: 5,
  exitStage: "Seizièmes de finale",
  exitOpponent: "Angleterre",
};

export const MONDIAL_SOURCES =
  "Scores, dates, stades et buteurs vérifiés contre l'API officielle FIFA et recoupés ESPN, FIFA.com et The Athletic. Statistiques de jeu et notes : API-Football.";
