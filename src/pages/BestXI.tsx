import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Link2, MessageCircle, Twitter, Instagram, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useBestXI, type BestXIPlayer, type BestXISlot } from "@/hooks/useBestXI";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { XIStatsPanel } from "@/components/best-xi/XIStatsPanel";
import { XIRosterCard } from "@/components/best-xi/XIRosterCard";
import { BestXIArchiveSection } from "@/components/best-xi/BestXIArchiveSection";

// Pitch slot coordinates per formation (% of pitch box, y=0 = attack)
const FORMATION_COORDS: Record<string, Record<string, { x: number; y: number }[]>> = {
  "4-3-3": {
    GK: [{ x: 50, y: 88 }],
    RB: [{ x: 85, y: 70 }],
    RCB: [{ x: 62, y: 72 }],
    LCB: [{ x: 38, y: 72 }],
    CB: [{ x: 50, y: 72 }],
    LB: [{ x: 15, y: 70 }],
    RCM: [{ x: 72, y: 48 }],
    CM: [{ x: 50, y: 50 }],
    LCM: [{ x: 28, y: 48 }],
    RW: [{ x: 80, y: 22 }],
    ST: [{ x: 50, y: 16 }],
    LW: [{ x: 20, y: 22 }],
  },
  "4-2-3-1": {
    GK: [{ x: 50, y: 88 }],
    RB: [{ x: 85, y: 70 }],
    RCB: [{ x: 62, y: 72 }],
    LCB: [{ x: 38, y: 72 }],
    CB: [{ x: 50, y: 72 }],
    LB: [{ x: 15, y: 70 }],
    RCM: [{ x: 62, y: 54 }],
    LCM: [{ x: 38, y: 54 }],
    CDM: [{ x: 50, y: 56 }],
    CM: [{ x: 50, y: 54 }],
    RW: [{ x: 78, y: 30 }],
    CAM: [{ x: 50, y: 32 }],
    LW: [{ x: 22, y: 30 }],
    ST: [{ x: 50, y: 14 }],
  },
  "3-5-2": {
    GK: [{ x: 50, y: 88 }],
    RCB: [{ x: 72, y: 72 }],
    CB: [{ x: 50, y: 74 }],
    LCB: [{ x: 28, y: 72 }],
    RWB: [{ x: 88, y: 50 }],
    LWB: [{ x: 12, y: 50 }],
    RCM: [{ x: 65, y: 52 }],
    CM: [{ x: 50, y: 54 }],
    LCM: [{ x: 35, y: 52 }],
    RST: [{ x: 60, y: 18 }],
    LST: [{ x: 40, y: 18 }],
    ST: [{ x: 50, y: 18 }],
  },
};

function getSlotCoords(formation: string, slots: BestXISlot[]) {
  const coordsByPos = FORMATION_COORDS[formation] ?? {};
  const usedIdx: Record<string, number> = {};
  return slots.map((slot) => {
    const positions = coordsByPos[slot.position] ?? [{ x: 50, y: 50 }];
    const idx = usedIdx[slot.position] ?? 0;
    usedIdx[slot.position] = idx + 1;
    const c = positions[Math.min(idx, positions.length - 1)];
    return { ...slot, x: c.x, y: c.y };
  });
}

