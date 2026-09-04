import { useEffect, useRef, useState } from "react";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

/**
 * Modèle terrain de Ma Liste — refonte gamifiée (terrain FUT + HUD live).
 *
 * Le store reste `starters[]` / `bench[]` (pas de slots persistés) : on
 * auto-assigne les titulaires à un 4-3-3 par ligne (GK / DEF / MID / ATT),
 * dans l'ordre d'ajout. La pioche filtrée par poste guide vers un XI valide,
 * donc le débordement de ligne est rare — on le gère quand même (overflow).
 */

export interface FormationSlot {
  /** identifiant unique du slot */
  id: string;
  /** code tactique affiché (GK, LB, CB, CM, ST…) */
  code: string;
  /** ligne / poste général requis */
  bucket: DBPosition;
  /** coords en % du terrain (y=0 = attaque, y=100 = but) */
  x: number;
  y: number;
}

// 4-3-3 — une ligne par bucket, ordre GK → DEF → MID → ATT.
export const FORMATION_433: FormationSlot[] = [
  { id: "GK", code: "GK", bucket: "Goalkeeper", x: 50, y: 88 },
  { id: "LB", code: "LB", bucket: "Defender", x: 15, y: 70 },
  { id: "LCB", code: "CB", bucket: "Defender", x: 38, y: 72 },
  { id: "RCB", code: "CB", bucket: "Defender", x: 62, y: 72 },
  { id: "RB", code: "RB", bucket: "Defender", x: 85, y: 70 },
  { id: "LCM", code: "CM", bucket: "Midfield", x: 28, y: 48 },
  { id: "CM", code: "CM", bucket: "Midfield", x: 50, y: 54 },
  { id: "RCM", code: "CM", bucket: "Midfield", x: 72, y: 48 },
  { id: "LW", code: "LW", bucket: "Attack", x: 20, y: 24 },
  { id: "ST", code: "ST", bucket: "Attack", x: 50, y: 16 },
  { id: "RW", code: "RW", bucket: "Attack", x: 80, y: 24 },
];

export const BUCKET_QUOTA: Record<DBPosition, number> = {
  Goalkeeper: 1,
  Defender: 4,
  Midfield: 3,
  Attack: 3,
};

export const BUCKET_LABEL: Record<DBPosition, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfield: "Milieu",
  Attack: "Attaquant",
};

/**
 * Code court FR du poste GÉNÉRAL (4 buckets) — fallback quand on n'a pas le
 * poste exact du joueur. Jamais faux, jamais en anglais.
 */
export const BUCKET_CODE_FR: Record<DBPosition, string> = {
  Goalkeeper: "GAR",
  Defender: "DÉF",
  Midfield: "MIL",
  Attack: "ATT",
};

// ──────────────────────────────────────────────────────────────────────
// Postes EXACTS (Transfermarkt : position_code + position_detail).
// On affiche le vrai poste du joueur en français court quand la base le
// connaît (roster = couverture quasi totale), sinon on retombe sur le poste
// général (BUCKET_CODE_FR). Jamais de code tactique inventé.
// ──────────────────────────────────────────────────────────────────────

/** Code TM anglais → code FR court affiché sur la carte. */
const CODE_FR: Record<string, string> = {
  GK: "GB", // gardien de but
  RB: "DD", // arrière (défenseur) droit
  LB: "DG", // arrière (défenseur) gauche
  CB: "DC", // défenseur central
  RWB: "DD",
  LWB: "DG",
  DM: "MDF", // milieu défensif
  CM: "MC", // milieu central
  AM: "MOC", // milieu offensif (central)
  RM: "MD", // milieu droit
  LM: "MG", // milieu gauche
  RW: "AD", // ailier droit
  LW: "AG", // ailier gauche
  ST: "BU", // buteur / avant-centre
  CF: "BU",
  SS: "SA", // second attaquant
};

/** Libellé FR long de position_detail (lowercased) → code TM anglais. */
const DETAIL_TO_CODE: Record<string, string> = {
  "gardien de but": "GK",
  "arrière droit": "RB",
  "arrière gauche": "LB",
  "défenseur central": "CB",
  "milieu défensif": "DM",
  "milieu central": "CM",
  "milieu offensif": "AM",
  "milieu droit": "RM",
  "milieu gauche": "LM",
  "ailier droit": "RW",
  "ailier gauche": "LW",
  "avant-centre": "ST",
};

/** Résout le code TM anglais exact, ou null si la base ne le sait pas. */
export function canonCode(p: DBPlayer): string | null {
  const c = (p.position_code ?? "").toUpperCase().trim();
  if (CODE_FR[c]) return c;
  const d = (p.position_detail ?? "").toLowerCase().trim();
  if (DETAIL_TO_CODE[d]) return DETAIL_TO_CODE[d];
  return null;
}

/** Code FR court affiché : poste exact si connu, sinon poste général. */
export function posCodeFr(p: DBPlayer): string {
  const c = canonCode(p);
  if (c) return CODE_FR[c] ?? "?";
  return p.position ? BUCKET_CODE_FR[p.position] : "?";
}

/** Poste exact en toutes lettres FR (aria / infobulle), sinon poste général. */
export function posLabelFr(p: DBPlayer): string {
  if (p.position_detail && p.position_detail.trim() && DETAIL_TO_CODE[p.position_detail.toLowerCase().trim()]) {
    return p.position_detail.trim();
  }
  return p.position ? BUCKET_LABEL[p.position] : "n.d.";
}

