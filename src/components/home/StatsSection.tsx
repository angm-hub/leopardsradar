import { motion, useReducedMotion } from "framer-motion";
import { Globe, Trophy } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { useHomeStats } from "@/hooks/useHomeStats";
import { formatMarketValueCompact } from "@/lib/playerHelpers";
import { ResidualGradient } from "@/components/ui/GradientBackgrounds";
import { NextMatchCard } from "@/components/home/NextMatchCard";
import { useFadeUp } from "@/lib/motion";

/**
 * Les Léopards en chiffres — resserré.
 *
 * Avant : un grand chiffre (valeur marchande) + une colonne de 3 stats
 * (roster, pays, diaspora) qui RÉPÉTAIENT les tuiles du hero (59 roster,
 * 69 pays). On a coupé cette colonne : on garde le seul chiffre que le
 * hero ne donne pas (la valeur marchande cumulée), la part top 5 européen,
 * et on termine sur le prochain match — l'accroche vivante.
 */
export function StatsSection() {
  const { stats, loading: statsLoading, error: statsError } = useHomeStats();
  const fadeUp = useFadeUp();
  const reduced = useReducedMotion();

  const hasMarketValue = !!stats?.total_market_value && stats.total_market_value > 0;
  const totalValueLabel = statsLoading
    ? "…"
    : hasMarketValue
      ? formatMarketValueCompact(stats!.total_market_value)
      : "À venir";

  const tier1Ratio =
    stats && stats.total_players
      ? Math.round(((stats.tier1_count ?? 0) / stats.total_players) * 100)
      : null;
  const statFallback = statsLoading ? "…" : statsError ? "Erreur" : "n.d.";

  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      <ResidualGradient position="top-bottom" />
      <div className="container-site max-w-5xl relative">
        <motion.div
          {...fadeUp(0)}
          className="flex flex-col gap-4 mb-14 md:mb-16 max-w-2xl"
        >
          <span className="label-mono text-cobalt-mist">Vue d'ensemble</span>
          <h2 className="display-heading text-4xl md:text-6xl text-foreground text-balance">
            Les Léopards en chiffres.
          </h2>
          <p className="text-muted-light text-base md:text-lg leading-relaxed max-w-xl">
            Derrière chaque joueur, une trajectoire. Ensemble, une cartographie.
          </p>
        </motion.div>

        {/* Un seul chiffre dominant : la valeur marchande cumulée (que le hero
            ne donne pas). Le reste des chiffres du roster vit déjà dans le hero. */}
        <motion.div {...fadeUp(0.1)} className="max-w-2xl">
          <p className="label-mono-sm text-muted mb-4">
            Valeur marchande cumulée
          </p>
          <div
            className={`display-heading ${
              hasMarketValue
                ? "text-7xl md:text-9xl text-foreground"
                : "text-5xl md:text-7xl text-muted"
            }`}
            style={{ lineHeight: 0.9 }}
          >
            {totalValueLabel}
          </div>
          <p className="mt-6 max-w-md italic text-lg md:text-xl text-foreground/75 leading-snug">
            {tier1Ratio !== null
              ? `${tier1Ratio}% du roster joue dans un top 5 européen.`
              : "Roster réparti entre clubs européens et africains."}
          </p>

          <div className="mt-6 max-w-sm">
            <div className="flex items-center justify-between label-mono-sm text-muted mb-2">
              <span>Top 5 européen</span>
              <span className="text-foreground/70">
                {tier1Ratio !== null ? `${tier1Ratio}%` : statFallback}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-border/60 overflow-hidden">
              <motion.div
                initial={reduced ? false : { width: 0 }}
                animate={reduced ? { width: `${tier1Ratio ?? 0}%` } : undefined}
                whileInView={reduced ? undefined : { width: `${tier1Ratio ?? 0}%` }}
                viewport={reduced ? undefined : { once: true }}
                transition={{ duration: reduced ? 0 : 1.2, ease: "easeOut", delay: reduced ? 0 : 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-cobalt-500 to-primary"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Pill icon={Trophy}>Play-offs conquis</Pill>
            <Pill icon={Globe}>Diaspora mondiale</Pill>
          </div>
        </motion.div>

        {/* Prochain match — l'accroche vivante (à venir), pas le bilan répété. */}
        <div className="mt-16 md:mt-20">
          <motion.div
            {...fadeUp(0.3)}
            className="rounded-card border border-border bg-card overflow-hidden"
          >
            <NextMatchCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
