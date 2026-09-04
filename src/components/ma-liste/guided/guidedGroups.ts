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

/**
 * Code exact → groupe. Logique Desabre (liste des 26) : les AILIERS (RW/LW)
 * comptent comme des MILIEUX, seuls les buteurs axiaux (ST/CF/SS) sont des
 * ATTAQUANTS. C'est ainsi que le sélectionneur bâtit son groupe.
 */
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
  RW: "MID", // ailier droit → milieu (logique Desabre)
  LW: "MID", // ailier gauche → milieu
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
  /** Nombre max pour ce groupe (logique Desabre). */
  target: number;
}

/** Taille du groupe (liste type Desabre). */
export const SQUAD_SIZE = 26;

/**
 * Quotas par poste, calqués sur la dernière liste type de Desabre :
 * 3 gardiens · 8 défenseurs (2 lat. D, 2 lat. G, 4 centraux) · 11 milieux
 * (ailiers inclus) · 4 attaquants (buteurs). Total = 26. Ce sont des MAX.
 */
export const GROUP_QUOTA: Record<GroupKey, number> = {
  GK: 3,
  RB: 2,
  LB: 2,
  CB: 4,
  MID: 11,
  ATT: 4,
};

/** Regroupement en 4 lignes pour le suivi d'effectif. */
export type Bucket = "GAR" | "DEF" | "MIL" | "ATT";
export const GROUP_BUCKET: Record<GroupKey, Bucket> = {
  GK: "GAR",
  RB: "DEF",
  LB: "DEF",
  CB: "DEF",
  MID: "MIL",
  ATT: "ATT",
};
export const BUCKET_QUOTA: Record<Bucket, number> = { GAR: 3, DEF: 8, MIL: 11, ATT: 4 };
export const BUCKET_LABEL: Record<Bucket, string> = {
  GAR: "Gardiens",
  DEF: "Défenseurs",
  MIL: "Milieux",
  ATT: "Attaquants",
};

/** Ordre des étapes. Quotas Desabre (indépendants du système). */
export function groupsFor(_formation: Formation): GroupMeta[] {
  return [
    { key: "GK", title: "Tes gardiens", subtitle: "3 pour tenir la cage", target: GROUP_QUOTA.GK },
    { key: "RB", title: "Tes latéraux droits", subtitle: "2 pour le couloir droit", target: GROUP_QUOTA.RB },
    { key: "LB", title: "Tes latéraux gauches", subtitle: "2 pour le couloir gauche", target: GROUP_QUOTA.LB },
    { key: "CB", title: "Tes défenseurs centraux", subtitle: "4 pour verrouiller l'axe", target: GROUP_QUOTA.CB },
    { key: "MID", title: "Tes milieux", subtitle: "11 relayeurs et ailiers", target: GROUP_QUOTA.MID },
    { key: "ATT", title: "Tes attaquants", subtitle: "4 buteurs", target: GROUP_QUOTA.ATT },
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
