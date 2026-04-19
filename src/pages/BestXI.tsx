import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Link2, MessageCircle, Twitter, Instagram } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useBestXI, type BestXIPlayer, type BestXISlot } from "@/hooks/useBestXI";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPosition } from "@/types/dbPlayer";

// Pitch slot coordinates per formation (% of pitch box, y=0 = attack)
const FORMATION_COORDS: Record<string, Record<string, { x: number; y: number }[]>> = {
  "4-3-3": {
    GK: [{ x: 50, y: 88 }],
    RB: [{ x: 85, y: 70 }],
    CB: [
      { x: 62, y: 72 },
      { x: 38, y: 72 },
    ],
    LB: [{ x: 15, y: 70 }],
    CM: [
      { x: 72, y: 48 },
      { x: 50, y: 50 },
      { x: 28, y: 48 },
    ],
    RW: [{ x: 80, y: 22 }],
    ST: [{ x: 50, y: 16 }],
    LW: [{ x: 20, y: 22 }],
  },
  "4-2-3-1": {
    GK: [{ x: 50, y: 88 }],
    RB: [{ x: 85, y: 70 }],
    CB: [
      { x: 62, y: 72 },
      { x: 38, y: 72 },
    ],
    LB: [{ x: 15, y: 70 }],
    CDM: [
      { x: 62, y: 54 },
      { x: 38, y: 54 },
    ],
    CM: [
      { x: 62, y: 54 },
      { x: 38, y: 54 },
    ],
    RW: [{ x: 78, y: 30 }],
    CAM: [{ x: 50, y: 32 }],
    LW: [{ x: 22, y: 30 }],
    ST: [{ x: 50, y: 14 }],
  },
  "3-5-2": {
    GK: [{ x: 50, y: 88 }],
    CB: [
      { x: 72, y: 72 },
      { x: 50, y: 74 },
      { x: 28, y: 72 },
    ],
    RWB: [{ x: 88, y: 50 }],
    LWB: [{ x: 12, y: 50 }],
    CM: [
      { x: 65, y: 52 },
      { x: 50, y: 54 },
      { x: 35, y: 52 },
    ],
    ST: [
      { x: 60, y: 18 },
      { x: 40, y: 18 },
    ],
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
}: {
  slot: BestXISlot & { x: number; y: number };
  player: BestXIPlayer | undefined;
}) {
  if (!player) {
    // Fallback: keep a yellow dot if player record missing
    return (
      <div
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/60 bg-background/80 font-mono text-xs font-bold text-primary backdrop-blur-md">
          {slot.label}
        </span>
      </div>
    );
  }

  return (
    <Link
      to={`/player/${player.slug}`}
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      aria-label={`${player.name} — ${player.current_club ?? ""}`}
    >
      <div className="flex flex-col items-center gap-1.5">
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
        </div>
        <span className="font-serif text-[10px] sm:text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] whitespace-nowrap max-w-[110px] truncate">
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
  );
}

export default function BestXI() {
  const { data, loading, error } = useBestXI();
  const [email, setEmail] = useState("");

  const onNotify = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmail("");
    alert("Merci ! On te prévient dès le lancement.");
  };

  const positionedSlots = data ? getSlotCoords(data.formation, data.slots) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <header className="container-site pt-32 pb-12">
          <h1 className="font-serif text-6xl text-foreground">
            Le Best XI Diaspora.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">
            Chaque semaine, notre composition rêvée des Léopards.
          </p>
        </header>

        {/* Current composition */}
        <section className="container-site pb-20">
          {loading ? (
            <div className="mx-auto h-[600px] w-full max-w-lg animate-pulse rounded-card bg-card" />
          ) : error || !data ? (
            <p className="text-center text-muted py-20">
              Aucune composition publiée pour le moment.
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <p className="text-sm uppercase tracking-[0.2em] text-muted">
                  {formatDate(data.published_at)}
                </p>
                <span className="font-mono text-xs text-primary">
                  Formation {data.formation}
                </span>
              </div>
              <h2 className="mt-2 font-serif text-2xl md:text-3xl text-foreground">
                {data.title}
              </h2>

              <div className="mx-auto mt-6 aspect-[4/5] w-full max-w-lg overflow-hidden rounded-card border border-border bg-[#0A0A0B] shadow-2xl relative">
                <PitchSVG />
                {positionedSlots.map((slot, i) => (
                  <PitchPlayer
                    key={`${slot.position}-${i}`}
                    slot={slot}
                    player={data.playersById[slot.player_id]}
                  />
                ))}
                <div className="absolute bottom-3 left-0 right-0 z-20 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                  leopardsradar.com
                </div>
              </div>

              {/* Share */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button variant="outline" size="sm">
                  <Twitter className="h-4 w-4" /> Partager
                </Button>
                <Button variant="outline" size="sm">
                  <Instagram className="h-4 w-4" /> Instagram
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
                <Button variant="outline" size="sm">
                  <Link2 className="h-4 w-4" /> Copier
                </Button>
              </div>

              {data.editorial_note ? (
                <p className="mx-auto mt-10 max-w-prose text-center font-serif text-lg italic leading-relaxed text-foreground/80">
                  {data.editorial_note}
                </p>
              ) : null}

              {/* Player roster grid */}
              <div className="mt-16">
                <h3 className="font-serif text-2xl text-foreground mb-6">
                  Le onze.
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positionedSlots.map((slot, i) => {
                    const player = data.playersById[slot.player_id];
                    if (!player) return null;
                    return (
                      <Link
                        key={`${slot.position}-${i}`}
                        to={`/player/${player.slug}`}
                        className="group flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-border-hover hover:bg-card-hover"
                      >
                        <PlayerAvatar
                          name={player.name}
                          src={player.image_url}
                          className="h-14 w-14 rounded-full shrink-0 ring-1 ring-border"
                          initialsClassName="text-base"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-primary uppercase tracking-wider">
                              {slot.position}
                            </span>
                            <span className="text-[10px] text-muted">
                              #{slot.label}
                            </span>
                          </div>
                          <p className="font-serif text-base text-foreground truncate group-hover:text-primary transition-colors">
                            {player.name}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {player.current_club ?? "—"}
                            {player.position
                              ? ` · ${POSITION_LABEL[player.position as DBPosition] ?? player.position}`
                              : ""}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {/* V2 tease */}
        <section className="container-site py-16">
          <div className="mx-auto max-w-2xl rounded-card border border-primary/30 bg-gradient-to-br from-card to-background p-8 text-center">
            <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              Bientôt
            </span>
            <h3 className="mt-4 font-serif text-2xl text-foreground">
              Compose TON Best XI Léopards.
            </h3>
            <p className="mt-3 text-muted">
              Drag-and-drop, partage sur les réseaux, vote communautaire. On finalise.
            </p>
            <form
              onSubmit={onNotify}
              className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="flex-1 rounded-button border border-border bg-background px-5 py-3 text-foreground outline-none transition-colors focus:border-primary"
              />
              <Button type="submit" variant="primary" size="md">
                Me notifier
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
