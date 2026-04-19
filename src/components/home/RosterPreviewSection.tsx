import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import PlayerCard, { type Player } from "./PlayerCard";

const PLAYERS: Player[] = [
  {
    slug: "chancel-mbemba",
    name: "Chancel Mbemba",
    photoUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600",
    club: "LOSC Lille",
    clubLogoUrl: "https://placehold.co/40x40/CE1126/FFFFFF?text=L",
    position: "DEF",
    stats: { matches: 21, goals: 2, assists: 1, minutes: 1890 },
    marketValue: "8M €",
    isCaptain: true,
  },
  {
    slug: "aaron-wan-bissaka",
    name: "Aaron Wan-Bissaka",
    photoUrl:
      "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600",
    club: "West Ham",
    clubLogoUrl: "https://placehold.co/40x40/7A263A/FFFFFF?text=WH",
    position: "DEF",
    stats: { matches: 24, goals: 1, assists: 3, minutes: 2100 },
    marketValue: "25M €",
  },
  {
    slug: "noah-sadiki",
    name: "Noah Sadiki",
    photoUrl:
      "https://images.unsplash.com/photo-1552072804-e9ef8ef59e1d?w=600",
    club: "Sunderland",
    clubLogoUrl: "https://placehold.co/40x40/E41E22/FFFFFF?text=S",
    position: "MID",
    stats: { matches: 28, goals: 4, assists: 5, minutes: 2450 },
    marketValue: "22M €",
  },
  {
    slug: "cedric-bakambu",
    name: "Cédric Bakambu",
    photoUrl:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600",
    club: "Real Betis",
    clubLogoUrl: "https://placehold.co/40x40/0BB363/FFFFFF?text=B",
    position: "ATT",
    stats: { matches: 22, goals: 9, assists: 2, minutes: 1750 },
    marketValue: "4M €",
  },
  {
    slug: "fiston-mayele",
    name: "Fiston Mayele",
    photoUrl:
      "https://images.unsplash.com/photo-1542893673-1ebbfd4d7a40?w=600",
    club: "Pyramids FC",
    clubLogoUrl: "https://placehold.co/40x40/003DA5/FFFFFF?text=P",
    position: "ATT",
    stats: { matches: 26, goals: 15, assists: 4, minutes: 2200 },
    marketValue: "6M €",
  },
  {
    slug: "theo-bongonda",
    name: "Théo Bongonda",
    photoUrl:
      "https://images.unsplash.com/photo-1554539452-3144db8b62db?w=600",
    club: "Spartak Moscow",
    clubLogoUrl: "https://placehold.co/40x40/C8102E/FFFFFF?text=SM",
    position: "ATT",
    stats: { matches: 20, goals: 7, assists: 6, minutes: 1680 },
    marketValue: "8M €",
  },
  {
    slug: "nathanael-mbuku",
    name: "Nathanaël Mbuku",
    photoUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
    club: "Montpellier",
    clubLogoUrl: "https://placehold.co/40x40/00529F/FFFFFF?text=M",
    position: "ATT",
    stats: { matches: 25, goals: 6, assists: 3, minutes: 1980 },
    marketValue: "5M €",
  },
  {
    slug: "edo-kayembe",
    name: "Edo Kayembe",
    photoUrl:
      "https://images.unsplash.com/photo-1566577134624-a1bcda9faf3a?w=600",
    club: "Watford",
    clubLogoUrl: "https://placehold.co/40x40/FBEE23/000000?text=W",
    position: "MID",
    stats: { matches: 27, goals: 2, assists: 4, minutes: 2350 },
    marketValue: "7M €",
  },
];

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
            href="#roster"
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
