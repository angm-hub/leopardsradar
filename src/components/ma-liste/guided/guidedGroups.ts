/**
 * Groupes de poste du flow guidé (type Typeform) — refonte /ma-liste 04/09.
 *
 * On compose un EFFECTIF complet, poste par poste : gardiens, latéraux droits,
 * latéraux gauches, défenseurs centraux, milieux, attaquants. Chaque groupe a
 * une cible (nombre conseillé) qui varie légèrement selon le système choisi
 * (4-3-3 ou 4-2-3-1). Le système reste une base, pas un carcan.
 *
 * Le rattachement d'un joueur à son groupe se fait par son POSTE EXACT
 * (canonCode / position_code TM). Sans poste précis, on retombe sur la famille.
 */
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import { canonCode } from "@/components/ma-liste/v2/squadFormation";

export type Formation = "4-3-3" | "4-2-3-1";
export type GroupKey = "GK" | "RB" | "LB" | "CB" | "MID" | "ATT";

/** Code exact → groupe. */
const CODE_GROUP: Record<string, GroupKey> = {
  GK: "GK",
  RB: "RB",
  RWB: "RB",
  LB: "LB",
  LWB: "LB",
  CB: "CB",
  SW: "CB",
  DM: "MID",
  CM: "MID",
  AM: "MID",
  RM: "MID",
  LM: "MID",
  RW: "ATT",
  LW: "ATT",
  ST: "ATT",
  CF: "ATT",
  SS: "ATT",
};

/** Famille (fallback sans poste exact) → groupe par défaut. */
const BUCKET_GROUP: Record<DBPosition, GroupKey> = {
  Goalkeeper: "GK",
  Defender: "CB", // un défenseur sans précision atterrit chez les centraux
  Midfield: "MID",
  Attack: "ATT",
};

/** Le groupe d'un joueur : poste exact d'abord, famille en secours. */
export function groupKeyOf(p: DBPlayer): GroupKey | null {
  const c = canonCode(p);
  if (c && CODE_GROUP[c]) return CODE_GROUP[c];
  if (p.position && BUCKET_GROUP[p.position]) return BUCKET_GROUP[p.position];
  return null;
}

export interface GroupMeta {
  key: GroupKey;
  title: string;
  subtitle: string;
  /** Nombre conseillé pour ce groupe (le système ajuste MID/ATT). */
  target: number;
}

/** Ordre + cibles des groupes selon le système. GK 3 · RB 2 · LB 2 · CB 4. */
export function groupsFor(formation: Formation): GroupMeta[] {
  const midTarget = formation === "4-2-3-1" ? 6 : 5;
  const attTarget = formation === "4-2-3-1" ? 5 : 6;
  return [
    { key: "GK", title: "Tes gardiens", subtitle: "Le dernier rempart", target: 3 },
    { key: "RB", title: "Tes latéraux droits", subtitle: "Le couloir droit", target: 2 },
    { key: "LB", title: "Tes latéraux gauches", subtitle: "Le couloir gauche", target: 2 },
    { key: "CB", title: "Tes défenseurs centraux", subtitle: "L'axe défensif", target: 4 },
    {
      key: "MID",
      title: "Tes milieux",
      subtitle: formation === "4-2-3-1" ? "Les deux relayeurs et le meneur" : "Le trio du milieu",
      target: midTarget,
    },
    {
      key: "ATT",
      title: "Tes attaquants",
      subtitle: formation === "4-2-3-1" ? "Les ailiers et le buteur" : "Le trident offensif",
      target: attTarget,
    },
  ];
}

export const FORMATION_META: Record<
  Formation,
  { label: string; line: string; rows: number[] }
> = {
  "4-3-3": { label: "4-3-3", line: "L'équilibre offensif", rows: [4, 3, 3] },
  "4-2-3-1": { label: "4-2-3-1", line: "Le bloc et le meneur", rows: [4, 2, 3, 1] },
};

export const GROUP_TITLE: Record<GroupKey, string> = {
  GK: "Gardiens",
  RB: "Latéraux droits",
  LB: "Latéraux gauches",
  CB: "Défenseurs centraux",
  MID: "Milieux",
  ATT: "Attaquants",
};
