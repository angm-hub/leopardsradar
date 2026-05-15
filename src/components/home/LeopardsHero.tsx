import { lazy, Suspense, useState } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Pill } from "@/components/ui/Pill";
import { RDCConstellation } from "@/components/ui/RDCConstellation";

// Lazy : le shader Paper pèse ~30 kB gzip (WebGL). On le sort du bundle main
// pour préserver le LCP. Pendant le chargement (~200ms cache cold), la
// RDCConstellation SVG sert de fallback — même intention de signature
// territoriale, zéro flash.
const LeopardsGrainBackground = lazy(() =>
  import("@/components/ui/LeopardsGrainBackground").then((m) => ({
    default: m.LeopardsGrainBackground,
  })),
);
import { useLatestBestXIMeta } from "@/hooks/useLatestBestXIMeta";
import { useHomeStats } from "@/hooks/useHomeStats";
import { useHomeStatsWeekly } from "@/hooks/useHomeStatsWeekly";
import { useMondialCountdown } from "@/hooks/useMondialCountdown";

// ─── Personas ─────────────────────────────────────────────────────────────────

type PersonaKey = "fan" | "scout" | "journaliste" | "curieux";

interface Persona {
  key: PersonaKey;
  label: string;
  tagline: string;
  cta: string;
  href: string;
}

const PERSONAS: Persona[] = [
  {
    key: "fan",
    label: "Fan",
    tagline: "Tu suis les Léopards depuis toujours ?",
    cta: "Compose ton Best XI",
    href: "/best-xi",
  },
  {
    key: "scout",
    label: "Scout",
    tagline: "Tu cherches le prochain talent ?",
    cta: "Explorer le Radar",
    href: "/radar",
  },
  {
    key: "journaliste",
    label: "Journaliste",
    tagline: "Tu travailles sur un papier ?",
    cta: "Consulter la revue de presse",
    href: "/revue-de-presse",
  },
  {
    key: "curieux",
    label: "Curieux",
    tagline: "Tu découvres le foot RDC ?",
    cta: "En savoir plus",
    href: "/a-propos",
  },
];

const LS_KEY = "lr_home_persona";

function readStoredPersona(): PersonaKey {
  try {
    const stored = localStorage.getItem(LS_KEY) as PersonaKey | null;
    if (stored && PERSONAS.some((p) => p.key === stored)) return stored;
  } catch {
    // localStorage peut être bloqué (mode privé strict)
  }
  return "fan";
}

// ─── Segmented control personas ───────────────────────────────────────────────

function PersonaTabs() {
  const [active, setActive] = useState<PersonaKey>(readStoredPersona);

  const persona = PERSONAS.find((p) => p.key === active)!;

  function selectPersona(key: PersonaKey) {
    setActive(key);
    try {
      localStorage.setItem(LS_KEY, key);
    } catch {
      // silencieux
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Segmented control */}
      <div className="inline-flex rounded-full border border-border/60 bg-card/40 backdrop-blur-sm p-1">
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => selectPersona(p.key)}
            className="relative px-3 py-1.5 text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-pressed={active === p.key}
          >
            {/* Pill actif — layoutId pour la transition glissante */}
            {active === p.key && (
              <motion.span
                layoutId="persona-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              />
            )}
            <span
              className={
                active === p.key
                  ? "relative z-10 text-primary-foreground"
                  : "relative z-10 text-muted-light"
              }
            >
              {p.label}
            </span>
          </button>
        ))}
      </div>

      {/* Contenu de la tab active — fade simple */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="text-sm text-foreground/70">{persona.tagline}</p>
          <Link
            to={persona.href}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            {persona.cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
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
  const { stats: weekly } = useHomeStatsWeekly();
  const { daysUntilKickoff, kickoffDateLabel, phase } = useMondialCountdown();
  const totalPlayers = stats?.total_players ?? null;
  const radarCount = stats?.radar_count ?? null;
  const rosterCount = stats?.roster_count ?? null;
  const countries = stats?.total_countries ?? null;

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-background">
      {/* Atmosphère Cobalt — première couche cinématique du brand book Premium v2.
          Trois radial-gradients superposés (mist haut-gauche, deep bas-droit,
          floor) sur linear cobalt 700→900→void. Remplace l'ancien blob vert
          #00A651 par la signature territoriale cobalt (drapeau RDC désaturé). */}
      <div aria-hidden className="absolute inset-0 atmos-jade" />

      {/* Shader Paper Design (grain gradient blob WebGL) conservé — il ajoute
          une 2e couche de profondeur cinétique au-dessus de l'atmosphère
          statique. Lazy pour préserver le LCP. Fallback constellation SVG
          si le shader rate son chargement. */}
      <Suspense fallback={<RDCConstellation />}>
        <LeopardsGrainBackground />
      </Suspense>

      {/* Grain SVG inline — texture qui casse le flat des gradients. Brand
          book pattern : opacity 0.35 sur grain standard, 0.18 sur grain-soft.
          Mix-blend-mode overlay pour ne pas laver les ombres. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.18]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette cinéma : assombrissement subtil aux bords pour focaliser
          l'œil sur le centre. Brand book = "silence is the design". */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(5,11,26,0.55) 90%)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/55 to-background pointer-events-none" />

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
          <motion.h1
            variants={itemVariants}
            className="display-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-balance text-foreground"
          >
            Toute la data du{" "}
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
              football congolais.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-foreground/75 max-w-2xl text-balance"
          >
            {totalPlayers ?? "—"} joueurs trackés. Diaspora éligible cartographiée.
            Statut FIFA recalculé chaque dimanche.{" "}
            {phase === "before"
              ? `Mondial 2026 — J-${daysUntilKickoff}.`
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

          {/* Segmented control personas — 4 lectures différentes du site.
              Discret, premium : petit font-mono, pill glissant Framer Motion. */}
          <motion.div variants={itemVariants} className="w-full max-w-lg">
            <PersonaTabs />
          </motion.div>

          {/* Hero footer mini-grid — 4 chiffres alignés. Cards séparées avec
              gap réel (vs gap-px bg-border/40 qui faisait "tableur"). Le badge
              "+N" sur Suivis n'apparaît plus qu'entre 1 et 30 — au-delà, c'est
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
            {weekly && weekly.enrichedSinceSunday > 0 ? (
              <span className="text-xs text-foreground/40">
                {weekly.enrichedSinceSunday} profils enrichis cette semaine
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
        {value ?? "—"}
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
