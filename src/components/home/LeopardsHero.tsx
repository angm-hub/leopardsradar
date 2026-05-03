import { lazy, Suspense } from "react";
import { motion, type Variants, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Pill } from "@/components/ui/Pill";
import { useLatestBestXIMeta } from "@/hooks/useLatestBestXIMeta";
import { useHomeStats } from "@/hooks/useHomeStats";
import { useMondialCountdown } from "@/hooks/useMondialCountdown";

// AuroraShader pèse ~30 kB gzip de WebGL (ogl). On le lazy-load pour le sortir
// du bundle main et garder un LCP rapide. Le fallback est un gradient CSS qui
// occupe l'espace pendant le chargement (≈ 200 ms en cache miss) — visuellement
// proche, sans flash de couleur. Si l'utilisateur préfère le mouvement réduit,
// on n'invoque jamais le shader et on reste sur le fallback statique.
const AuroraShader = lazy(() =>
  import("@/components/ui/AuroraShader").then((m) => ({ default: m.AuroraShader })),
);

function AuroraFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{
        background:
          "radial-gradient(60% 80% at 50% 30%, rgba(0,166,81,0.55) 0%, rgba(10,10,11,0.85) 70%, rgba(10,10,11,1) 100%)",
      }}
    />
  );
}


const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function LeopardsHero() {
  const { edition, formattedDate } = useLatestBestXIMeta();
  const { stats } = useHomeStats();
  const { daysUntilKickoff, kickoffDateLabel, phase } = useMondialCountdown();
  const reducedMotion = useReducedMotion();
  const totalPlayers = stats?.total_players ?? null;
  const radarCount = stats?.radar_count ?? null;
  const rosterCount = stats?.roster_count ?? null;
  const countries = stats?.total_countries ?? null;

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-background">
      {reducedMotion ? (
        <AuroraFallback />
      ) : (
        <Suspense fallback={<AuroraFallback />}>
          <AuroraShader className="absolute inset-0 h-full w-full" />
        </Suspense>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background pointer-events-none" />

      <div className="container-site relative z-10 flex min-h-[100dvh] items-center py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl flex flex-col items-center text-center gap-8"
        >
          <motion.div variants={itemVariants}>
            <Pill dot dotColor="bg-success">
              Saison 2025/26
            </Pill>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance text-foreground"
          >
            Les yeux sur tous{" "}
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
              les Léopards.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-foreground/75 max-w-2xl text-balance"
          >
            {totalPlayers ?? "—"} internationaux et diaspora éligible, suivis chaque
            dimanche.{" "}
            {phase === "before"
              ? `Compose ton 26 avant le coup d'envoi du Mondial — J-${daysUntilKickoff}.`
              : phase === "during"
                ? "Suis les Léopards en direct du Mondial 2026."
                : "Bilan et héritage du Mondial 2026."}
          </motion.p>

          {phase === "before" ? (
            <motion.p
              variants={itemVariants}
              className="-mt-4 text-xs text-foreground/50 font-mono uppercase tracking-[0.2em]"
            >
              Coup d'envoi · {kickoffDateLabel}
            </motion.p>
          ) : null}

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-4 w-full sm:w-auto"
          >
            <Link to="/ma-liste" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="group w-full sm:w-auto">
                Compose ta liste des 26
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link
              to="/roster"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/65 transition-colors hover:text-foreground"
            >
              Voir le Roster
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Hero footer mini-grid — 4 numbers structured, no more raw text line.
              Falls back to "—" while loading so the layout never collapses. */}
          <motion.div
            variants={itemVariants}
            className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl border border-border/40 bg-border/40 max-w-2xl w-full"
          >
            <HeroStat label="Suivis" value={totalPlayers} />
            <HeroStat label="Roster" value={rosterCount} />
            <HeroStat label="Radar" value={radarCount} />
            <HeroStat label="Pays" value={countries} />
          </motion.div>

          <motion.div variants={itemVariants} className="-mt-2 flex flex-col items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/40 font-mono">
              Mis à jour chaque dimanche
            </span>
            {edition && formattedDate ? (
              <span className="text-xs text-foreground/40">
                Édition #{edition} du Best XI publiée {formattedDate}
              </span>
            ) : null}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Hero footer mini-stat. 4 of these sit side-by-side, separated by a 1px
 * gap on a darker background to draw the dividers without extra borders.
 */
function HeroStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-background/60 backdrop-blur-sm px-3 py-2.5 sm:py-3 text-center">
      <div className="font-serif text-xl sm:text-2xl text-foreground leading-none">
        {value ?? "—"}
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
    </div>
  );
}

export default LeopardsHero;
