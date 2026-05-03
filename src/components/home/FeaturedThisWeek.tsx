import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useFeaturedPlayers } from "@/hooks/useFeaturedPlayers";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";

/**
 * FeaturedThisWeek — bandeau "À suivre cette semaine".
 *
 * Sits right after the hero. Solves the audit's biggest CRO leak : no
 * recognised player names in the fold, so a fan with no time scrolls past
 * the abstract stats line. Showing 5 photos + names + last contribution
 * gives the visitor an immediate "oh, that's where I get my Wissa update"
 * hook.
 *
 * Choice of "contribution" over "next match" : we don't have a matches
 * table yet (fixing that lives in the audit's 🟢 backlog). Until we do,
 * surfacing season goals + assists answers the same fan question "who's
 * been delivering ?" without faking data.
 */
export function FeaturedThisWeek() {
  const { players, loading } = useFeaturedPlayers(5);

  if (!loading && players.length === 0) return null;

  return (
    <section className="container-site py-16 border-t border-border/40">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85 mb-2">
            À suivre cette semaine
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            Cinq Léopards à garder à l'œil.
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
        {(loading ? Array.from({ length: 5 }).map(() => null) : players).map((p, i) => (
          <FeaturedCard key={p?.id ?? `skel-${i}`} player={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ player, index }: { player: DBPlayer | null; index: number }) {
  if (!player) {
    return (
      <div
        className="aspect-[3/4] rounded-card border border-border bg-card animate-shimmer"
        style={{ backgroundSize: "200% 100%" }}
      />
    );
  }

  const goals = player.season_goals ?? 0;
  const assists = player.season_assists ?? 0;
  const games = player.season_games ?? 0;

  // Editorial micro-line : pick the strongest signal we have.
  let signal = "Saison à suivre";
  if (goals > 0 && assists > 0) signal = `${goals}B · ${assists}PD en ${games} matchs`;
  else if (goals > 0) signal = `${goals} but${goals > 1 ? "s" : ""} en ${games} matchs`;
  else if (assists > 0) signal = `${assists} PD en ${games} matchs`;
  else if (games > 0) signal = `${games} matchs joués`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: "easeOut" }}
    >
      <Link
        to={`/player/${player.slug}`}
        className="group relative block aspect-[3/4] rounded-card overflow-hidden bg-card border border-border transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      >
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
          initialsClassName="text-5xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/85 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="font-serif text-base sm:text-lg text-foreground leading-tight truncate">
            {player.name}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-light truncate">
            {player.current_club ?? "Sans club"}
            {player.position ? (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                {POSITION_LABEL[player.position]}
              </>
            ) : null}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-primary">
            {signal}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default FeaturedThisWeek;