/**
 * Rang latéral pour placer le joueur sur le bon côté du terrain :
 * 0 = gauche, 1 = axe, 2 = droite. Déduit du code exact ; axe par défaut.
 */
export function sideRank(p: DBPlayer): 0 | 1 | 2 {
  const c = canonCode(p);
  if (!c) return 1;
  if (c === "LB" || c === "LM" || c === "LW" || c === "LWB") return 0;
  if (c === "RB" || c === "RM" || c === "RW" || c === "RWB") return 2;
  return 1;
}

/** Code FR court attendu par un slot de la formation (slot vide). */
export const SLOT_CODE_FR: Record<string, string> = {
  GK: "GB",
  LB: "DG",
  CB: "DC",
  RB: "DD",
  CM: "MC",
  LW: "AG",
  ST: "BU",
  RW: "AD",
};

export interface PlacedSlot {
  slot: FormationSlot;
  player: DBPlayer | null;
}

/** Côté d'un slot de la formation : 0 gauche, 1 axe, 2 droite. */
function slotSide(code: string): 0 | 1 | 2 {
  if (code === "LB" || code === "LW" || code === "LM") return 0;
  if (code === "RB" || code === "RW" || code === "RM") return 2;
  return 1;
}

/**
 * Auto-assigne les titulaires aux slots du 4-3-3 en appariant chaque joueur
 * au slot dont le CÔTÉ colle le mieux à son poste exact : un arrière gauche
 * va au slot gauche, un ailier droit au slot droit, un central à l'axe. Les
 * postes latéraux sont placés d'abord (ils ont une contrainte de côté forte),
 * les axiaux comblent le reste. Si une ligne est incomplète, ce sont les slots
 * du bon côté qui restent vides, pas un joueur mal placé.
 */
export function assignStarters(starters: DBPlayer[]): {
  placed: PlacedSlot[];
  overflow: DBPlayer[];
} {
  const byBucket: Record<DBPosition, DBPlayer[]> = {
    Goalkeeper: [],
    Defender: [],
    Midfield: [],
    Attack: [],
  };
  const overflow: DBPlayer[] = [];
  for (const p of starters) {
    if (p.position && byBucket[p.position]) byBucket[p.position].push(p);
    else overflow.push(p);
  }

  const placed: PlacedSlot[] = FORMATION_433.map((slot) => ({ slot, player: null }));
  const slotsByBucket: Record<DBPosition, PlacedSlot[]> = {
    Goalkeeper: [],
    Defender: [],
    Midfield: [],
    Attack: [],
  };
  for (const ps of placed) slotsByBucket[ps.slot.bucket].push(ps);

  (Object.keys(byBucket) as DBPosition[]).forEach((b) => {
    const slots = slotsByBucket[b];
    // Latéraux d'abord (contrainte de côté forte : |side-1| = 1), axiaux ensuite.
    const players = byBucket[b]
      .slice()
      .sort((a, c) => Math.abs(sideRank(c) - 1) - Math.abs(sideRank(a) - 1));
    for (const p of players) {
      const ps = sideRank(p);
      let best: PlacedSlot | null = null;
      let bestScore = Infinity;
      for (const entry of slots) {
        if (entry.player) continue;
        const score = Math.abs(ps - slotSide(entry.slot.code));
        if (score < bestScore) {
          bestScore = score;
          best = entry;
        }
      }
      if (best) best.player = p;
      else overflow.push(p); // ligne pleine (au-delà du quota)
    }
  });

  return { placed, overflow };
}

/** Indice d'un joueur (percentile Léopards, fallback level_score). */
export function noteOf(p: DBPlayer): number | null {
  return p.score_leopards ?? p.level_score ?? null;
}

/** Note du XI = moyenne des indices des titulaires (null si aucun). */
export function squadNote(starters: DBPlayer[]): number | null {
  const vals = starters.map(noteOf).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Valeur marchande cumulée (€) de la sélection. */
export function totalValue(players: DBPlayer[]): number {
  return players.reduce((sum, p) => sum + (p.market_value_eur ?? 0), 0);
}

/**
 * Alchimie (0-100) — synergie de club : récompense les coéquipiers réels.
 * La nationalité est écartée (quasi tous RDC → non discriminant). C'est un
 * bonus stratégique à chasser (aligne des joueurs du même club).
 */
export function alchimie(players: DBPlayer[]): number {
  if (players.length < 2) return 0;
  const clubCount = new Map<string, number>();
  for (const p of players) {
    if (p.current_club) clubCount.set(p.current_club, (clubCount.get(p.current_club) ?? 0) + 1);
  }
  let shared = 0;
  for (const p of players) {
    if (p.current_club && (clubCount.get(p.current_club) ?? 0) > 1) shared++;
  }
  return Math.min(100, Math.round((shared / players.length) * 100 * 1.6));
}

/** Classe couleur d'un indice (0-100) — même échelle que la carte roster. */
export function noteColorClass(n: number | null): string {
  if (n == null) return "text-muted";
  if (n >= 70) return "text-primary";
  if (n >= 45) return "text-foreground";
  return "text-foreground/55";
}

/**
 * Count-up animé pour les gros chiffres du HUD (note, valeur, alchimie).
 * Respecte prefers-reduced-motion : saute directement à la cible.
 */
export function useCountUp(target: number, durationMs = 500): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    const to = target;
    if (reduced || from === to || typeof performance === "undefined") {
      fromRef.current = to;
      setValue(to);
      return;
    }
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}
