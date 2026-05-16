import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useMaListeV2Store } from "@/store/maListeV2Store";
import type { DBPlayer } from "@/types/dbPlayer";

interface BenchStripProps {
  dragPlayer: DBPlayer | null;
  onDropOnBench: () => void;
}

const SLOTS_COUNT = 15;

export function BenchStrip({ dragPlayer, onDropOnBench }: BenchStripProps) {
  const bench = useMaListeV2Store((s) => s.bench);
  const captain = useMaListeV2Store((s) => s.captain);
  const removeFromBench = useMaListeV2Store((s) => s.removeFromBench);
  const setCaptain = useMaListeV2Store((s) => s.setCaptain);

  const slots = Array.from({ length: SLOTS_COUNT }, (_, i) => bench[i] ?? null);
  const benchFull = bench.length >= SLOTS_COUNT;
  const canDrop = !!dragPlayer && !benchFull;

  return (
    <section
      className={cn(
        "rounded-lg border bg-card/50 transition-colors p-3",
        canDrop
          ? "border-primary/60 bg-primary/5"
          : "border-border",
      )}
      onDragOver={(e) => {
        if (canDrop) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(e) => {
        if (canDrop) {
          e.preventDefault();
          onDropOnBench();
        }
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-v2-mono text-[10px] uppercase tracking-[0.1em] text-foreground/55">
          Banc · {bench.length}/{SLOTS_COUNT}
        </span>
        {benchFull && (
          <span className="font-v2-mono text-[9px] uppercase tracking-[0.06em] text-primary">
            complet
          </span>
        )}
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-15 gap-1.5">
        {slots.map((p, i) => (
          <BenchSlot
            key={p?.slug ?? `empty-${i}`}
            player={p}
            isCaptain={!!p && captain?.slug === p.slug}
            onRemove={() => p && removeFromBench(p.slug)}
            onToggleCaptain={() =>
              p && setCaptain(captain?.slug === p.slug ? null : p)
            }
          />
        ))}
      </div>
    </section>
  );
}

interface BenchSlotProps {
  player: DBPlayer | null;
  isCaptain: boolean;
  onRemove: () => void;
  onToggleCaptain: () => void;
}

function BenchSlot({ player, isCaptain, onRemove, onToggleCaptain }: BenchSlotProps) {
  if (!player) {
    return (
      <div
        aria-hidden
        className="aspect-square rounded-full border border-dashed border-foreground/15"
      />
    );
  }
  const familyName = player.name.split(" ").slice(-1)[0];
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onToggleCaptain}
        className={cn(
          "relative block w-full aspect-square rounded-full overflow-hidden",
          "border-2 transition-all",
          isCaptain ? "border-primary" : "border-foreground/15 hover:border-primary/60",
        )}
        title={`${player.name} — ${isCaptain ? "Retirer capitaine" : "Désigner capitaine"}`}
      >
        {isCaptain && (
          <span aria-hidden className="absolute inset-[-3px] rounded-full bg-primary/35 blur-sm" />
        )}
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          className="relative h-full w-full rounded-full"
          initialsClassName="text-[9px]"
        />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blood text-bone opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Retirer ${player.name} du banc`}
      >
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </button>
      <AnimatePresence>
        {isCaptain && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden
          >
            <Star className="h-2 w-2" fill="currentColor" strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
