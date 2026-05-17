/**
 * QuadrantLabels — 4 zones nommees avec sous-titre explicatif.
 *
 * Haut-gauche   : Pepites       (jeune + faible valeur)
 * Haut-droit    : Future stars  (jeune + haute valeur)
 * Bas-gauche    : Oublies       (age + faible valeur)
 * Bas-droit     : Cracks        (age + haute valeur)
 *
 * Chaque label a un nom + un sous-titre court pour que le visiteur
 * comprenne la semantique sans lire la legende.
 */
export function QuadrantLabels() {
  return (
    <>
      <Quadrant
        position="top-4 left-6"
        label="Pepites"
        sub="Jeunes a suivre"
      />
      <Quadrant
        position="top-4 right-6"
        label="Future Stars"
        sub="Jeunes a forte valeur"
        align="right"
      />
      <Quadrant
        position="bottom-8 left-6"
        label="Oublies"
        sub="Exp. sans spotlight"
      />
      <Quadrant
        position="bottom-8 right-6"
        label="Cracks"
        sub="References du vivier"
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
      <p className="rounded-sm bg-background/50 backdrop-blur-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65">
        {label}
      </p>
      <p className="hidden md:block rounded-sm bg-background/30 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-foreground/35">
        {sub}
      </p>
    </div>
  );
}