function PitchSVG() {
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D2818" />
          <stop offset="55%" stopColor="#0B1F12" />
          <stop offset="100%" stopColor="#0A0A0B" />
        </linearGradient>
        <pattern id="mowStripes" patternUnits="userSpaceOnUse" width="400" height="50">
          <rect width="400" height="50" fill="transparent" />
          <rect width="400" height="25" fill="rgba(255,255,255,0.018)" />
        </pattern>
      </defs>
      <rect width="400" height="500" fill="url(#pitchGrad)" />
      <rect width="400" height="500" fill="url(#mowStripes)" />
      <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2">
        <rect x="14" y="14" width="372" height="472" rx="2" />
        <line x1="14" y1="250" x2="386" y2="250" />
        <circle cx="200" cy="250" r="48" />
        <rect x="100" y="14" width="200" height="70" />
        <rect x="150" y="14" width="100" height="28" />
        <path d="M 160 84 A 50 50 0 0 0 240 84" />
        <rect x="100" y="416" width="200" height="70" />
        <rect x="150" y="458" width="100" height="28" />
        <path d="M 160 416 A 50 50 0 0 1 240 416" />
      </g>
    </svg>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function PitchPlayer({
  slot,
  player,
  index = 0,
}: {
  slot: BestXISlot & { x: number; y: number };
  player: BestXIPlayer | undefined;
  /** Position dans le tableau positionedSlots — pilote le stagger d'entrée. */
  index?: number;
}) {
  // Stagger entrée joueurs : GK d'abord, puis défense, milieu, attaque.
  // 80ms entre chaque joueur, ressort doux. Total ~880ms pour les 11.
  // Reduced-motion : on saute l'animation, position finale immédiate.
  const reduced = useReducedMotion();
  const initial = reduced
    ? { opacity: 1, scale: 1, y: 0 }
    : { opacity: 0, scale: 0.6, y: 12 };
  const animate = { opacity: 1, scale: 1, y: 0 };
  const transition = reduced
    ? { duration: 0 }
    : {
        delay: 0.4 + index * 0.08,
        type: "spring" as const,
        stiffness: 220,
        damping: 18,
      };

  if (!player) {
    // Fallback: keep a yellow dot if player record missing
    return (
      <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/60 bg-background/80 font-mono text-xs font-bold text-primary backdrop-blur-md">
          {slot.label}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
    <Link
      to={`/player/${player.slug}`}
      className="group block"
      aria-label={`${player.name} — ${player.current_club ?? ""}`}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -m-2 rounded-full bg-primary/40 blur-md opacity-70 group-hover:opacity-100 transition-opacity"
          />
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            className="relative h-10 w-10 sm:h-14 sm:w-14 rounded-full border-[3px] border-primary shadow-lg shadow-primary/30 transition-transform group-hover:scale-110"
            initialsClassName="text-xs sm:text-sm"
          />
          {/* Tactical position chip — small badge anchored to the bottom of the
              avatar so the viewer can read GK/LB/CB even without scanning the
              roster card list below. */}
          <span
            aria-hidden
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center justify-center rounded-full border border-primary/70 bg-background/95 px-1.5 py-px font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-primary leading-none shadow-md"
          >
            {slot.position}
          </span>
        </div>
        <span className="mt-1.5 font-serif text-[10px] sm:text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] whitespace-nowrap max-w-[110px] truncate">
          {player.name.split(" ").slice(-1)[0]}
        </span>

        {/* Tooltip on hover */}
        <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-30 whitespace-nowrap">
          <div className="rounded-lg bg-background/95 border border-border px-3 py-1.5 shadow-xl backdrop-blur-md">
            <p className="font-serif text-xs font-semibold text-foreground">
              {player.name}
            </p>
            {player.current_club ? (
              <p className="text-[10px] text-muted">{player.current_club}</p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
    </motion.div>
  );
}

export default function BestXI() {
  useDocumentMeta({
    title: "Best XI",
    description:
      "Le Best XI Léopards de la semaine — composition rêvée, formation, statistiques, valeur cumulée. Édition hebdomadaire chaque dimanche.",
  });
  const { data, loading, error } = useBestXI();

  const positionedSlots = data ? getSlotCoords(data.formation, data.slots) : [];
  const playersInOrder = positionedSlots
    .map((slot) => data?.playersById[slot.player_id])
    .filter((p): p is BestXIPlayer => !!p);

  const handleShare = (channel: "twitter" | "whatsapp" | "copy") => {
    if (!data) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${data.title} — Le Best XI Diaspora cette semaine sur Léopards Radar`;
    if (channel === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else if (channel === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else if (channel === "copy") {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <header className="container-site pt-32 pb-10">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">
              Home
            </a>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Best XI</span>
          </nav>
          <h1 className="mt-4 font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Le Best XI Diaspora.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-light">
            Chaque semaine, notre composition rêvée des Léopards.
          </p>
        </header>

        {/* JSON-LD SportsTeam — microdata SEO pour l'indexation Google.
            WHY ici (hors loading guard) : Google crawle le JS rendu, la
            présence du script dès le montage garantit l'indexation même
            quand la data n'est pas encore chargée. On re-rend le bloc
            complet dès que `data` est disponible. */}
        {data ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SportsTeam",
                name: "République Démocratique du Congo",
                sport: "Soccer",
                coach: {
                  "@type": "Person",
                  name: "Sébastien Desabre",
                },
                athlete: positionedSlots.map((slot) => {
                  const p = data.playersById[slot.player_id];
                  if (!p) return null;
                  return {
                    "@type": "Person",
                    name: p.name,
                    jobTitle: p.position ?? slot.position,
                  };
                }).filter(Boolean),
                url: "https://angm-hub.github.io/leopardsradar/best-xi",
              }),
            }}
          />
        ) : null}

        <section className="container-site pb-20">
          {loading ? (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 w-40 animate-pulse rounded bg-card" />
                <div className="h-12 w-full animate-pulse rounded bg-card" />
                <div className="h-32 w-full animate-pulse rounded-card bg-card" />
              </div>
              <div className="lg:col-span-3">
                <div className="aspect-[4/5] w-full animate-pulse rounded-card bg-card" />
              </div>
            </div>
          ) : error || !data ? (
            <p className="text-center text-muted py-20">
              Aucune composition publiée pour le moment.
            </p>
          ) : (
            <>
              {/* Split éditorial / pitch — façon SeatGeek 2-col */}
              <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
                {/* Colonne éditoriale (40%) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                      Cette semaine
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">
                      {formatDate(data.published_at)}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight leading-tight">
                      {data.title}
                    </h2>
                    <p className="mt-2 font-mono text-sm text-muted">
                      Formation · {data.formation}
                    </p>
                  </div>

                  <XIStatsPanel players={playersInOrder} />

                  {data.editorial_note ? (
                    <div className="border-l-2 border-primary/50 pl-4">
                      <p className="font-serif text-base italic leading-relaxed text-foreground/85">
                        {data.editorial_note}
                      </p>
                    </div>
                  ) : null}

                  {/* Partage — câblé */}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted font-mono mb-2.5">
                      Partager ce XI
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare("twitter")}
                      >
                        <Twitter className="h-4 w-4" /> Twitter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare("whatsapp")}
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare("copy")}
                      >
                        <Link2 className="h-4 w-4" /> Copier le lien
                      </Button>
                      <Button variant="outline" size="sm" disabled title="Bientôt">
                        <Instagram className="h-4 w-4" /> Instagram
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Colonne pitch (60%) */}
                <div className="lg:col-span-3">
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-card border border-border bg-[#0A0A0B] shadow-2xl relative">
                    <PitchSVG />
                    {/* Watermark formation, en haut à gauche du pitch */}
                    <div className="absolute top-3 left-3 z-20 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                      {data.formation}
                    </div>
                    {positionedSlots.map((slot, i) => (
                      <PitchPlayer
                        key={`${slot.position}-${i}`}
                        slot={slot}
                        player={data.playersById[slot.player_id]}
                        index={i}
                      />
                    ))}
                    <div className="absolute bottom-3 left-0 right-0 z-20 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                      leopardsradar.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster détaillé — sous le split, full width */}
              <div className="mt-16">
                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
                  <h3 className="font-serif text-2xl text-foreground">
                    Le onze, joueur par joueur.
                  </h3>
                  <span className="text-xs text-muted-light font-mono">
                    Cliquez pour la fiche complète →
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positionedSlots.map((slot, i) => {
                    const player = data.playersById[slot.player_id];
                    if (!player) return null;
                    return (
                      <XIRosterCard
                        key={`${slot.position}-${i}`}
                        player={player}
                        number={slot.label}
                        tacticalPosition={slot.position}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Historique des éditions précédentes — visible uniquement
            si ≥ 2 entrées existent en base (hook gère le masquage). */}
        <BestXIArchiveSection />

        {/* CTA Ma Liste — remplace l'ancienne V2 tease */}
        <section className="container-site pb-24">
          <div className="mx-auto max-w-2xl rounded-card border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-8 text-center">
            <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              À ton tour
            </span>
            <h3 className="mt-4 font-serif text-2xl md:text-3xl text-foreground">
              Compose ta sélection des 26.
            </h3>
            <p className="mt-3 text-muted-light max-w-md mx-auto">
              Notre Best XI t'inspire ? Bâtis le tien — ton onze, ton banc, ton
              capitaine — et partage ta liste avec un lien.
            </p>
            <Link to="/ma-liste" className="inline-block mt-6">
              <Button>
                Composer ma liste <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
