import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { DBPlayer } from "@/types/dbPlayer";
import {
  POSITION_BADGE,
  POSITION_DOT,
  POSITION_LABEL,
  flagFor,
} from "@/lib/playerHelpers";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

interface PlayerCardProps {
  player: DBPlayer;
  className?: string;
}

export function PlayerCard({ player, className }: PlayerCardProps) {
  const { slug, name, image_url, current_club, position, age, nationalities } = player;

  return (
    <Link
      to={`/player/${slug}`}
      className={cn(
        "group relative block aspect-[3/4] rounded-card overflow-hidden",
        "bg-card border border-border transition-all duration-300",
        "hover:border-border-hover hover:shadow-xl hover:shadow-primary/5",
        className,
      )}
    >
      <PlayerAvatar
        name={name}
        src={image_url}
        className="absolute inset-0 h-full w-full"
        initialsClassName="text-6xl"
      />

      {/* Bottom legibility overlay — protects name/club from busy photo backgrounds */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Top-left: position badge */}
      {position ? (
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md",
              POSITION_BADGE[position],
            )}
          >
            <span
              aria-hidden
              className={cn("inline-block h-1.5 w-1.5 rounded-full", POSITION_DOT[position])}
            />
            {POSITION_LABEL[position]}
          </span>
        </div>
      ) : null}

      {/* Top-right: nationality flags (max 3) */}
      {nationalities.length > 0 ? (
        <div className="absolute top-3 right-3 flex items-center gap-0.5 rounded-full bg-background/40 backdrop-blur-md border border-border/40 px-2 py-1">
          {nationalities.slice(0, 3).map((nat) => (
            <span key={nat} className="text-sm leading-none" title={nat}>
              {flagFor(nat)}
            </span>
          ))}
        </div>
      ) : null}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {current_club ? (
          <p className="text-sm text-foreground/70 truncate">{current_club}</p>
        ) : null}
        <h3 className="mt-1 font-serif text-xl font-semibold text-foreground tracking-tight truncate">
          {name}
        </h3>
        {age ? (
          <p className="mt-1 font-mono text-xs text-muted">{age} ans</p>
        ) : null}
      </div>
    </Link>
  );
}

export default PlayerCard;
