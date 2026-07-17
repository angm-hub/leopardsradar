/**
 * Interrupteurs éditoriaux du site.
 *
 * PRESSE_PUBLIEE — la Revue de presse est dépubliée jusqu'au lancement
 * (décision du 17/07/2026) : la table press_items ne contient que le seed
 * de démo du 14/05, le pipeline d'ingestion n'est pas branché. Tant que
 * false : l'entrée disparaît de la nav et du footer, la section home est
 * masquée, le CTA « journaliste » du hero bascule vers la méthodologie,
 * les mentions presse des fiches joueur sont masquées, et la route
 * /revue-de-presse redirige vers la home (liens partagés non cassés).
 * Repasser à true quand l'ingestion tournera pour de vrai.
 */
export const PRESSE_PUBLIEE = false;
