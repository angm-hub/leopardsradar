import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlotPosition } from "@/types/maListe";

interface EmptySlotProps {
  slot: SlotPosition;
  active: boolean;
  dragHighlight: boolean;
  dragIncompat: boolean;
  shaking: boolean;
  onClick: () => void;
}

const SLOT_SHORT_LABEL: Record<string, string> = {
  GK: "GK", LB: "LB", LCB: "CB", RCB: "CB", RB: "RB", CB: "CB",
  LWB: "LWB", RWB: "RWB",
  LCM: "CM", RCM: "CM", CM: "CM", CAM: "CAM", CDM: "CDM",
  LM: "LM", RM: "RM",
  LW: "LW", RW: "RW", LST: "ST", RST: "ST", ST: "ST", CF: "CF",
};

export function EmptySlot({
  slot, active, dragHighlight, dragIncompat, shaking, onClick,
}: EmptySlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-shake={shaking}
      className={cn(
        "group flex flex-col items-center gap-1.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-full",
        "data-[shake=true]:animate-[shake_200ms_cubic-bezier(.36,.07,.19,.97)]",
      )}
    >
      <div
        className={cn(
          "relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full",
          "border-2 border-dashed transition-all duration-150",
          active && "border-primary bg-primary/8 scale-105",
          !active && "border-foreground/25 group-hover:border-primary group-hover:bg-primary/10 group-hover:scale-105",
          dragHighlight && "border-primary border-solid bg-primary/15 scale-110 shadow-[0_0_24px_rgba(245,197,24,0.35)]",
          dragIncompat && "border-blood border-solid bg-blood/10 opacity-70",
        )}
      >
        <Plus
          className={cn(
            "h-4 w-4 transition-opacity",
            active ? "text-primary" : "text-foreground/40 group-hover:text-primary",
          )}
          strokeWidth={2.5}
        />
      </div>
      <span
        className={cn(
          "font-v2-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
          active ? "text-primary" : "text-foreground/55",
        )}
      >
        {SLOT_SHORT_LABEL[slot] ?? slot}
      </span>
    </button>
  );
}
