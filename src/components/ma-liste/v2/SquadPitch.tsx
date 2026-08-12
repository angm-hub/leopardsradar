import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, X, ArrowDownUp, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useMaListeV2Store, MAX_BENCH } from "@/store/maListeV2Store";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import {
  assignStarters,
  BUCKET_LABEL,
  FORMATION_433,
  noteOf,
} from "./squadFormation";

function lastName(name: string): string {
  return name.split(" ").slice(-1)[0];
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
        <linearGradient id="mlPitch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D2818" />
          <stop offset="55%" stopColor="#0B1F12" />
          <stop offset="100%" stopColor="#0A0A0B" />
        </linearGradient>
        <pattern id="mlMow" patternUnits="userSpaceOnUse" width="400" height="50">
          <rect width="400" height="50" fill="transparent" />
          <rect width="400" height="25" fill="rgba(255,255,255,0.018)" />
        </pattern>
      </defs>
      <rect width="400" height="500" fill="url(#mlPitch)" />
      <rect width="400" height="500" fill="url(#mlMow)" />
      <g fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="1.2">
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

interface SquadPitchProps {
  /** Un slot vide est cliqué : focalise la pioche sur ce poste. */
  onPickPosition: (bucket: DBPosition) => void;
}

export function SquadPitch({ onPickPosition }: SquadPitchProps) {
  const starters = useMaListeV2Store((s) => s.starters);
  const bench = useMaListeV2Store((s) => s.bench);
  const captain = useMaListeV2Store((s) => s.captain);
  const setCaptain = useMaListeV2Store((s) => s.setCaptain);
  const removePlayer = useMaListeV2Store((s) => s.removePlayer);
  const toggleStatus = useMaListeV2Store((s) => s.toggleStatus);
  const reduced = useReducedMotion();

  const [selected, setSelected] = useState<DBPlayer | null>(null);
  const { placed, overflow } = assignStarters(starters);

  const isStarter = (slug: string) => starters.some((p) => p.slug === slug);
  const closeMenu = () => setSelected(null);

  return (
    <div className="space-y-4">
      {/* Terrain */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border shadow-2xl">
        <PitchSVG />
        <span className="absolute left-3 top-3 z-20 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
          4-3-3
        </span>

        {placed.map(({ slot, player }, i) =>
          player ? (
            <PlayerToken
              key={slot.id}
              slot={slot}
              player={player}
              index={i}
              isCaptain={captain?.slug === player.slug}
              active={selected?.slug === player.slug}
              onSelect={() => setSelected(selected?.slug === player.slug ? null : player)}
              reduced={!!reduced}
            />
          ) : (
            <EmptySlot
              key={slot.id}
              code={slot.code}
              x={slot.x}
              y={slot.y}
              onClick={() => onPickPosition(slot.bucket)}
              reduced={!!reduced}
            />
          ),
        )}
      </div>

      {/* Barre d'action du joueur sélectionné */}
      {selected ? (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/80 p-2.5 backdrop-blur-md"
        >
          <PlayerAvatar
            name={selected.name}
            src={selected.image_url}
            className="h-9 w-9 shrink-0 rounded-full ring-1 ring-border"
            initialsClassName="text-[11px]"
          />
          <span className="mr-auto min-w-0 truncate font-serif text-sm font-semibold text-foreground">
            {selected.name}
          </span>
          <ActionBtn
            active={captain?.slug === selected.slug}
            onClick={() => {
              setCaptain(captain?.slug === selected.slug ? null : selected);
            }}
            icon={Crown}
            label="Capitaine"
          />
          <ActionBtn
            onClick={() => {
              toggleStatus(selected.slug);
              closeMenu();
            }}
            icon={ArrowDownUp}
            label={isStarter(selected.slug) ? "Banc" : "XI"}
          />
          <ActionBtn
            onClick={() => {
              removePlayer(selected.slug);
              closeMenu();
            }}
            icon={Trash2}
            label="Retirer"
            danger
          />
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Fermer"
            className="rounded-md p-1.5 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ) : null}

      {/* Débordement de ligne */}
      {overflow.length > 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300/90">
          {overflow.length} titulaire{overflow.length > 1 ? "s" : ""} hors 4-3-3
          {" "}({overflow.map((p) => BUCKET_LABEL[p.position as DBPosition] ?? "?").join(", ")}).
          Bascule-les au banc ou change de ligne.
        </p>
      ) : null}

      {/* Banc */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cobalt-mist">
            Banc
          </span>
          <span className="font-mono text-[10px] text-muted">
            {bench.length}/{MAX_BENCH}
          </span>
        </div>
        {bench.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted">
            Complète ton banc de 15 depuis la pioche.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {bench.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setSelected(selected?.slug === p.slug ? null : p)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors",
                  selected?.slug === p.slug
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-card/60 hover:border-border-hover",
                )}
              >
                <PlayerAvatar
                  name={p.name}
                  src={p.image_url}
                  className="h-5 w-5 rounded-full"
                  initialsClassName="text-[8px]"
                />
                <span className="max-w-[90px] truncate text-[11px] text-foreground/85">
                  {lastName(p.name)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerToken({
  slot,
  player,
  index,
  isCaptain,
  active,
  onSelect,
  reduced,
}: {
  slot: { code: string; x: number; y: number };
  player: DBPlayer;
  index: number;
  isCaptain: boolean;
  active: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const note = noteOf(player);
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={reduced ? false : { opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { delay: 0.05 + index * 0.05, type: "spring", stiffness: 240, damping: 18 }
      }
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      aria-label={`${player.name} · ${slot.code}`}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 -m-1.5 rounded-full blur-md transition-opacity",
              isCaptain ? "bg-primary/60 opacity-90" : "bg-primary/35 opacity-60",
            )}
          />
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            srcAlt={player.image_url_alt}
            className={cn(
              "relative h-11 w-11 rounded-full border-[3px] shadow-lg transition-transform sm:h-14 sm:w-14",
              active ? "scale-110 border-white" : "border-primary",
            )}
            initialsClassName="text-xs sm:text-sm"
          />
          {isCaptain ? (
            <span className="absolute -left-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Crown className="h-3 w-3" />
            </span>
          ) : null}
          {note != null ? (
            <span className="absolute -bottom-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-primary/70 bg-background/95 px-1 py-px font-mono text-[8px] font-bold leading-none text-primary tabular-nums shadow-md sm:text-[9px]">
              {Math.round(note)}
            </span>
          ) : null}
        </div>
        <span className="mt-1 max-w-[92px] truncate font-serif text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-xs">
          {lastName(player.name)}
        </span>
      </div>
    </motion.button>
  );
}

function EmptySlot({
  code,
  x,
  y,
  onClick,
  reduced,
}: {
  code: string;
  x: number;
  y: number;
  onClick: () => void;
  reduced: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={`Ajouter un ${code}`}
    >
      <div className="flex flex-col items-center gap-1">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white/35 bg-background/30 text-white/70 backdrop-blur-sm transition-all group-hover:border-primary group-hover:bg-primary/15 group-hover:text-primary sm:h-14 sm:w-14",
            !reduced && "animate-pulse-subtle",
          )}
        >
          <Plus className="h-5 w-5" />
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/55">
          {code}
        </span>
      </div>
    </button>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: typeof Crown;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : danger
            ? "border-border text-muted hover:border-blood/50 hover:text-blood"
            : "border-border text-foreground/80 hover:border-border-hover hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export default SquadPitch;
