/**
 * Léopards Radar — Helpers pour le système de niveau de jeu public.
 *
 * La nomenclature (elite / high / mid / developing / watch) est documentée
 * sur /methodologie. Ce fichier est la source de vérité côté frontend :
 * labels, descriptions et formatter utilisés par LevelBandBadge et la
 * page Methodologie.
 */

export type LevelBand = "elite" | "high" | "mid" | "developing" | "watch";

/** Label public affiché dans les badges et pills. */
export const LEVEL_BAND_LABEL: Record<LevelBand, string> = {
  elite:      "Elite",
  high:       "High",
  mid:        "Mid",
  developing: "Developing",
  watch:      "Watch",
};

/**
 * Description courte affichée en tooltip sur les badges.
 * Écrite pour être comprise sans connaître la formule — une phrase,
 * un profil concret, pas de jargon technique.
 */
export const LEVEL_BAND_DESCRIPTION: Record<LevelBand, string> = {
  elite:      "Titulaire régulier dans les plus grandes compétitions européennes avec expérience en sélection (ex. Wissa, Lukebakio).",
  high:       "Rotation fiable dans un top 5 européen ou titulaire dans un championnat de premier plan (ex. Mukau, Wan-Bissaka).",
  mid:        "Actif dans un championnat européen du top 10 ou équivalent africain de haut niveau (ex. Sadiki, Stroeykens).",
  developing: "Jeune joueur en progression dans un championnat de niveau 2 ou 3 — profil à suivre dans la durée (ex. Engwanda, Mavissa).",
  watch:      "Profil identifié via vivier Linafoot ou diaspora, pas encore exposé au football européen professionnel.",
};

/**
 * Formate le score composite pour l'affichage.
 * Retourne "— / 100" si le score est null/undefined (pas encore calculé).
 */
export function formatLevelScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "— / 100";
  return `${score} / 100`;
}

/**
 * Guard TypeScript : vérifie qu'une string est une LevelBand valide.
 * Utilisé pour convertir la valeur brute Supabase (string | null).
 */
export function isLevelBand(value: unknown): value is LevelBand {
  return (
    value === "elite" ||
    value === "high" ||
    value === "mid" ||
    value === "developing" ||
    value === "watch"
  );
}
