import { useState } from "react";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { DBPlayer } from "@/types/dbPlayer";

interface PlacedPlayerProps {
  player: DBPlayer;
  isCaptain: boolean;
  onRemove: () => void;
  onToggleCaptain: () => void;
}

/**
 * Joueur placé sur le pitch — cercle avec photo + nom de famille + menu
 * inline (toggle capitaine + retirer) au tap. Halo cobalt si capitaine.
 *
 * Pas de "C" badge ni icône couronne — le halo dit tout (signature DA v2).
 */
export function PlacedPlayer({
  player, isCaptain, onRemove, onToggleCaptain,
}: PlacedPlayerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const familyName = player.name.split(" ").slice(-1)[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="group flex flex-col items-center gap-1 focus:outline-none"
      >
        <div className="relative">
          {/* Halo cobalt capitaine */}
          {isCaptain && (
            <span
              aria-hidden
              className="absolute inset-[-6px] rounded-full bg-primary/35 blur-md"
            />
          )}
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            className={cn(
              "relative h-14 w-14 md:h-16 md:w-16 rounded-full border-2 transition-all",
              isCaptain ? "border-primary" : "border-foreground/15",
              "group-hover:scale-105 group-hover:border-primary/60",
            )}
            initialsClassName="text-base"
          />
        </div>
        <span
          className={cn(
            "max-w-[88px] truncate text-center font-v2-body text-[11px] font-medium",
            isCaptain ? "text-primary" : "text-foreground",
          )}
        >
          {familyName}
        </span>
      </button>

      {/* Menu inline (apparition au tap) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-full z-30 mt-1 flex -translate-x-1/2 gap-1.5 rounded-full border border-border bg-card p-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                onToggleCaptain();
                setMenuOpen(false);
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                isCaptain
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground/70 hover:bg-primary hover:text-primary-foreground",
              )}
              aria-label={isCaptain ? "Retirer capitaine" : "Désigner capitaine"}
              title={isCaptain ? "Retirer capitaine" : "Désigner capitaine"}
            >
              <Star className="h-3.5 w-3.5" fill={isCaptain ? "currentColor" : "none"} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => {
                onRemove();
                setMenuOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground/70 hover:bg-blood hover:text-bone transition-colors"
              aria-label="Retirer du onze"
              title="Retirer du onze"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
}
