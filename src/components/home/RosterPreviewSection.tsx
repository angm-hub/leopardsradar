import { motion, type Variants } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import PlayerCard from "./PlayerCard";
import PlayerCardSkeleton from "@/components/ui/PlayerCardSkeleton";
import { usePlayers } from "@/hooks/usePlayers";

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function RosterPreviewSection() {
  // 6 first roster players, sorted by market value (matches /roster default)
  const { players, loading } = usePlayers({
    category: "roster",
    excludeEligibilityStatus: "ineligible",
    limit: 6,
    orderBy: { column: "market_value_eur", ascending: false },
  });

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">
              Les Léopards en ce moment
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
              Le roster international.
            </h2>
          </div>
          <Link
            to="/roster"
            className="group inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
            Voir tout le roster
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PlayerCardSkeleton key={i} />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center py-20 gap-3">
            <Search className="h-12 w-12 text-foreground" style={{ opacity: 0.3 }} />
            <h3 className="font-serif text-2xl text-foreground">
              Aucun joueur dans le roster pour l'instant.
            </h3>
            <p className="text-muted">Le roster se met à jour chaque dimanche soir.</p>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal scroll */}
            <motion.div
              variants={gridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="mt-12 flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 -mx-5 px-5 pb-2"
            >
              {players.map((player) => (
                <motion.div
                  key={player.slug}
                  variants={itemVariants}
                  className="snap-start shrink-0 w-[70vw]"
                >
                  <PlayerCard player={player} />
                </motion.div>
              ))}
            </motion.div>

            {/* Tablet/Desktop grid */}
            <motion.div
              variants={gridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="mt-12 hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-5 lg:gap-6"
            >
              {players.map((player) => (
                <motion.div key={player.slug} variants={itemVariants}>
                  <PlayerCard player={player} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}

export default RosterPreviewSection;
