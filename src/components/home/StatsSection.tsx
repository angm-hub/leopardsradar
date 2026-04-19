import { motion } from "framer-motion";
import { Globe, Trophy, MapPin, Calendar } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { useHomeStats } from "@/hooks/useHomeStats";
import { usePlayers } from "@/hooks/usePlayers";
import { formatMarketValue } from "@/lib/playerHelpers";
import { ResidualGradient } from "@/components/ui/GradientBackgrounds";

const cardBase =
  "relative overflow-hidden rounded-2xl bg-card border border-border";

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, ease: "easeOut" as const, delay },
  };
}

// Static countdown to June 17, 2026
function getCountdown() {
  const target = new Date("2026-06-17T18:00:00Z").getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

export function StatsSection() {
  const { days, hours } = getCountdown();
  const { stats } = useHomeStats();
  const { players: rosterPlayers } = usePlayers({ category: "roster" });

  // Top scorer from roster
  const topScorer = [...rosterPlayers]
    .sort((a, b) => (b.season_goals ?? 0) - (a.season_goals ?? 0))[0];

  // Tier 1 ratio
  const tier1Count = rosterPlayers.filter((p) => p.tier === "tier1").length;
  const tier1Ratio = rosterPlayers.length
    ? Math.round((tier1Count / rosterPlayers.length) * 100)
    : 0;

  const totalValueLabel = stats?.total_market_value
    ? formatMarketValue(stats.total_market_value)
    : "—";
  const totalPlayers = stats?.total_roster ?? 0;
  const totalCountries = stats?.total_countries ?? 0;
  const avgAge = stats?.avg_age ? Math.round(stats.avg_age) : 0;

  return (
    <section className="relative py-24 md:py-32 bg-background overflow-hidden">
      <ResidualGradient position="top-bottom" />
      <div className="container-site max-w-7xl relative">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-12 max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">
            Les Léopards en chiffres
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Les Léopards en chiffres.
          </h2>
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-xl">
            Derrière chaque joueur, une trajectoire. Ensemble, une cartographie.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 md:auto-rows-[180px]">
          {/* CARD A — Hero */}
          <motion.div
            {...fadeUp(0)}
            className={`${cardBase} md:col-span-2 md:row-span-2 p-8 flex flex-col justify-between`}
          >
            <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">
                Valeur marchande cumulée
              </span>
              <div className="mt-4 font-mono text-6xl md:text-7xl font-bold text-foreground leading-none">
                {totalValueLabel}
              </div>
            </div>

            <div className="relative mt-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Joueurs en top 5 européen</span>
                <span className="text-foreground font-medium">{tier1Ratio}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${tier1Ratio}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                />
              </div>
            </div>

            <div className="relative mt-6 flex flex-wrap gap-2">
              <Pill dot dotColor="bg-success">Mondial 2026</Pill>
              <Pill icon={Trophy}>Play-offs conquis</Pill>
              <Pill icon={Globe}>Diaspora mondiale</Pill>
            </div>
          </motion.div>

          {/* CARD B — JOUEURS */}
          <motion.div
            {...fadeUp(0.1)}
            className={`${cardBase} md:col-span-1 md:row-span-1 p-6 flex flex-col justify-between`}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Joueurs
            </span>
            <div>
              <div className="font-mono text-5xl font-bold text-foreground leading-none">
                {totalPlayers}
              </div>
              <p className="mt-2 text-xs text-muted">dans le roster actif</p>
            </div>
          </motion.div>

          {/* CARD C — PAYS */}
          <motion.div
            {...fadeUp(0.2)}
            className={`${cardBase} md:col-span-1 md:row-span-1 p-6 flex flex-col justify-between`}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Pays
            </span>
            <div>
              <div className="font-mono text-5xl font-bold text-foreground leading-none">
                {totalCountries}
              </div>
              <p className="mt-2 text-xs text-muted">où les Léopards évoluent</p>
            </div>
          </motion.div>

          {/* CARD D — Map miniature */}
          <motion.div
            {...fadeUp(0.3)}
            className={`${cardBase} md:col-span-2 md:row-span-1 p-6`}
          >
            <div className="absolute inset-0 opacity-60">
              <MiniWorldMap />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end">
              <div className="flex items-center gap-2 text-xs text-muted">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="uppercase tracking-[0.2em]">Diaspora</span>
              </div>
              <p className="mt-1 font-serif text-xl text-foreground">
                Une diaspora, 3 continents.
              </p>
            </div>
          </motion.div>

          {/* CARD E — ÂGE MOYEN */}
          <motion.div
            {...fadeUp(0.4)}
            className={`${cardBase} md:col-span-1 md:row-span-1 p-6 flex flex-col justify-between`}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Âge moyen
            </span>
            <div>
              <div className="font-mono text-5xl font-bold text-foreground leading-none">
                {avgAge}
              </div>
              <p className="mt-2 text-xs text-muted">ans · génération pic</p>
            </div>
          </motion.div>

          {/* CARD F — Top scoreur */}
          <motion.div
            {...fadeUp(0.5)}
            className={`${cardBase} md:col-span-1 md:row-span-1 p-5 flex items-center gap-4`}
          >
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#00A651] to-[#004d25] flex items-center justify-center text-foreground font-bold text-lg shrink-0 ring-1 ring-border overflow-hidden">
              {topScorer?.image_url ? (
                <img
                  src={topScorer.image_url}
                  alt={topScorer.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                topScorer?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() ?? "—"
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                Top scoreur
              </span>
              <p className="mt-1 font-serif text-base text-foreground truncate">
                {topScorer?.name ?? "—"}
              </p>
              <p className="font-mono text-sm text-primary">
                {topScorer ? `${topScorer.season_goals ?? 0} buts` : "—"}
              </p>
            </div>
          </motion.div>

          {/* CARD G — Prochain match */}
          <motion.div
            {...fadeUp(0.6)}
            className={`${cardBase} md:col-span-2 md:row-span-1 p-6 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                Prochain match
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
                Coupe du monde 2026
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇨🇩</span>
                  <span className="font-serif text-lg text-foreground">RDC</span>
                </div>
                <span className="font-mono text-xs text-muted">vs</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇵🇹</span>
                  <span className="font-serif text-lg text-foreground">POR</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-foreground leading-none">
                    {days}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted mt-1">
                    jours
                  </span>
                </div>
                <span className="text-muted">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-foreground leading-none">
                    {hours}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted mt-1">
                    heures
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>17 juin 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                <span>Stade de New York</span>
              </div>
            </div>
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
        <pattern id="dots" width="2" height="2" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.3" fill="hsl(var(--border-hover, 240 5% 18%))" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100" height="60" fill="url(#dots)" />
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="2.4" fill="#FCD116" opacity="0.18" />
          <circle cx={d.x} cy={d.y} r="0.9" fill="#FCD116" />
        </g>
      ))}
    </svg>
  );
}

export default StatsSection;
