import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import PlayerCard from "./PlayerCard";
import { MOCK_PLAYERS } from "@/data/mockPlayers";

// Featured 8 — top market value
const PLAYERS = [...MOCK_PLAYERS]
  .sort((a, b) => b.marketValueEur - a.marketValueEur)
  .slice(0, 8);

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function RosterPreviewSection() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">
              Les Léopards en ce moment
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
              Leurs performances cette semaine.
            </h2>
          </div>
          <a
            href="/roster"
            className="group inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
            Voir tout le roster
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Mobile: horizontal scroll */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-12 flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 -mx-5 px-5 pb-2"
        >
          {PLAYERS.map((player) => (
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
          className="mt-12 hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6"
        >
          {PLAYERS.map((player) => (
            <motion.div key={player.slug} variants={itemVariants}>
              <PlayerCard player={player} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default RosterPreviewSection;
