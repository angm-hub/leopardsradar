import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Plus, X, Star, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { BuilderLibrary } from "./BuilderLibrary";
import { usePlayers } from "@/hooks/usePlayers";
import { FORMATION_SLOTS, BENCH_MIN_REQUIREMENTS } from "@/types/maListe";
import type { Formation, SlotPosition } from "@/types/maListe";
import { cn } from "@/lib/utils";
import {
  formatMarketValue,
  POSITION_LABEL,
} from "@/lib/playerHelpers";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

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

const FORMATIONS: Formation[] = ["4-3-3", "4-2-3-1", "3-5-2"];

/**
 * BuilderUnified — un seul écran pour formation + onze + banc + capitaine.
 *
 * Remplace 4 étapes du wizard (formation/lineup/bench/captain) par un
 * builder one-page type FUT. Library épinglée en sidebar permanente,
 * pitch + bench strip au centre, switch formation en haut, CTA récap
 * en bas. Capitaine assigné via clic sur l'étoile d'un joueur du XI.
 */
export function BuilderUnified() {
  const formation = useMaListeStore((s) => s.formation);
  const setFormation = useMaListeStore((s) => s.setFormation);
  const startingXI = useMaListeStore((s) => s.startingXI);
  const bench = useMaListeStore((s) => s.bench);
  const captain = useMaListeStore((s) => s.captain);
  const placePlayerInSlot = useMaListeStore((s) => s.placePlayerInSlot);
  const removePlayerFromSlot = useMaListeStore((s) => s.removePlayerFromSlot);
  const addToBench = useMaListeStore((s) => s.addToBench);
  const removeFromBench = useMaListeStore((s) => s.removeFromBench);
  const setCaptain = useMaListeStore((s) => s.setCaptain);
  const goToStep = useMaListeStore((s) => s.goToStep);
  const previousStep = useMaListeStore((s) => s.previousStep);
  const isStartingXIComplete = useMaListeStore((s) => s.isStartingXIComplete);
  const isBenchComplete = useMaListeStore((s) => s.isBenchComplete);

  const { players: allPlayers } = usePlayers({
    categories: ["roster", "radar"],
    excludeEligibilityStatus: "ineligible",
    limit: 1000,
  });

  const [activeSlot, setActiveSlot] = useState<SlotPosition | null>(null);

  if (!formation) {
    // Garde-fou : si formation pas encore choisie, redirige vers FormationPicker
    return null;
  }

  const slots = FORMATION_SLOTS[formation];
  const positions = PITCH_POSITIONS[formation];
  const xiCount = Object.values(startingXI).filter(Boolean).length;
  const xiOK = isStartingXIComplete();
  const benchOK = isBenchComplete();
  const captainOK = !!captain;
  const allOK = xiOK && benchOK && captainOK;

  const handlePickForSlot = (player: DBPlayer) => {
    if (!activeSlot) return;
    placePlayerInSlot(activeSlot, player);
    setActiveSlot(null);
  };

  const handlePickForBench = (player: DBPlayer) => {
    addToBench(player);
  };

  const handleSwitchFormation = (f: Formation) => {
    if (f === formation) return;
    if (xiCount > 0) {
      const ok = window.confirm(
        `Changer la formation va effacer ton XI actuel. Continuer ?`,
      );
      if (!ok) return;
    }
    setFormation(f);
    setActiveSlot(null);
  };

  return (
    <section className="relative bg-background">
      <div className="container-site max-w-[1400px] py-6 md:py-10">
        {/* Top bar */}
        <BuilderTopBar onBack={previousStep} formation={formation} onSwitchFormation={handleSwitchFormation} />

        {/* Title + global progress */}
        <div className="mt-6 mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
              Compose ton 26.
            </h2>
            <p className="mt-2 text-sm text-muted-light">
              {activeSlot
                ? `Choisis un joueur pour ${activeSlot} dans la library →`
                : `Click un slot vide pour le remplir, ou pioche dans la library pour ton banc.`}
            </p>
          </div>

          <BuilderProgress xiCount={xiCount} benchCount={bench.length} hasCaptain={!!captain} />
        </div>

        {/* MAIN GRID — pitch + bench center, library right */}
        <div className="grid lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Center : pitch + bench */}
          <div className="lg:col-span-8 space-y-5">
            {/* Pitch */}
            <div
              className={cn(
                "relative aspect-[3/4] md:aspect-[4/5] w-full overflow-hidden rounded-card border bg-gradient-to-b from-[#0D2818] via-[#0B1F12] to-[#06120A] shadow-2xl",
                activeSlot ? "border-primary/50" : "border-border",
              )}
            >
              <PitchSVG />
              <span className="absolute right-3 top-3 z-20 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
                {formation}
              </span>

              {slots.map((slot) => {
                const pos = positions[slot];
                if (!pos) return null;
                const player = startingXI[slot];
                const isActive = activeSlot === slot;

                return (
                  <div
                    key={slot}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    {player ? (
                      <PlacedPlayer
                        player={player}
                        slot={slot}
                        isCaptain={captain?.slug === player.slug}
                        onReplace={() => setActiveSlot(slot)}
                        onRemove={() => {
                          removePlayerFromSlot(slot);
                          if (captain?.slug === player.slug) setCaptain(null as never);
                        }}
                        onSetCaptain={() => setCaptain(player)}
                      />
                    ) : (
                      <EmptySlot
                        slot={slot}
                        active={isActive}
                        onClick={() =>
                          setActiveSlot((prev) => (prev === slot ? null : slot))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bench strip */}
            <BenchStrip
              bench={bench}
              captain={captain}
              onRemove={removeFromBench}
              onSetCaptain={(p) => setCaptain(p)}
            />

            {/* CTA bottom */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <Button
                size="lg"
                disabled={!allOK}
                onClick={() => goToStep("recap")}
                className="group w-full sm:w-auto"
              >
                {allOK
                  ? "Voir mon récap"
                  : missingLabel(xiCount, bench.length, !!captain)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Right : library */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-20 h-[600px] lg:h-[calc(100vh-7rem)]">
              <BuilderLibrary
                allPlayers={allPlayers ?? []}
                activeSlot={activeSlot}
                onPickForSlot={handlePickForSlot}
                onPickForBench={handlePickForBench}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Top bar : back + formation switcher */
function BuilderTopBar({
  onBack,
  formation,
  onSwitchFormation,
}: {
  onBack: () => void;
  formation: Formation;
  onSwitchFormation: (f: Formation) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1">
        {FORMATIONS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onSwitchFormation(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-mono transition-all",
              f === formation
                ? "bg-primary text-primary-foreground"
                : "text-muted-light hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono">
        Builder · One-page
      </span>
    </div>
  );
}

/** Progress chip avec 3 jauges (XI / banc / capitaine) */
function BuilderProgress({
  xiCount,
  benchCount,
  hasCaptain,
}: {
  xiCount: number;
  benchCount: number;
  hasCaptain: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-card/60 px-3 py-2">
      <Gauge label="XI" value={xiCount} max={11} />
      <span className="h-6 w-px bg-border" />
      <Gauge label="Banc" value={benchCount} max={15} />
      <span className="h-6 w-px bg-border" />
      <div className="flex items-center gap-1.5">
        <Star
          className={cn(
            "h-3.5 w-3.5",
            hasCaptain ? "fill-primary text-primary" : "text-muted",
          )}
        />
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.2em] font-mono",
            hasCaptain ? "text-foreground" : "text-muted",
          )}
        >
          Cap.
        </span>
      </div>
    </div>
  );
}

function Gauge({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const complete = value === max;
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono">{label}</span>
        <span className={cn("font-mono text-xs", complete ? "text-primary" : "text-foreground/85")}>
          {value}<span className="text-muted">/{max}</span>
        </span>
      </div>
      <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-background">
        <motion.div
          className={cn("h-full", complete ? "bg-primary" : "bg-foreground/40")}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/** Slot vide cliquable. */
function EmptySlot({
  slot,
  active,
  onClick,
}: {
  slot: SlotPosition;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center transition-transform hover:scale-105 focus:outline-none"
      aria-label={`Choisir un joueur pour ${slot}`}
    >
      <span
        className={cn(
          "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-2 border-dashed text-white/70 transition-all",
          active
            ? "border-primary bg-primary/15 text-primary scale-110 ring-4 ring-primary/20"
            : "border-white/40 bg-white/5 group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className={cn(
        "pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-wider",
        active ? "text-primary" : "text-white/70",
      )}>
        {slot}
      </span>
    </button>
  );
}

/** Joueur placé sur le pitch — avec étoile capitaine + remove. */
function PlacedPlayer({
  player,
  slot,
  isCaptain,
  onReplace,
  onRemove,
  onSetCaptain,
}: {
  player: DBPlayer;
  slot: SlotPosition;
  isCaptain: boolean;
  onReplace: () => void;
  onRemove: () => void;
  onSetCaptain: () => void;
}) {
  void slot;
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onReplace}
        className="relative block transition-transform duration-200 hover:scale-110 focus:outline-none focus:scale-110"
        aria-label={`Remplacer ${player.name}`}
      >
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-full border-[3px] shadow-xl shadow-black/50",
            isCaptain ? "border-primary ring-4 ring-primary/30" : "border-primary",
          )}
          initialsClassName="text-xs sm:text-sm"
        />
        {isCaptain ? (
          <span
            className="absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
            title="Capitaine"
          >
            <Crown className="h-3 w-3" strokeWidth={2.5} />
          </span>
        ) : null}
      </button>

      {/* Remove */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
        aria-label={`Retirer ${player.name}`}
      >
        <X className="h-3 w-3" strokeWidth={3} />
      </button>

      {/* Captain toggle (visible au hover si pas captain) */}
      {!isCaptain ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetCaptain();
          }}
          className="absolute -left-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
          aria-label={`Désigner ${player.name} capitaine`}
        >
          <Star className="h-3 w-3" strokeWidth={2.5} />
        </button>
      ) : null}

      {/* Name pill */}
      <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-sm bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-lg">
        {player.name.split(" ").slice(-1)[0]}
      </div>
    </div>
  );
}

/** Strip horizontal du banc (15 slots) */
function BenchStrip({
  bench,
  captain,
  onRemove,
  onSetCaptain,
}: {
  bench: DBPlayer[];
  captain: DBPlayer | null;
  onRemove: (slug: string) => void;
  onSetCaptain: (p: DBPlayer) => void;
}) {
  const reqs = useMemo(() => {
    const counts: Record<DBPosition, number> = {
      Goalkeeper: 0,
      Defender: 0,
      Midfield: 0,
      Attack: 0,
    };
    bench.forEach((p) => {
      if (p.position) counts[p.position]++;
    });
    return counts;
  }, [bench]);

  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card/60">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted font-mono">
          Banc · {bench.length} / 15
        </p>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <BenchReq label="GK" v={reqs.Goalkeeper} min={BENCH_MIN_REQUIREMENTS.Goalkeeper} />
          <BenchReq label="Déf" v={reqs.Defender} min={BENCH_MIN_REQUIREMENTS.Defender} />
          <BenchReq label="Mil" v={reqs.Midfield} min={BENCH_MIN_REQUIREMENTS.Midfield} />
          <BenchReq label="Att" v={reqs.Attack} min={BENCH_MIN_REQUIREMENTS.Attack} />
        </div>
      </div>
      <ul className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 p-3">
        {Array.from({ length: 15 }).map((_, i) => {
          const player = bench[i];
          if (!player) {
            return (
              <li
                key={`empty-${i}`}
                className="aspect-square rounded-md border border-dashed border-border/60 flex items-center justify-center"
              >
                <span className="text-[10px] font-mono text-muted/60">{i + 1}</span>
              </li>
            );
          }
          const isCap = captain?.slug === player.slug;
          return (
            <li key={player.slug} className="relative group">
              <button
                type="button"
                onClick={() => onSetCaptain(player)}
                className="block w-full aspect-square rounded-md overflow-hidden ring-1 ring-border group-hover:ring-primary/50 transition-all"
                title={`${player.name}${isCap ? " (Capitaine)" : ""} — click pour capitaine`}
              >
                <PlayerAvatar
                  name={player.name}
                  src={player.image_url}
                  className="h-full w-full"
                  initialsClassName="text-[9px]"
                />
              </button>
              {isCap ? (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                  <Crown className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
                </span>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(player.slug);
                }}
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background opacity-0 group-hover:opacity-100 shadow-md transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                aria-label={`Retirer ${player.name}`}
              >
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BenchReq({ label, v, min }: { label: string; v: number; min: number }) {
  const ok = v >= min;
  return (
    <span
      className={cn(
        "uppercase tracking-wider",
        ok ? "text-primary" : "text-muted",
      )}
    >
      {label}: {v}/{min}
    </span>
  );
}

function PitchSVG() {
  return (
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
  );
}

function missingLabel(xi: number, bench: number, captain: boolean): string {
  const parts: string[] = [];
  if (xi < 11) parts.push(`${11 - xi} XI`);
  if (bench < 15) parts.push(`${15 - bench} banc`);
  if (!captain) parts.push("capitaine");
  return parts.length ? `Manque : ${parts.join(", ")}` : "Voir mon récap";
}

void POSITION_LABEL;
void formatMarketValue;

export default BuilderUnified;
