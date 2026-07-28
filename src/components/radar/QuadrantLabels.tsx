/**
 * QuadrantLabels — 4 zones nommees avec sous-titre explicatif.
 * Axes : X = niveau de jeu (gauche faible → droite haut), Y = âge (haut jeune
 * → bas confirmé). Refonte 28/07/2026 (audit filtres/data-viz).
 *
 * Haut-gauche   : À polir   (jeune + faible niveau)
 * Haut-droit    : Pépites   (jeune + haut niveau)  ← le quadrant en or
 * Bas-gauche    : En retrait (confirmé + faible niveau)
 * Bas-droit     : Cadres    (confirmé + haut niveau)
 */
export function QuadrantLabels() {
  return (
    <>
      <Quadrant
        position="top-4 left-6"
        label="À polir"
        sub="Jeunes bruts"
      />
      <Quadrant
        position="top-4 right-6"
        label="Pépites"
        sub="Jeunes déjà au niveau"
        align="right"
      />
      <Quadrant
        position="bottom-8 left-6"
        label="En retrait"
        sub="Temps de jeu à part"
      />
      <Quadrant
        position="bottom-8 right-6"
        label="Cadres"
        sub="Références du vivier"
        align="right"
      />
    </>
  );
}

function Quadrant({
  position,
  label,
  sub,
  align = "left",
}: {
  position: string;
  label: string;
  sub: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`pointer-events-none absolute ${position} z-[2] flex flex-col gap-0.5 ${align === "right" ? "items-end" : "items-start"}`}
      aria-hidden
    >
      <p className="rounded-sm bg-background/50 backdrop-blur-sm px-2 py-0.5 font-mono text-xs md:text-[10px] uppercase tracking-[0.22em] text-foreground/65">
        {label}
      </p>
      <p className="hidden md:block rounded-sm bg-background/30 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-foreground/35">
        {sub}
      </p>
    </div>
  );
}
