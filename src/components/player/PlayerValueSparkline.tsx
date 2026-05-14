/**
 * PlayerValueSparkline — DÉSACTIVÉ le 14 mai 2026.
 *
 * Pourquoi : la version précédente générait une "courbe d'évolution sur
 * 12 mois" entièrement synthétique (Math.sin(seed_du_slug)). Affichée comme
 * historique réel, c'était mensonger.
 *
 * À ce stade, `player_stats_weekly` n'a que 2 snapshots (3 mai, 10 mai 2026)
 * — insuffisant pour tracer une courbe 12 mois honnête. Plutôt que d'inventer,
 * on cache le composant.
 *
 * Quand on aura ≥ 6 snapshots hebdo cumulés (mi-juin 2026), réactiver en
 * lisant la vraie série depuis `player_stats_weekly` joint sur ce player_id.
 *
 * Le composant reste exporté pour ne pas casser les imports — il rend null
 * jusqu'à réactivation.
 */

interface PlayerValueSparklineProps {
  currentValue: number | null;
  slug: string;
  className?: string;
}

export function PlayerValueSparkline(_props: PlayerValueSparklineProps) {
  // Volontairement null tant que `player_stats_weekly` n'a pas assez
  // d'historique pour tracer une vraie courbe honnête (≥ 6 semaines).
  return null;
}

export default PlayerValueSparkline;
