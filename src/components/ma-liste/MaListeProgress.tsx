/**
 * MaListeProgress — barre de progression sticky pour le multi-step Ma Liste.
 *
 * 4 étapes condensées (intro et share sont des wrappers, pas des "vraies"
 * étapes pour l'utilisateur) : Formation, Composition, Récap, Partage.
 *
 * WHY ce composant : le builder Ma Liste est un workflow long (5+ écrans)
 * sans repère visuel. Sans progress bar, l'utilisateur ne sait pas combien
 * il reste — friction qui pousse à l'abandon (pattern documenté NN/g).
 *
 * Pattern visuel : sticky en haut sous la navbar, h-12, divider entre étapes.
 * Étape active = label + numéro en text-foreground, étapes complétées = checkmark
 * vert subtil, étapes futures = text-muted. Ligne de progression continue en
 * dessous (h-px bg-success) qui grandit avec l'étape.
 *
 * Caché sur l'étape "intro" (avant que l'utilisateur ait commencé) et "share"
 * (déjà sur l'écran final).
 */

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useMaListeStore, type Step } from "@/store/maListeStore";
import { cn } from "@/lib/utils";

interface ProgressStep {
  /** Mappe vers une ou plusieurs Step du store */
  matchSteps: Step[];
  label: string;
}

const PROGRESS_STEPS: ProgressStep[] = [
  { matchSteps: ["formation"], label: "Formation" },
  // Le builder unifié couvre lineup + bench + captain — un seul step "Composition"
  { matchSteps: ["lineup", "bench", "captain"], label: "Composition" },
  { matchSteps: ["recap"], label: "Récap" },
  { matchSteps: ["share"], label: "Partage" },
];

const HIDE_ON_STEPS: Step[] = ["intro"];

export function MaListeProgress() {
  const currentStep = useMaListeStore((s) => s.currentStep);

  if (HIDE_ON_STEPS.includes(currentStep)) return null;

  // Index de l'étape active (0-based)
  const activeIndex = PROGRESS_STEPS.findIndex((s) =>
    s.matchSteps.includes(currentStep),
  );

  // Pourcentage rempli pour la barre de progression continue
  const total = PROGRESS_STEPS.length;
  const fillPct = activeIndex >= 0 ? ((activeIndex + 1) / total) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-label="Progression Ma Liste"
      aria-valuenow={activeIndex + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      // Sticky sous la navbar (h-16). z-20 pour passer au-dessus du contenu
      // mais sous la navbar (z-30) et le promo banner (z-70).
      className="sticky top-16 z-20 bg-background/85 backdrop-blur-lg border-b border-border"
    >
      <div className="container-site">
        <ol className="flex items-center justify-between gap-4 h-12">
          {PROGRESS_STEPS.map((step, i) => {
            const isActive = i === activeIndex;
            const isDone = i < activeIndex;
            return (
              <li
                key={step.label}
                className={cn(
                  "flex items-center gap-2.5 text-xs uppercase tracking-[0.16em] font-mono whitespace-nowrap",
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-success"
                      : "text-muted/70",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {/* Marqueur : checkmark quand fait, numéro sinon */}
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                    isActive
                      ? "border-success bg-success/15 text-success"
                      : isDone
                        ? "border-success/70 bg-success/10 text-success"
                        : "border-border text-muted",
                  )}
                  aria-hidden
                >
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {/* Label visible uniquement sur sm+ pour ne pas casser sur mobile */}
                <span className="hidden sm:inline">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Ligne de progression continue — grandit en spring depuis 0 */}
      <div className="h-px w-full bg-border/40 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-success to-primary"
          initial={false}
          animate={{ width: `${fillPct}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
        />
      </div>
    </div>
  );
}

export default MaListeProgress;
