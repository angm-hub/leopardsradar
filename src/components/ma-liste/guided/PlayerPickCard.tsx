import { forwardRef } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ClubBadge } from "@/components/clubs/ClubBadge";
import { noteOf, posCodeFr } from "@/components/ma-liste/v2/squadFormation";
import type { DBPlayer } from "@/types/dbPlayer";

function lastName(name: string) {
  return name.split(" ").slice(-1)[0];
}

/**
 * Carte candidate sélectionnable du flow guidé. Multi-select : cochée = dans
 * l'effectif. Hover composé (élévation + or), état sélectionné net (ring or +
 * check). Photo + nom + club + poste exact FR + note.
 */
export const PlayerPickCard = forwardRef<
  HTMLButtonElement,
  {
    player: DBPlayer;
    picked: boolean;
    onToggle: () => void;
    index: number;
  }
>(function PlayerPickCard({ player, picked, onToggle, index }, ref) {
  const note = noteOf(player);
  return (
    <motion.button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={picked}
      onClick={onToggle}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        layout: { type: "spring", stiffness: 380, damping: 34 },
        default: { duration: 0.3, delay: Math.min(index * 0.02, 0.3), ease: [0.16, 1, 0.3, 1] },
      }}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl p-3 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        picked ? "liquid-glass-gold" : "liquid-glass hover:border-white/20",
      )}
    >
      <div className="relative shrink-0">
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          srcAlt={player.image_url_alt}
          className={cn(
            "h-12 w-12 rounded-full border-2 transition-colors",
            picked ? "border-primary" : "border-border group-hover:border-border-hover",
          )}
          initialsClassName="text-sm"
        />
        {note != null ? (
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-primary/70 bg-background px-1 font-mono text-[10px] font-bold tabular-nums text-primary">
            {Math.round(note)}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-serif text-[15px] font-semibold text-foreground">
            {lastName(player.name)}
          </span>
          <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wide text-cobalt-mist">
            {posCodeFr(player)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-foreground/45">
          <ClubBadge tmId={player.current_club_id} name={player.current_club ?? ""} size={13} className="rounded-[3px]" />
          <span className="truncate">{player.current_club ?? "Sans club"}</span>
        </div>
      </div>

      {/* Case à cocher */}
      <span
        aria-hidden
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
          picked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent group-hover:border-border-hover",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </motion.button>
  );
});

export default PlayerPickCard;
