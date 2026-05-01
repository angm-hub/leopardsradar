/**
 * AxisGuides — repères d'axes minimaux.
 *
 * 2 labels uniquement : axe Y vertical à gauche, axe X horizontal en bas.
 * Pas de médianes, pas de graduations, pas d'effet — la lecture des
 * quadrants suffit à donner le sens du plan.
 */
export function AxisGuides() {
  return (
    <>
      {/* Axe Y — gauche centre */}
      <div className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 z-[1]">
        <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/40 font-mono [writing-mode:vertical-rl] rotate-180">
          Jeune ↔ Confirmé
        </p>
      </div>
      {/* Axe X — bas centre */}
      <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[1]">
        <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/40 font-mono">
          Faible valeur ↔ Haute valeur
        </p>
      </div>
    </>
  );
}
