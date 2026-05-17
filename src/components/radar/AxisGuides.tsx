/**
 * AxisGuides — reperes d'axes plus lisibles.
 *
 * Chaque axe a un label principal + un sous-label qui explique
 * ce que signifie la direction (haut vs bas, gauche vs droite).
 * Flechage explicite pour eviter l'ambiguite sur mobile.
 */
export function AxisGuides() {
  return (
    <>
      {/* Axe Y — etiquette gauche, centree verticalement */}
      <div className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 z-[2] flex flex-col items-center gap-1.5">
        <span
          className="rounded-sm bg-background/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/55"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Jeune
        </span>
        <span
          className="rounded-sm bg-background/40 px-1 py-0.5 text-[10px] text-foreground/35"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          aria-hidden
        >
          ↑
        </span>
        <span
          className="rounded-sm bg-background/40 px-1 py-0.5 text-[10px] text-foreground/35"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          aria-hidden
        >
          ↓
        </span>
        <span
          className="rounded-sm bg-background/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/55"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Confirme
        </span>
      </div>

      {/* Axe X — etiquette bas, centree horizontalement */}
      <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 z-[2] flex items-center justify-between px-12">
        <span className="rounded-sm bg-background/60 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/55 whitespace-nowrap">
          Faible valeur
        </span>
        <span className="text-[10px] text-foreground/25 font-mono" aria-hidden>
          ←&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Valeur marchande&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→
        </span>
        <span className="rounded-sm bg-background/60 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/55 whitespace-nowrap">
          Haute valeur
        </span>
      </div>
    </>
  );
}
