import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlayerRow } from "./PlayerRow";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

interface PositionSectionProps {
  label: string;
  shortLabel: string;
  position: DBPosition;
  quota: { min: number; ideal: number; max: number };
  players: DBPlayer[];
  isStarter: (slug: string) => boolean;
  captain: DBPlayer | null;
  emptyHint: string;
  onToggleStatus: (slug: string) => void;
  onSetCaptain: (player: DBPlayer | null) => void;
  onRemove: (slug: string) => void;
}

/**
 * Section éditoriale par poste — style convocation officielle.
 *
 * Header : label en uppercase tracking large + count vs quota indicatif
 * (vert si dans la cible, doré si idéal atteint, rouge si trop).
 *
 * Body : rows joueurs avec badge T/R inline + actions.
 */
export function PositionSection({
  label, shortLabel, players, quota, isStarter, captain,
  emptyHint, onToggleStatus, onSetCaptain, onRemove,
}: PositionSectionProps) {
  const count = players.length;
  const status =
    count === 0
      ? "empty"
      : count < quota.min
        ? "under"
        : count > quota.max
          ? "over"
          : count === quota.ideal
            ? "ideal"
            : "ok";

  const statusColor = {
    empty: "text-foreground/35",
    under: "text-foreground/55",
    ok: "text-foreground/75",
    ideal: "text-primary font-bold",
    over: "text-blood font-semibold",
  }[status];

  const headingId = `position-${shortLabel.toLowerCase()}`;

  return (
    <section className="space-y-1" aria-labelledby={headingId}>
      <header className="flex items-baseline justify-between gap-4 mb-3">
        <div className="flex items-baseline gap-3">
          <span
            aria-hidden
            className={cn(
              "font-mono text-[10px] tracking-[0.16em] uppercase w-8 shrink-0 font-bold",
              status === "ideal" || status === "ok"
                ? "text-primary"
                : "text-foreground/35",
            )}
          >
            {shortLabel}
          </span>
          <h2
            id={headingId}
            className="font-display text-[15px] tracking-[0.16em] uppercase font-bold text-foreground"
          >
            {label}
          </h2>
          <span className={cn("font-mono text-[11px] tabular-nums transition-colors", statusColor)}>
            {count}{" "}
            <span className="text-foreground/30">/ idéal {quota.ideal}</span>
          </span>
        </div>
      </header>

      {players.length === 0 ? (
        <div className="flex items-center gap-3 py-5 px-3 -mx-3 rounded-lg border border-dashed border-foreground/15">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/40 shrink-0">
            Vide
          </span>
          <span className="font-sans text-[13px] text-foreground/55">
            {emptyHint}
          </span>
        </div>
      ) : (
        <div className="space-y-0">
          <AnimatePresence initial={false} mode="popLayout">
            {players.map((p, i) => (
              <PlayerRow
                key={p.slug}
                player={p}
                index={i}
                isStarter={isStarter(p.slug)}
                isCaptain={captain?.slug === p.slug}
                onToggleStatus={() => onToggleStatus(p.slug)}
                onSetCaptain={() => onSetCaptain(captain?.slug === p.slug ? null : p)}
                onRemove={() => onRemove(p.slug)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
