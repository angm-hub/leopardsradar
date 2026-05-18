/**
 * fifa26Squad.ts — Liste officielle FIFA des 26 selectionnes RDC pour la Coupe
 * du Monde, annoncee par la FECOFA. Source de verite hardcodee — pas de scrape
 * automatique, c'est une liste fermee qui change uniquement quand la FECOFA
 * communique une remplacement.
 *
 * Pour mettre a jour : editer FIFA26_PLAYER_IDS, garder l'ordre du visuel
 * officiel (GK → DF → MF → FW). Le composant SquadFIFA26Block consomme
 * cette liste pour fetcher les stats agregees par joueur.
 */

import type { DBPosition } from "@/types/dbPlayer";

export interface FIFA26Slot {
  id: number;          // players.id
  label: string;       // Nom affiche tel qu'annonce par la FECOFA
  group: DBPosition;   // GK / DF / MF / FW (pour le tri visuel)
}

// Ordre exact du visuel officiel — on respecte la hierarchie FECOFA.
export const FIFA26_SQUAD: FIFA26Slot[] = [
  // ── GARDIENS (3) ──────────────────────────────────────────────────────
  { id: 471, label: "Matthieu Epolo",       group: "Goalkeeper" },
  { id: 300, label: "Lionel Mpasi",         group: "Goalkeeper" },
  { id: 454, label: "Timothy Fayulu",       group: "Goalkeeper" },

  // ── DEFENSEURS (9) ────────────────────────────────────────────────────
  { id: 73,  label: "Chancel Mbemba",       group: "Defender" },
  { id: 2,   label: "Aaron Wan-Bissaka",    group: "Defender" },
  { id: 36,  label: "Axel Tuanzebe",        group: "Defender" },
  { id: 31,  label: "Arthur Masuaku",       group: "Defender" },
  { id: 476, label: "Joris Kayembe",        group: "Defender" },
  { id: 441, label: "Steve Kapuadi",        group: "Defender" },
  { id: 386, label: "Rocky Bushiri",        group: "Defender" },
  { id: 120, label: "Dylan Batubinsika",    group: "Defender" },
  { id: 188, label: "Gedeon Kalulu",        group: "Defender" },

  // ── MILIEUX (8) ───────────────────────────────────────────────────────
  { id: 346, label: "Noah Sadiki",          group: "Midfield" },
  { id: 420, label: "Samuel Moutoussamy",   group: "Midfield" },
  { id: 124, label: "Edo Kayembe",          group: "Midfield" },
  { id: 470, label: "Ngal'ayel Mukau",      group: "Midfield" },
  { id: 75,  label: "Charles Pickel",       group: "Midfield" },
  { id: 334, label: "Nathanael Mbuku",      group: "Midfield" },
  { id: 61,  label: "Brian Cipenga",        group: "Midfield" },
  { id: 170, label: "Gael Kakuta",          group: "Midfield" },

  // ── ATTAQUANTS (6) ────────────────────────────────────────────────────
  { id: 319, label: "Meschack Elia",        group: "Attack" },
  { id: 453, label: "Theo Bongonda",        group: "Attack" },
  { id: 469, label: "Fiston Mayele",        group: "Attack" },
  { id: 94,  label: "Cedric Bakambu",       group: "Attack" },
  { id: 429, label: "Simon Banza",          group: "Attack" },
  { id: 413, label: "Yoane Wissa",          group: "Attack" },
];

export const FIFA26_PLAYER_IDS: number[] = FIFA26_SQUAD.map((s) => s.id);

// Libelles courts pour les groupes (mobile-first : economiser l'espace)
export const GROUP_LABEL_FR: Record<DBPosition, string> = {
  Goalkeeper: "Gardiens",
  Defender:   "Defenseurs",
  Midfield:   "Milieux",
  Attack:     "Attaquants",
};

export const GROUP_LABEL_SHORT: Record<DBPosition, string> = {
  Goalkeeper: "GK",
  Defender:   "DEF",
  Midfield:   "MIL",
  Attack:     "ATT",
};

export const GROUP_ORDER: DBPosition[] = ["Goalkeeper", "Defender", "Midfield", "Attack"];
