import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, X, ArrowDownUp, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ClubBadge } from "@/components/clubs/ClubBadge";
import { useMaListeV2Store, MAX_BENCH } from "@/store/maListeV2Store";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import {
  assignStarters,
  BUCKET_LABEL,
  SLOT_CODE_FR,
  FORMATION_433,
  noteOf,
  posCodeFr,
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
  /** Un joueur est en cours de glisser depuis la pioche (desktop). */
  isDragging?: boolean;
  /** Dépôt sur le terrain → titulaire. */
  onDropStarter?: (e: React.DragEvent) => void;
  /** Dépôt sur le banc → remplaçant. */
  onDropBench?: (e: React.DragEvent) => void;
}

export function SquadPitch({
  onPickPosition,
  isDragging = false,
  onDropStarter,
  onDropBench,
}: SquadPitchProps) {
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
      {/* Terrain — zone de dépôt (desktop drag) : lâcher ici titularise. */}
      <div
        onDragOver={
          onDropStarter
            ? (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }
            : undefined
        }
        onDrop={onDropStarter}
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden rounded-2xl border shadow-2xl transition-[border-color,box-shadow]",
          isDragging
            ? "border-primary/70 shadow-[0_0_0_2px_rgba(245,197,24,0.35),0_0_40px_rgba(245,197,24,0.18)]"
            : "border-border",
        )}
      >
        <PitchSVG />
        <span className="absolute left-3 top-3 z-20 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
          4-3-3
        </span>
        {/* Invite de dépôt pendant le drag */}
        {isDragging ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center pt-6"
          >
            <span className="rounded-full border border-primary/50 bg-cobalt-deep/85 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
              Lâche pour titulariser
            </span>
          </div>
        ) : null}

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
              code={SLOT_CODE_FR[slot.code] ?? slot.code}
              bucket={slot.bucket}
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

      {/* Banc — zone de dépôt (desktop drag) : lâcher ici met au banc. */}
      <div
        onDragOver={
          onDropBench
            ? (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }
            : undefined
        }
        onDrop={onDropBench}
        className={cn(
          "rounded-xl transition-colors",
          isDragging &&
            "bg-primary/[0.06] ring-1 ring-inset ring-primary/40 p-2 -m-2",
        )}
      >
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cobalt-mist">
            Banc
            {isDragging ? (
              <span className="ml-2 text-primary/80">· lâche ici pour le banc</span>
            ) : null}
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

/**
 * Carte joueur type FUT (refonte FC/2K, 04/09) — remplace la pastille ronde.
 *
 * Layout carte or : note + poste en haut-gauche (encre navy sur or), photo
 * à droite, bandeau sombre en bas avec nom + écusson club. Le capitaine porte
 * l'écusson C or. Interaction inchangée : clic → barre d'action du parent.
 *
 * A la pose, la carte monte en spring (pop) et un halo or flashe une fois
 * (feedback satisfaisant). La note du XI qui grimpe est portée par le HUD
 * (useCountUp), on ne double pas ici.
 */
function PlayerToken({
  slot,
  player,
  index,
  isCaptain,
  active,
  onSelect,
  reduced,
}: {
  slot: { code: string; bucket: DBPosition; x: number; y: number };
  player: DBPlayer;
  index: number;
  isCaptain: boolean;
  active: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const note = noteOf(player);
  // Poste EXACT du joueur en FR (position_code/detail Transfermarkt), sinon
  // poste général. Jamais le code tactique du slot (souvent faux).
  const posCode = posCodeFr(player);
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={reduced ? false : { opacity: 0, scale: 0.55, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { delay: 0.04 + index * 0.045, type: "spring", stiffness: 260, damping: 17 }
      }
      whileTap={reduced ? undefined : { scale: 0.94 }}
      className="absolute z-10 w-[52px] -translate-x-1/2 -translate-y-1/2 sm:w-[64px]"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      aria-label={`${player.name} · ${posCode}${note != null ? ` · ${Math.round(note)}` : ""}`}
    >
      {/* Halo or : flash à la pose puis lueur douce permanente. */}
      <motion.span
        aria-hidden
        initial={reduced ? false : { opacity: 0.9, scale: 1.25 }}
        animate={{ opacity: isCaptain ? 0.7 : 0.45, scale: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 -m-1 rounded-[11px] bg-primary/50 blur-md"
      />

      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[10px] shadow-[0_6px_16px_rgba(0,0,0,0.45)] ring-1 transition-transform",
          "bg-gradient-to-b from-star-soft via-primary to-star-deep",
          active ? "scale-[1.06] ring-2 ring-white" : "ring-star-deep/70",
        )}
      >
        {/* Zone or : note + poste (encre navy) à gauche, photo à droite. */}
        <div className="relative h-[42px] sm:h-[52px]">
          <div className="absolute left-1 top-0.5 z-10 flex flex-col items-center leading-none text-cobalt-deep">
            <span className="font-mono text-[13px] font-extrabold tabular-nums sm:text-[15px]">
              {note != null ? Math.round(note) : "–"}
            </span>
            <span className="mt-px font-mono text-[7px] font-bold tracking-wide sm:text-[8px]">
              {posCode}
            </span>
          </div>
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            srcAlt={player.image_url_alt}
            className="absolute bottom-0 right-0 h-full w-[62%] object-cover object-top [mask-image:linear-gradient(to_left,black_72%,transparent)]"
            initialsClassName="text-[11px] text-cobalt-deep sm:text-[13px]"
          />
        </div>

        {/* Bandeau sombre : nom + écusson club. */}
        <div className="flex flex-col items-center gap-px bg-cobalt-deep/95 px-1 pb-1 pt-0.5">
          <span className="w-full truncate text-center font-serif text-[8px] font-semibold uppercase tracking-[-0.01em] text-bone sm:text-[10px]">
            {lastName(player.name)}
          </span>
          <span className="flex items-center gap-1 opacity-90">
            <ClubBadge
              tmId={player.current_club_id}
              name={player.current_club ?? ""}
              size={11}
              className="rounded-[3px]"
            />
          </span>
        </div>
      </div>

      {isCaptain ? (
        <span className="absolute -right-1 -top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-cobalt-deep">
          <Crown className="h-3 w-3" />
        </span>
      ) : null}
    </motion.button>
  );
}

function EmptySlot({
  code,
  bucket,
  x,
  y,
  onClick,
  reduced,
}: {
  code: string;
  bucket: DBPosition;
  x: number;
  y: number;
  onClick: () => void;
  reduced: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute z-10 w-[52px] -translate-x-1/2 -translate-y-1/2 sm:w-[64px]"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={`Ajouter un ${BUCKET_LABEL[bucket].toLowerCase()}`}
    >
      {/* Silhouette de carte vide — même gabarit que la carte FUT. */}
      <span
        className={cn(
          "flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed border-white/30 bg-background/25 text-white/70 backdrop-blur-sm transition-all group-hover:border-primary group-hover:bg-primary/12 group-hover:text-primary",
          !reduced && "animate-pulse-subtle",
        )}
      >
        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
          {code}
        </span>
      </span>
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
