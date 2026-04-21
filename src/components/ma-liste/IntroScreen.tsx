import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/ButtonPrimitive";
import { useMaListeStore } from "@/store/maListeStore";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";

interface IntroScreenProps {
  totalListsCreated?: number;
}

const STEPS = [
  { step: "1", label: "Formation" },
  { step: "2", label: "XI titulaire" },
  { step: "3", label: "Banc" },
  { step: "4", label: "Capitaine" },
  { step: "5", label: "Partage" },
];

export function IntroScreen({ totalListsCreated = 247 }: IntroScreenProps) {
  const nextStep = useMaListeStore((s) => s.nextStep);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-background">
      <StrongGradient position="center" />

      <div className="container-site relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl flex flex-col items-center text-center gap-8"
        >
          {/* Pill badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            Nouveau · Mondial 2026
          </span>

          {/* Main title */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance text-foreground leading-[1.05]">
            Et toi, ta{" "}
            <span className="bg-gradient-to-r from-primary via-foreground to-primary/70 bg-clip-text text-transparent">
              liste des 26
            </span>{" "}
            ?
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-foreground/70 max-w-xl text-balance">
            Compose ta sélection Léopards pour le Mondial 2026.
            <br />
            Partage. Compare aux autres fans.
          </p>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            className="group mt-2"
            onClick={nextStep}
          >
            Commencer ma liste
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Social proof - hidden until real lists exist */}
          {totalListsCreated > 0 && (
            <div className="flex items-center gap-2 text-sm text-foreground/50">
              <Users className="h-4 w-4" />
              <span>
                {totalListsCreated.toLocaleString("fr-FR")} listes déjà composées
                par les fans
              </span>
            </div>
          )}

          {/* Steps preview */}
          <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-5">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 backdrop-blur-sm"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
                  {s.step}
                </span>
                <span className="text-xs text-foreground/70">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Time indicator */}
          <p className="text-xs text-muted uppercase tracking-[0.2em]">
            ≈ 3 minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default IntroScreen;
