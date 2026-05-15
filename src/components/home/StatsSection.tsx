import { motion, useReducedMotion } from "framer-motion";
import { Globe, Trophy, MapPin } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { useHomeStats } from "@/hooks/useHomeStats";
import { formatMarketValueCompact } from "@/lib/playerHelpers";
import { ResidualGradient } from "@/components/ui/GradientBackgrounds";
import { NextMatchCard } from "@/components/home/NextMatchCard";
import { useFadeUp } from "@/lib/motion";

const cardBase =
  "relative overflow-hidden rounded-2xl bg-card border border-border";

export function StatsSection() {
  const { stats, loading: statsLoading, error: statsError } = useHomeStats();
  const fadeUp = useFadeUp();
  const reduced = useReducedMotion();

  const hasMarketValue = !!stats?.total_market_value && stats.total_market_value > 0;
  const totalValueLabel = statsLoading
    ? "—"
    : hasMarketValue
      ? formatMarketValueCompact(stats!.total_market_value)
      : "À venir";

  const rosterCount = stats?.roster_count ?? null;
  const totalCountries = stats?.total_countries ?? null;
  const tier1Ratio =
    stats && stats.total_players
      ? Math.round(((stats.tier1_count ?? 0) / stats.total_players) * 100)
      : null;
  const statFallback = statsLoading ? "—" : statsError ? "Erreur" : "—";

  // Renders a stat number with a shimmer skeleton while data loads.
  // Replaces the bare "—" fallback that flashed for ~300 ms on every page
  // load and made the bento grid look broken on slow networks.
  const StatNumber = ({
    value,
    suffix = "",
    className = "font-mono text-5xl font-bold text-foreground leading-none",
    width = "w-[3ch]",
  }: {
    value: number | string | null;
    suffix?: string;
    className?: string;
    width?: string;
  }) => {
    if (statsLoading) {
      return (
        <div
          className={`${width} h-[1em] rounded bg-gradient-to-r from-card via-card-hover to-card animate-shimmer ${className.includes("text-5xl") ? "h-12" : "h-9"}`}
          style={{ backgroundSize: "200% 100%" }}
          aria-hidden
        />
      );
    }
    if (value === null || value === undefined) {
      return <div className={`${className} text-muted`}>{statFallback}</div>;
    }
    return (
      <div className={className}>
        {value}
        {suffix}
      </div>
    );
  };


  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      <ResidualGradient position="top-bottom" />
      <div className="container-site max-w-6xl relative">
        {/* Header — éditorial sec, pas de duplication entre eyebrow et H2.
            Le H2 fait le travail seul, l'eyebrow donne juste l'ancrage. */}
        <motion.div
          {...fadeUp(0)}
          className="flex flex-col gap-4 mb-16 md:mb-20 max-w-2xl"
        >
          <span className="label-mono text-cobalt-mist">
            Vue d'ensemble
          </span>
          <h2 className="display-heading text-4xl md:text-6xl text-foreground text-balance">
            Les Léopards en chiffres.
          </h2>
          <p className="text-muted-light text-base md:text-lg leading-relaxed max-w-xl">
            Derrière chaque joueur, une trajectoire. Ensemble, une cartographie.
          </p>
        </motion.div>

        {/* Format éditorial — sortie du bento générique. Un grand chiffre
            dominant à gauche (la valeur marchande), 3 chiffres secondaires
            empilés à droite avec divider. Pas de cards. Hiérarchie visuelle
            par taille typographique uniquement, comme dans la presse écrite. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* COLONNE GAUCHE — chiffre dominant : valeur marchande cumulée */}
          <motion.div {...fadeUp(0.1)} className="lg:col-span-7">
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

            {/* Barre de progression Tier 1 — gradient cobalt 500 → Star
                (drapeau RDC) au lieu de success → primary. Cohérence DA Cobalt. */}
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
              <Pill dot dotColor="bg-cobalt-mist">Mondial 2026</Pill>
              <Pill icon={Trophy}>Play-offs conquis</Pill>
              <Pill icon={Globe}>Diaspora mondiale</Pill>
            </div>
          </motion.div>

          {/* COLONNE DROITE — 3 chiffres secondaires empilés avec divider */}
          <motion.dl
            {...fadeUp(0.2)}
            className="lg:col-span-5 lg:pl-12 lg:border-l lg:border-border/40 flex flex-col gap-10"
          >
            {/* Roster actif */}
            <div>
              <dt className="label-mono-sm text-muted">
                Roster actif
              </dt>
              <dd className="mt-2 flex items-baseline gap-3">
                <StatNumber
                  value={rosterCount}
                  className="display-heading text-5xl md:text-6xl text-foreground"
                  width="w-[2ch]"
                />
                <span className="text-sm text-muted-light">
                  internationaux en activité
                </span>
              </dd>
            </div>

            {/* Pays */}
            <div className="border-t border-border/40 pt-10">
              <dt className="label-mono-sm text-muted">
                Pays d'évolution
              </dt>
              <dd className="mt-2 flex items-baseline gap-3">
                <StatNumber
                  value={totalCountries}
                  className="display-heading text-5xl md:text-6xl text-foreground"
                  width="w-[2ch]"
                />
                <span className="text-sm text-muted-light">
                  3 continents
                </span>
              </dd>
            </div>

            {/* Diaspora — phrase édito sans chiffre car elle n'a pas de stat
                quanti propre, juste un mini visuel diaspora */}
            <div className="border-t border-border/40 pt-10">
              <dt className="label-mono-sm text-muted mb-3 inline-flex items-center gap-2">
                <MapPin className="h-3 w-3 text-cobalt-mist" /> Diaspora
              </dt>
              <dd>
                <p className="italic text-xl text-foreground/85 leading-snug">
                  Une diaspora, 3 continents, 22 pays.
                </p>
                <div className="mt-4 h-20 relative">
                  <MiniWorldMap />
                </div>
              </dd>
            </div>
          </motion.dl>
        </div>

        {/* Prochain match — détaché du bento, en bandeau séparé sous le bloc
            data. Termine la section sur un signal éditorial concret (le
            prochain rdv des Léopards). */}
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

/* Minimal world map silhouette w/ yellow diaspora dots */
function MiniWorldMap() {
  const dots = [
    { x: 48, y: 42 },
    { x: 50, y: 45 },
    { x: 46, y: 40 },
    { x: 52, y: 44 },
    { x: 53, y: 50 },
    { x: 55, y: 60 },
    { x: 70, y: 38 },
    { x: 25, y: 45 },
  ];
  return (
    <svg
      viewBox="0 0 100 60"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        {/* Pattern de fond pointillé. Avant : pointait sur une variable CSS
            inexistante (--border-hover) → motif invisible sur fond noir.
            Maintenant : couleur en clair pour rester perceptible sur la card. */}
        <pattern id="dots" width="2" height="2" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.3" fill="#3a3a44" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100" height="60" fill="url(#dots)" />
      {/* Dots diaspora — un par continent + Europe densifiée. */}
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="2.4" fill="#F5C518" opacity="0.25" />
          <circle cx={d.x} cy={d.y} r="0.9" fill="#F5C518" />
        </g>
      ))}
    </svg>
  );
}

export default StatsSection;

