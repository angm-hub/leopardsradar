import { lazy, Suspense } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Pill } from "@/components/ui/Pill";
import { TextRevealWords, TextRevealMask } from "@/components/motion";

// Lazy : le shader Paper pèse ~30 kB gzip (WebGL). On le sort du bundle main
// pour préserver le LCP. Pendant le chargement (~200ms cache cold), un fond
// dark uni sert de fallback — couche unique d'atmosphere, le shader fait
// tout le travail visuel.
const LeopardsGrainBackground = lazy(() =>
  import("@/components/ui/LeopardsGrainBackground").then((m) => ({
    default: m.LeopardsGrainBackground,
  })),
);
import { useLatestBestXIMeta } from "@/hooks/useLatestBestXIMeta";
import { useHomeStats } from "@/hooks/useHomeStats";
import { useHomeStatsWeekly } from "@/hooks/useHomeStatsWeekly";
import { useMondialCountdown } from "@/hooks/useMondialCountdown";

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
  const { stats: weekly } = useHomeStatsWeekly();
  const { daysUntilKickoff, kickoffDateLabel, phase } = useMondialCountdown();
  const totalPlayers = stats?.total_players ?? null;
  const radarCount = stats?.radar_count ?? null;
  const rosterCount = stats?.roster_count ?? null;
  const countries = stats?.total_countries ?? null;

  // Garde-fou crédibilité (règle data kAIra) : "N profils enrichis cette
  // semaine" n'est un signal éditorial que si le volume est crédible pour
  // 7 jours. Au-delà, c'est un reprocess batch (updated_at bumpé en masse)
  // et l'afficher gonfle la métrique. On retombe alors sur la ligne édition.
  const ENRICH_CEILING = 80;
  const crediblyEnriched =
    !!weekly &&
    weekly.enrichedSinceSunday > 0 &&
    weekly.enrichedSinceSunday <= ENRICH_CEILING;

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-background">
      {/* Unique couche atmosphere : shader Paper Design (grain gradient blob WebGL).
          Lazy pour preserver le LCP. Fallback minimal (background dark) si le
          shader rate. On a retire atmos-jade / grain SVG / vignette / constellation
          pour laisser l'aspect plus calme et premium type ORA · une seule couche
          lumineuse anime sur fond noir. */}
      <Suspense fallback={<div aria-hidden className="absolute inset-0 bg-background" />}>
        <LeopardsGrainBackground />
      </Suspense>

      {/* Fade vers le bas pour relier au reste de la page sans rupture. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

      <div className="container-site relative z-10 flex min-h-[100dvh] items-center py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl flex flex-col items-center text-center gap-8"
        >
          <motion.div variants={itemVariants}>
            <Pill dot dotColor="bg-cobalt-mist">
              Saison 2025/26
            </Pill>
          </motion.div>

          {/* H1 — Geist display tracking serré -4.5%, line-height 0.92 (brand
              book Premium v2). Mobile : 4xl pour éviter le break "footbal/l"
              sur 390px. md+ : 7xl/8xl pour l'impact silencieux du brand book. */}
          {/* H1 — pattern hybride :
              - "Toute la data du" : TextRevealWords (split par mot avec blur, ORA-style)
              - "football congolais." : TextRevealMask (slide-up sans fragmenter,
                permet de conserver le bg-clip-text gradient intact)
              Le motion.h1 wrapper hereite itemVariants pour declencher la
              cascade des anims enfants. */}
          <motion.h1
            variants={itemVariants}
            className="display-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-balance text-foreground"
          >
            <TextRevealWords as="span" delay={0.15} stagger={0.06} blur>
              Toute la data du
            </TextRevealWords>
            {" "}
            <TextRevealMask delay={0.55} duration={1.0}>
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                football congolais.
              </span>
            </TextRevealMask>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-foreground/75 max-w-2xl text-balance"
          >
            {totalPlayers ?? "…"} joueurs trackés. Diaspora éligible cartographiée.
            Statut FIFA recalculé chaque dimanche.{" "}
            {phase === "before"
              ? `Mondial 2026 · J-${daysUntilKickoff}.`
              : phase === "during"
                ? "Le Mondial des Léopards, match par match."
                : "Des locaux du championnat à la diaspora, en continu."}
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
            <Link to="/radar" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="group w-full sm:w-auto">
                Explorer le radar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link
              to={phase === "before" ? "/roster" : "/switchables"}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/65 transition-colors hover:text-foreground"
            >
              {phase === "before" ? "Voir le Roster" : "Le vivier récupérable"}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Hero footer mini-grid — 4 chiffres alignés. Cards séparées avec
              gap réel (vs gap-px bg-border/40 qui faisait "tableur"). Le badge
              "+N" sur Suivis n'apparaît plus qu'entre 1 et 30 · au-delà, c'est
              un import en masse, pas un signal éditorial : afficher "+566"
              donnerait l'impression d'une croissance gonflée. */}
          <motion.div
            variants={itemVariants}
            className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl w-full"
          >
            <HeroStat
              label="Suivis"
              value={totalPlayers}
              delta={weekly?.newSinceSunday ?? null}
            />
            <HeroStat label="Roster" value={rosterCount} />
            <HeroStat label="Radar" value={radarCount} />
            <HeroStat label="Pays" value={countries} />
          </motion.div>

          <motion.div variants={itemVariants} className="-mt-2 flex flex-col items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/40 font-mono">
              Mis à jour chaque dimanche
            </span>
            {crediblyEnriched ? (
              <span className="text-xs text-foreground/40">
                {weekly!.enrichedSinceSunday} profils enrichis cette semaine
                {edition && formattedDate ? ` · Best XI #${edition} publié ${formattedDate}` : ""}
              </span>
            ) : edition && formattedDate ? (
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
 *
 * Optional `delta` surfaces a "+N" badge in the brand primary, signalling
 * weekly motion. Hidden when delta is null/0 to avoid showing a flat zero
 * (which would communicate "nothing happened" instead of just "no signal").
 */
function HeroStat({
  label,
  value,
  delta,
}: {
  label: string;
  value: number | null;
  delta?: number | null;
}) {
  // Affiche le badge delta uniquement entre 1 et 30 — fenêtre d'un signal
  // éditorial crédible sur 7 jours. Au-delà, c'est un import (seed, scraping
  // batch) et ça gonfle la métrique sans valeur éditoriale.
  const showDelta = typeof delta === "number" && delta > 0 && delta <= 30;
  return (
    <div className="relative rounded-lg border border-border/60 bg-background/70 backdrop-blur-sm px-3 py-3 sm:py-4 text-center">
      <div className="font-serif text-2xl sm:text-3xl text-foreground leading-none tracking-tight">
        {value ?? "…"}
      </div>
      <div className="mt-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      {showDelta ? (
        <div
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 inline-flex items-center rounded-full bg-primary/15 text-primary text-[9px] font-mono font-medium leading-none px-1.5 py-0.5"
          title={`+${delta} depuis dimanche dernier`}
        >
          +{delta}
        </div>
      ) : null}
    </div>
  );
}

export default LeopardsHero;
