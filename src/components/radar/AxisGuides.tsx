/**
 * AxisGuides — repères d'axes minimaux.
 *
 * 2 labels uniquement : axe Y vertical à gauche, axe X horizontal en bas.
 * Sit on a translucent backdrop so they stay legible whatever the
 * gradient zone underneath. No median lines, no graduations — the
 * quadrant labels carry the rest of the meaning.
 */
export function AxisGuides() {
  return (
    <>
      {/* Axe Y — gauche centre */}
      <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 z-[2]">
        <p className="rounded-full bg-background/55 backdrop-blur-sm px-2 py-1 text-[10px] uppercase tracking-[0.28em] text-foreground/70 font-mono [writing-mode:vertical-rl] rotate-180">
          Jeune ↔ Confirmé
        </p>
      </div>
      {/* Axe X — bas centre */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-[2]">
        <p className="rounded-full bg-background/55 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-foreground/70 font-mono whitespace-nowrap">
          Faible valeur ↔ Haute valeur
        </p>
      </div>
    </>
  );
}
