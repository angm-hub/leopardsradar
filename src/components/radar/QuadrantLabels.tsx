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
      className={`pointer-events-none absolute ${position} z-[2] rounded-full bg-background/45 backdrop-blur-sm px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/60`}
      aria-hidden
    >
      {label}
    </p>
  );
}
