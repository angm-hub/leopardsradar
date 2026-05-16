import { Star, X, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL, formatMarketValue } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";

interface PlayerRowProps {
  player: DBPlayer;
  index: number;
  isStarter: boolean;
  isCaptain: boolean;
  onToggleStatus: () => void;
  onSetCaptain: () => void;
  onRemove: () => void;
}

/**
 * Row éditorial style "convocation officielle".
 *
 * Layout horizontal dense :
 *   [01]  [photo halo cobalt si cap]  [Nom]    [Club · Poste]  [valeur]  [actions]
 *
 * Pas de card. Pas de border boxed. Juste un divider ligne entre les rows.
 * Hover : background subtle. Capitaine : photo halo cobalt + nom en or.
 */
export function PlayerRow({
  player, index, isStarter, isCaptain, onToggleStatus, onSetCaptain, onRemove,
}: PlayerRowProps) {
  const familyName = player.name.split(" ").slice(-1)[0];
  const firstName = player.name.split(" ").slice(0, -1).join(" ");
  const isRdc = (player.nationalities || []).includes("DR Congo");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex items-center gap-4 py-3 px-3 -mx-3 rounded-lg",
        "border-b border-border/40 last:border-b-0",
        "hover:bg-card/60 transition-colors duration-200",
      )}
    >
      {/* Index */}
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums w-6 shrink-0 transition-colors",
          isCaptain ? "text-primary font-semibold" : "text-foreground/35",
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Photo */}
      <div className="relative shrink-0">
        {isCaptain && (
          <span aria-hidden className="absolute inset-[-3px] rounded-full bg-primary/35 blur-md" />
        )}
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          className={cn(
            "relative h-11 w-11 rounded-full border-2 transition-all",
            isCaptain ? "border-primary" : "border-foreground/10 group-hover:border-foreground/25",
          )}
          initialsClassName="text-xs"
        />
        {isRdc && !isCaptain && (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
            title="DR Congo déclaré"
          />
        )}
      </div>

      {/* Nom + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[14px] text-foreground/55 truncate">
            {firstName}
          </span>
          <span
            className={cn(
              "font-sans text-[16px] font-semibold tracking-tight truncate transition-colors",
              isCaptain ? "text-primary" : "text-foreground",
            )}
          >
            {familyName}
          </span>
          {isCaptain && (
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary/80 font-bold">
              Capitaine
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/45">
          <span className="truncate max-w-[180px]">
            {player.current_club ?? "Sans club"}
          </span>
          <span className="text-foreground/20">·</span>
          <span>{player.position ? POSITION_LABEL[player.position] : "—"}</span>
          {(player.caps_rdc ?? 0) > 0 && (
            <>
              <span className="text-foreground/20">·</span>
              <span className="text-foreground/65">{player.caps_rdc} sélections</span>
            </>
          )}
        </div>
      </div>

      {/* Valeur (cachée mobile) */}
      {player.market_value_eur ? (
        <span className="hidden md:inline font-mono text-[11px] tabular-nums text-foreground/55 shrink-0">
          {formatMarketValue(player.market_value_eur)}
        </span>
      ) : null}

      {/* Actions — visible au hover desktop, toujours visibles mobile */}
      <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onSetCaptain}
          title={isCaptain ? "Retirer capitaine" : "Désigner capitaine"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-all",
            isCaptain
              ? "bg-primary text-primary-foreground"
              : "text-foreground/45 hover:bg-card hover:text-primary",
          )}
        >
          <Star className="h-3.5 w-3.5" fill={isCaptain ? "currentColor" : "none"} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onToggleStatus}
          title={isStarter ? "Envoyer au banc" : "Mettre titulaire"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/45 hover:bg-card hover:text-foreground transition-all"
        >
          <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Retirer de la liste"
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/45 hover:bg-blood/15 hover:text-blood transition-all"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}
