import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { cn } from "@/lib/utils";
import type { Formation } from "@/types/maListe";

const FORMATIONS: Array<{
  id: Formation;
  label: string;
  description: string;
  philosophy: string;
  popularity: number;
  visual: { x: number; y: number }[];
}> = [
  {
    id: "4-3-3",
    label: "4-3-3",
    description: "Offensif. Les ailiers portent le danger.",
    philosophy:
      "Pressing haut, largeur dans l'animation, 3 attaquants en pointe.",
    popularity: 48,
    visual: [
      { x: 50, y: 92 },
      { x: 15, y: 72 },
      { x: 38, y: 75 },
      { x: 62, y: 75 },
      { x: 85, y: 72 },
      { x: 30, y: 48 },
      { x: 50, y: 52 },
      { x: 70, y: 48 },
      { x: 18, y: 22 },
      { x: 50, y: 15 },
      { x: 82, y: 22 },
    ],
  },
  {
    id: "4-2-3-1",
    label: "4-2-3-1",
    description: "Équilibré. Un meneur. Un attaquant de référence.",
    philosophy:
      "Double pivot, meneur créatif, attaquant solitaire en pointe.",
    popularity: 31,
    visual: [
      { x: 50, y: 92 },
      { x: 15, y: 72 },
      { x: 38, y: 75 },
      { x: 62, y: 75 },
      { x: 85, y: 72 },
      { x: 35, y: 55 },
      { x: 65, y: 55 },
      { x: 20, y: 32 },
      { x: 50, y: 28 },
      { x: 80, y: 32 },
      { x: 50, y: 12 },
    ],
  },
  {
    id: "3-5-2",
    label: "3-5-2",
    description: "Moderne. Des pistons. Deux pointes.",
    philosophy:
      "Trois défenseurs, deux pistons offensifs, duo d'attaque.",
    popularity: 21,
    visual: [
      { x: 50, y: 92 },
      { x: 25, y: 75 },
      { x: 50, y: 78 },
      { x: 75, y: 75 },
      { x: 8, y: 50 },
      { x: 30, y: 48 },
      { x: 50, y: 52 },
      { x: 70, y: 48 },
      { x: 92, y: 50 },
      { x: 35, y: 18 },
      { x: 65, y: 18 },
    ],
  },
];

function MiniPitch({
  positions,
  selected,
}: {
  positions: { x: number; y: number }[];
  selected: boolean;
}) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-gradient-to-b from-[#0D2818] via-[#0B1F12] to-[#0A0A0B]">
      {/* Pitch lines */}
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <g
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.2"
        >
          <rect x="14" y="14" width="372" height="472" rx="2" />
          <line x1="14" y1="250" x2="386" y2="250" />
          <circle cx="200" cy="250" r="40" />
          <rect x="115" y="14" width="170" height="55" />
          <rect x="115" y="431" width="170" height="55" />
        </g>
      </svg>
      {/* Player dots */}
      {positions.map((pos, idx) => (
        <span
          key={idx}
          className={cn(
            "absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors",
            selected
              ? "bg-primary shadow-[0_0_8px_rgba(252,209,22,0.6)]"
              : "bg-foreground/60",
          )}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        />
      ))}
    </div>
  );
}

export function FormationPicker() {
  const formation = useMaListeStore((s) => s.formation);
  const setFormation = useMaListeStore((s) => s.setFormation);
  const previousStep = useMaListeStore((s) => s.previousStep);
  const nextStep = useMaListeStore((s) => s.nextStep);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="container-site max-w-6xl py-12 md:py-20">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-12">
          <button
            onClick={previousStep}
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i <= 2 ? "w-6 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>

          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            2/5 · Formation
          </span>
        </div>

        {/* Title */}
        <div className="max-w-2xl mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Choisis ta formation.
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-light leading-relaxed">
            Chaque formation impose ses postes. Choisis selon ta philosophie de
            jeu.
          </p>
        </div>

        {/* Formation cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {FORMATIONS.map((f, i) => {
            const isSelected = formation === f.id;
            return (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                type="button"
                onClick={() => setFormation(f.id)}
                className={cn(
                  "relative rounded-card border-2 p-6 text-left transition-all duration-200 group",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                    : "border-border bg-card hover:border-border-hover hover:bg-card-hover",
                )}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}

                {/* Formation label */}
                <h3
                  className={cn(
                    "font-mono text-3xl font-bold tracking-tight transition-colors",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {f.label}
                </h3>

                {/* Mini pitch */}
                <div className="mt-5 mb-5">
                  <MiniPitch positions={f.visual} selected={isSelected} />
                </div>

                {/* Description */}
                <p className="font-serif text-base text-foreground">
                  {f.description}
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {f.philosophy}
                </p>

                {/* Popularity */}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    Choisie par
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {f.popularity}%
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Continue CTA */}
        <div className="mt-12 flex justify-center">
          <Button
            variant="primary"
            size="lg"
            disabled={!formation}
            onClick={nextStep}
            className="group"
          >
            {formation ? `Continuer avec ${formation}` : "Choisis une formation"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FormationPicker;
