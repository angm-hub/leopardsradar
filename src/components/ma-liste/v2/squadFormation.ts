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
 * Code court FR du poste, affiché sur les cartes et les slots.
 *
 * On n'affiche PAS le code tactique fin du slot (LB/CB/ST/LW…) : il est
 * assigné par ordre d'ajout dans la ligne, donc un défenseur central pouvait
 * s'afficher "LB". On montre le vrai poste général du joueur (les 4 buckets
 * fiables de la base) en français : jamais faux, jamais en anglais.
 */
export const BUCKET_CODE_FR: Record<DBPosition, string> = {
  Goalkeeper: "GAR",
  Defender: "DÉF",
  Midfield: "MIL",
  Attack: "ATT",
};

export interface PlacedSlot {
  slot: FormationSlot;
  player: DBPlayer | null;
}

/** Auto-assigne les titulaires aux slots du 4-3-3 par ligne, ordre d'ajout. */
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
  const cursor: Record<string, number> = {};
  const placed = FORMATION_433.map((slot) => {
    const arr = byBucket[slot.bucket];
    const i = cursor[slot.bucket] ?? 0;
    cursor[slot.bucket] = i + 1;
    return { slot, player: arr[i] ?? null };
  });
  // Titulaires au-delà du quota de leur ligne (débordement) : hors terrain.
  (Object.keys(byBucket) as DBPosition[]).forEach((b) => {
    overflow.push(...byBucket[b].slice(BUCKET_QUOTA[b]));
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
