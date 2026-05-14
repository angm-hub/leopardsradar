/**
 * RosterMoversSection — DÉSACTIVÉ le 14 mai 2026.
 *
 * Pourquoi : la version précédente affichait 5 deltas hardcodés (+18%, +9%,
 * +5%, -3%, -7%) sur les 5 premiers joueurs du roster, présentés comme
 * variations hebdomadaires réelles. C'était mensonger.
 *
 * Audit Supabase ce jour : `player_stats_weekly` contient 2 snapshots
 * (3 mai et 10 mai 2026) mais aucun joueur du roster n'a vu sa valeur
 * marchande changer entre ces deux dates. Donc rien d'honnête à afficher.
 *
 * Réactivation prévue quand un mouvement réel sera détecté entre 2 snapshots
 * dimanche consécutifs (Sprint 4 du plan data : snapshots hebdo fiables sur
 * tous les joueurs). Voir `useWeeklyMovers()` à créer.
 *
 * Le composant reste exporté pour ne pas casser les imports existants — il
 * rend null tant qu'il n'a pas de vrais movers à afficher.
 */

interface RosterMoversSectionProps {
  hidden?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RosterMoversSection(_props: RosterMoversSectionProps) {
  return null;
}

export default RosterMoversSection;
