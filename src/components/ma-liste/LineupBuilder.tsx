import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { PlayerSelectionDrawer } from "./PlayerSelectionDrawer";
import { usePlayers } from "@/hooks/usePlayers";
import { FORMATION_SLOTS } from "@/types/maListe";
import type { Formation, SlotPosition } from "@/types/maListe";
import { cn } from "@/lib/utils";

// Pitch coordinates per formation (% of width / height)
const PITCH_POSITIONS: Record<Formation, Partial<Record<SlotPosition, { x: number; y: number }>>> = {
  "4-3-3": {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 28, y: 47 }, CM: { x: 50, y: 50 }, RCM: { x: 72, y: 47 },
    LW: { x: 15, y: 22 }, ST: { x: 50, y: 14 }, RW: { x: 85, y: 22 },
  },
  "4-2-3-1": {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 35, y: 54 }, RCM: { x: 65, y: 54 },
    LW: { x: 18, y: 30 }, CAM: { x: 50, y: 33 }, RW: { x: 82, y: 30 },
    ST: { x: 50, y: 12 },
  },
  "3-5-2": {
    GK: { x: 50, y: 90 },
    LCB: { x: 25, y: 72 }, CB: { x: 50, y: 75 }, RCB: { x: 75, y: 72 },
    LWB: { x: 8, y: 50 }, LCM: { x: 30, y: 50 }, CM: { x: 50, y: 53 }, RCM: { x: 70, y: 50 }, RWB: { x: 92, y: 50 },
    LST: { x: 35, y: 17 }, RST: { x: 65, y: 17 },
  },
};

export function LineupBuilder() {
  const formation = useMaListeStore((s) => s.formation);
  const startingXI = useMaListeStore((s) => s.startingXI);
  const previousStep = useMaListeStore((s) => s.previousStep);
  const nextStep = useMaListeStore((s) => s.nextStep);
  const removePlayerFromSlot = useMaListeStore((s) => s.removePlayerFromSlot);
  const getStartingXICount = useMaListeStore((s) => s.getStartingXICount);
  const isStartingXIComplete = useMaListeStore((s) => s.isStartingXIComplete);

  // Pull a generous list of eligible players (roster + radar)
  const { players: allPlayers, loading } = usePlayers({
    categories: ["roster", "radar"],
    excludeEligibilityStatus: "ineligible",
    limit: 1000,
  });

  const [drawerSlot, setDrawerSlot] = useState<SlotPosition | null>(null);

  if (!formation) {
    return (
      <div className="container-site max-w-2xl py-32 text-center">
        <p className="font-serif text-2xl text-foreground">
          Aucune formation sélectionnée.
        </p>
        <button
          onClick={previousStep}
          className="mt-6 text-sm uppercase tracking-[0.2em] text-primary hover:text-primary/80"
        >
          ← Choisir une formation
        </button>
      </div>
    );
  }

  const slots = FORMATION_SLOTS[formation];
  const positions = PITCH_POSITIONS[formation];
  const xiCount = getStartingXICount();
  const complete = isStartingXIComplete();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="container-site max-w-5xl py-8 md:py-14">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={previousStep}
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i <= 3 ? "w-6 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>

          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            3/5 · XI Titulaire
          </span>
        </div>

        {/* Title */}
        <div className="mb-8 max-w-2xl">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-balance">
            Ton XI de départ.
          </h2>
          <p className="mt-3 text-base md:text-lg text-muted-light leading-relaxed">
            Formation :{" "}
            <span className="font-mono font-semibold text-primary">
              {formation}
            </span>{" "}
            · Tape sur chaque poste pour choisir un joueur.
          </p>
        </div>

        {/* Counter + progress bar */}
        <div className="mb-6 rounded-card border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">
              Joueurs placés
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              <span className={complete ? "text-primary" : ""}>{xiCount}</span>
              <span className="text-muted"> / 11</span>
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${(xiCount / 11) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Pitch */}
        <div className="relative mx-auto aspect-[3/4] w-full max-w-2xl overflow-hidden rounded-card border border-border bg-gradient-to-b from-[#0D2818] via-[#0B1F12] to-[#06120A] shadow-2xl">
          {/* Pitch lines */}
          <svg
            viewBox="0 0 300 400"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <g fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1">
              <rect x="10" y="10" width="280" height="380" rx="2" />
              <line x1="10" y1="200" x2="290" y2="200" />
              <circle cx="150" cy="200" r="36" />
              <circle cx="150" cy="200" r="2" fill="rgba(255,255,255,0.4)" />
              <rect x="80" y="10" width="140" height="50" />
              <rect x="80" y="340" width="140" height="50" />
              <rect x="115" y="10" width="70" height="22" />
              <rect x="115" y="368" width="70" height="22" />
            </g>
          </svg>

          {/* Formation label */}
          <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
            {formation}
          </span>

          {/* Slots */}
          {slots.map((slot) => {
            const pos = positions[slot];
            if (!pos) return null;
            const player = startingXI[slot];

            return (
              <div
                key={slot}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {player ? (
                  <div className="group relative">
                    <button
                      type="button"
                      onClick={() => setDrawerSlot(slot)}
                      className="relative block transition-transform duration-200 hover:scale-110 focus:outline-none focus:scale-110"
                      aria-label={`Remplacer ${player.name}`}
                    >
                      <PlayerAvatar
                        name={player.name}
                        src={player.image_url}
                        className="h-12 w-12 rounded-full border-[3px] border-primary shadow-xl shadow-black/50 sm:h-16 sm:w-16"
                        initialsClassName="text-xs sm:text-sm"
                      />
                    </button>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlayerFromSlot(slot);
                      }}
                      className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground sm:h-6 sm:w-6"
                      aria-label={`Retirer ${player.name}`}
                    >
                      <X className="h-3 w-3" strokeWidth={3} />
                    </button>
                    {/* Name pill */}
                    <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-sm bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-lg sm:text-[10px]">
                      {player.name.split(" ").slice(-1)[0]}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDrawerSlot(slot)}
                    className="group relative flex flex-col items-center transition-transform hover:scale-105 focus:outline-none"
                    aria-label={`Choisir un joueur pour ${slot}`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-white/5 text-white/70 transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary sm:h-16 sm:w-16">
                      <Plus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-wider text-white/70 sm:text-[10px]">
                      {slot}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Continue CTA */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            disabled={!complete}
            onClick={nextStep}
            className="group"
          >
            {complete
              ? "Continuer vers le banc"
              : `${11 - xiCount} joueur${11 - xiCount > 1 ? "s" : ""} manquant${11 - xiCount > 1 ? "s" : ""}`}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          {loading && (
            <p className="text-xs text-muted">Chargement des joueurs…</p>
          )}
        </div>
      </div>

      {/* Drawer */}
      <PlayerSelectionDrawer
        slot={drawerSlot}
        onClose={() => setDrawerSlot(null)}
        allPlayers={allPlayers ?? []}
      />
    </section>
  );
}

export default LineupBuilder;
