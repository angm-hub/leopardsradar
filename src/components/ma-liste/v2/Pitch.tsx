import { useState } from "react";
import { useMaListeV2Store } from "@/store/maListeV2Store";
import { FORMATION_SLOTS, SLOT_COMPATIBILITY } from "@/types/maListe";
import type { Formation, SlotPosition } from "@/types/maListe";
import type { DBPlayer } from "@/types/dbPlayer";
import { PitchLines } from "./PitchLines";
import { EmptySlot } from "./EmptySlot";
import { PlacedPlayer } from "./PlacedPlayer";

interface PitchProps {
  activeSlot: SlotPosition | null;
  onActivateSlot: (slot: SlotPosition | null) => void;
  dragPlayer: DBPlayer | null;
  onDropOnSlot: (slot: SlotPosition) => void;
}

/**
 * Positions des slots sur le pitch en %.
 * GK toujours en bas (90%), attaque en haut (15%).
 */
const PITCH_POSITIONS: Record<
  Formation,
  Partial<Record<SlotPosition, { x: number; y: number }>>
> = {
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

export function Pitch({ activeSlot, onActivateSlot, dragPlayer, onDropOnSlot }: PitchProps) {
  const formation = useMaListeV2Store((s) => s.formation);
  const startingXI = useMaListeV2Store((s) => s.startingXI);
  const captain = useMaListeV2Store((s) => s.captain);
  const removeFromSlot = useMaListeV2Store((s) => s.removePlayerFromSlot);
  const setCaptain = useMaListeV2Store((s) => s.setCaptain);
  const [shakingSlot, setShakingSlot] = useState<SlotPosition | null>(null);

  const slots = FORMATION_SLOTS[formation];
  const positions = PITCH_POSITIONS[formation];

  const slotIsCompat = (slot: SlotPosition): boolean => {
    if (!dragPlayer || !dragPlayer.position) return false;
    return SLOT_COMPATIBILITY[slot].includes(dragPlayer.position);
  };

  return (
    <div
      className="relative aspect-[4/5] md:aspect-[5/7] w-full overflow-hidden bg-[oklch(0.05_0.005_252)] rounded-lg"
      style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)" }}
    >
      <PitchLines />

      {/* Formation label en haut-droite */}
      <span className="absolute right-3 top-3 z-10 font-v2-mono text-[10px] uppercase tracking-[0.15em] text-foreground/60">
        {formation}
      </span>

      {/* Slots */}
      {slots.map((slot) => {
        const pos = positions[slot];
        if (!pos) return null;
        const player = startingXI[slot];
        const isActive = activeSlot === slot;
        const isDragHover = !!dragPlayer && slotIsCompat(slot);
        const isDragIncompat = !!dragPlayer && !slotIsCompat(slot);

        return (
          <div
            key={slot}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onDragOver={(e) => {
              if (isDragHover) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }
            }}
            onDrop={(e) => {
              if (isDragHover) {
                e.preventDefault();
                onDropOnSlot(slot);
              } else if (isDragIncompat) {
                // Feedback shake — l'utilisateur comprend pourquoi le drag échoue
                setShakingSlot(slot);
                setTimeout(() => setShakingSlot(null), 220);
              }
            }}
          >
            {player ? (
              <PlacedPlayer
                player={player}
                isCaptain={captain?.slug === player.slug}
                onRemove={() => removeFromSlot(slot)}
                onToggleCaptain={() => {
                  setCaptain(captain?.slug === player.slug ? null : player);
                }}
              />
            ) : (
              <EmptySlot
                slot={slot}
                active={isActive}
                dragHighlight={isDragHover}
                dragIncompat={isDragIncompat}
                shaking={shakingSlot === slot}
                onClick={() => onActivateSlot(isActive ? null : slot)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
