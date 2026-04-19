import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type Position = "GK" | "DEF" | "MID" | "ATT";

export interface Player {
  slug: string;
  name: string;
  photoUrl: string;
  club: string;
  clubLogoUrl: string;
  position: Position;
  stats: { matches: number; goals: number; assists: number; minutes: number };
  marketValue: string;
  isCaptain?: boolean;
}

const POSITION_DOT: Record<Position, string> = {
  GK: "bg-pos-gk",
  DEF: "bg-pos-def",
  MID: "bg-pos-mid",
  ATT: "bg-pos-att",
};

interface PlayerCardProps {
  player: Player;
  className?: string;
}

export function PlayerCard({ player, className }: PlayerCardProps) {
  const { slug, name, photoUrl, club, clubLogoUrl, position, stats, isCaptain } =
    player;

  return (
    <a
      href={`/player/${slug}`}
      className={cn(
        "group relative block aspect-[3/4] rounded-card overflow-hidden",
        "bg-card border border-border transition-all duration-300",
        "hover:border-border-hover hover:shadow-xl hover:shadow-primary/5",
        className,
      )}
    >
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* Top-left: position + captain */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/40 backdrop-blur-md border border-border/40">
          <span className={cn("h-2 w-2 rounded-full", POSITION_DOT[position])} />
        </span>
        {isCaptain ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/40 backdrop-blur-md border border-border/40">
            <Star className="h-3 w-3 text-primary" fill="currentColor" />
          </span>
        ) : null}
      </div>

      {/* Top-right: stats pill */}
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center rounded-full backdrop-blur-md bg-background/40 border border-border/40 px-2.5 py-1 font-mono text-[11px] text-foreground/85">
          {stats.matches}M · {stats.goals}B · {stats.assists}A
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2">
          <img
            src={clubLogoUrl}
            alt={club}
            loading="lazy"
            className="h-5 w-5 rounded-sm object-cover"
          />
          <span className="text-sm text-foreground/70">{club}</span>
        </div>
        <h3 className="mt-2 font-serif text-xl font-semibold text-foreground tracking-tight">
          {name}
        </h3>
      </div>
    </a>
  );
}

export default PlayerCard;
