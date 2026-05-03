import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useWeeklyMovers, type WeeklyMover } from "@/hooks/useWeeklyMovers";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

const POSITION_FR: Record<string, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfield: "Milieu",
  Attack: "Attaquant",
};

/**
 * Le 5 du dimanche — section signature alimentée par player_stats_weekly.
 *
 * Évolution depuis l'audit : on ne sert plus une liste statique des "joueurs
 * roster les plus populaires". On sert un classement dynamique alimenté par
 * la RPC `get_weekly_movers` qui :
 *
 *   - Si snapshot dimanche précédent dispo → top 5 progressions (G+A delta)
 *     avec narration "+2 buts cette semaine"
 *   - Sinon (premier snapshot) → top 5 contributeurs saison absolue avec
 *     narration "5B · 2PD sur 28 matchs"
 *
 * Le badge "live" s'affiche quand la perf est vraiment hebdo (vs fallback
 * saison) — donne au lecteur récurrent un signal qu'il y a du nouveau.
 *
 * Cadence : se met à jour automatiquement à chaque snapshot dimanche soir.
 * Pas de curating manuel nécessaire — la data fait l'éditorial.
 */
export function FeaturedThisWeek() {
  const { movers, loading } = useWeeklyMovers(5);

  if (!loading && movers.length === 0) return null;

  const hasAnyWeekly = movers.some((m) => m.has_weekly_delta);

  return (
    <section className="container-site py-16 border-t border-border/40">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85 mb-2">
            Le 5 du dimanche
            {hasAnyWeekly ? (
              <span className="ml-3 inline-flex items-center gap-1 text-success">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle" />
                Mis à jour cette semaine
              </span>
            ) : null}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            Cinq Léopards en mouvement.
          </h2>
        </div>
        <Link
          to="/roster"
          className="group inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors"
        >
          Tout le roster
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {(loading ? Array.from({ length: 5 }).map(() => null) : movers).map((m, i) => (
          <MoverCard key={m?.player_id ?? `skel-${i}`} mover={m} index={i} />
        ))}
      </div>
    </section>
  );
}

function MoverCard({ mover, index }: { mover: WeeklyMover | null; index: number }) {
  if (!mover) {
    return (
      <div
        className="aspect-[3/4] rounded-card border border-border bg-card animate-shimmer"
        style={{ backgroundSize: "200% 100%" }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: "easeOut" }}
    >
      <Link
        to={`/player/${mover.slug}`}
        className="group relative block aspect-[3/4] rounded-[14px] overflow-hidden surface-1 transition-[box-shadow,filter] duration-300 hover:[filter:brightness(1.06)] hover:[box-shadow:0_0_0_0.5px_rgba(252,209,22,0.35),0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_rgba(252,209,22,0.12)]"
      >
        <PlayerAvatar
          name={mover.name}
          src={mover.image_url}
          className="absolute inset-0 h-full w-full"
          initialsClassName="text-5xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/85 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="font-serif text-base sm:text-lg text-foreground leading-tight truncate">
            {mover.name}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-light truncate">
            {mover.current_club ?? "Sans club"}
            {mover.player_position ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                {POSITION_FR[mover.player_position] ?? mover.player_position}
              </>
            ) : null}
          </div>
          <div
            className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] ${
              mover.has_weekly_delta
                ? "border-success/40 bg-success/15 text-success"
                : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            {mover.signal}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default FeaturedThisWeek;
