/**
 * URL state pour Ma Liste v2 — encode la liste en hash compact partagable
 * sans backend. Permet le mode "remix" (charger une liste à partir de
 * l'URL et la modifier).
 *
 * Format (dans le hash) :
 *   /ma-liste#{formation}.{xi}.{bench}.cap={captainSlug}
 *
 * - formation : "4-3-3" | "4-2-3-1" | "3-5-2"
 * - xi : 11 IDs joueurs encodés base36 séparés par "-" (ordre = FORMATION_SLOTS)
 *   ou "_" pour un slot vide
 * - bench : 15 IDs joueurs encodés base36 séparés par "-"
 * - captain : slug du capitaine (string court)
 *
 * Exemple : `4-3-3.1a3-5gz-_-...-9k.cap=mbemba`
 *
 * Décisions DA :
 * - URL hash (pas query string) → pas envoyé au serveur, pas de fuite
 * - Compact : ID joueur base36 (~6 chars) pour rester sous 500 chars hash
 * - Lisible à l'œil par dev (formation + cap visible) sans révéler les IDs
 */

import type { Formation, SlotPosition } from "@/types/maListe";
import type { DBPlayer } from "@/types/dbPlayer";
import { FORMATION_SLOTS } from "@/types/maListe";

const SEP_SECTION = ".";
const SEP_SLOT = "-";
const EMPTY = "_";
const CAP_PREFIX = "cap=";

export interface UrlListState {
  formation: Formation | null;
  /** IDs base10 dans l'ordre FORMATION_SLOTS[formation] */
  xiIds: (number | null)[];
  benchIds: number[];
  captainSlug: string | null;
}

/**
 * Encode l'état liste en hash compact pour l'URL.
 * Utilise base36 pour réduire la longueur des IDs (player.id max 9999 → 4 chars).
 */
export function encodeListToHash(args: {
  formation: Formation | null;
  startingXI: Record<string, DBPlayer | null>;
  bench: DBPlayer[];
  captain: DBPlayer | null;
}): string {
  const { formation, startingXI, bench, captain } = args;
  if (!formation) return "";

  const slots = FORMATION_SLOTS[formation];
  const xiPart = slots
    .map((s) => {
      const p = startingXI[s];
      return p ? p.id.toString(36) : EMPTY;
    })
    .join(SEP_SLOT);

  const benchPart = bench.map((p) => p.id.toString(36)).join(SEP_SLOT);
  const capPart = captain ? `${CAP_PREFIX}${captain.slug}` : "";

  return [formation, xiPart, benchPart, capPart].filter(Boolean).join(SEP_SECTION);
}

/**
 * Decode un hash URL en état liste.
 * Retourne null si format invalide (l'app fera un fresh start).
 */
export function decodeHashToList(hash: string): UrlListState | null {
  if (!hash) return null;
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const parts = clean.split(SEP_SECTION);
  if (parts.length < 2) return null;

  const formation = parts[0] as Formation;
  if (!["4-3-3", "4-2-3-1", "3-5-2"].includes(formation)) return null;

  const xiIds = parts[1]
    .split(SEP_SLOT)
    .map((s) => (s === EMPTY ? null : parseInt(s, 36)))
    .map((n) => (typeof n === "number" && !isNaN(n) ? n : null));

  const benchPart = parts[2] && !parts[2].startsWith(CAP_PREFIX) ? parts[2] : "";
  const benchIds = benchPart
    ? benchPart.split(SEP_SLOT).map((s) => parseInt(s, 36)).filter((n) => !isNaN(n))
    : [];

  const capPart = parts.find((p) => p.startsWith(CAP_PREFIX));
  const captainSlug = capPart ? capPart.slice(CAP_PREFIX.length) : null;

  return { formation, xiIds, benchIds, captainSlug };
}

/**
 * Synchronise le hash de l'URL avec l'état liste sans recharger la page.
 * Debounced à appeler depuis le store sur tout changement.
 */
export function syncUrlHash(hash: string): void {
  if (typeof window === "undefined") return;
  const newUrl = hash ? `#${hash}` : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

/**
 * Lit le hash de l'URL au mount pour mode "remix".
 */
export function readUrlHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.slice(1);
}
