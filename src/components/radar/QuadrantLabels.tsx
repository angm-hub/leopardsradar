/**
 * QuadrantLabels — 1 mot par coin pour nommer les 4 territoires.
 * Discret mais lisible, sert de boussole sémantique.
 *
 * - Haut-gauche : Pépites (jeune, valeur basse)
 * - Haut-droit  : Diamants (jeune, valeur haute)
 * - Bas-gauche  : Oubliés (confirmé, valeur basse)
 * - Bas-droit   : Stars (confirmé, valeur haute)
 */
export function QuadrantLabels() {
  return (
    <>
      <Quadrant position="top-3 left-1/4 -translate-x-1/2" label="Pépites" />
      <Quadrant position="top-3 right-1/4 translate-x-1/2" label="Diamants" />
      <Quadrant position="bottom-5 left-1/4 -translate-x-1/2" label="Oubliés" />
      <Quadrant position="bottom-5 right-1/4 translate-x-1/2" label="Stars" />
    </>
  );
}

function Quadrant({ position, label }: { position: string; label: string }) {
  return (
    <p
      className={`pointer-events-none absolute ${position} z-[1] font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/35`}
      aria-hidden
    >
      {label}
    </p>
  );
}
