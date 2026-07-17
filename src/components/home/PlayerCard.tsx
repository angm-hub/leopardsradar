import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { DBPlayer } from "@/types/dbPlayer";
import {
  POSITION_BADGE,
  POSITION_DOT,
  POSITION_LABEL,
  flagFor,
  formatMarketValue,
  nationalityFr,
} from "@/lib/playerHelpers";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { LevelBandBadge } from "@/components/player/LevelBandBadge";

interface PlayerCardProps {
  player: DBPlayer;
  className?: string;
}

export function PlayerCard({ player, className }: PlayerCardProps) {
  const {
    slug,
    name,
    image_url,
    current_club,
    position,
    age,
    nationalities,
    caps_rdc: capsRdc,
    market_value_eur: marketValue,
    level_band: levelBand,
    level_score: levelScore,
  } = player;

  // Build the bottom stats line. Filter empties so we never render dangling
  // separators when the dataset is partial (radar profiles often have no caps).
  const statBits: string[] = [];
  if (age) statBits.push(`${age} ans`);
  if (typeof capsRdc === "number" && capsRdc > 0) {
    statBits.push(`${capsRdc} cap${capsRdc > 1 ? "s" : ""}`);
  }
  if (marketValue && marketValue > 0) {
    statBits.push(formatMarketValue(marketValue));
  }

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

      {/* Rangée haute : une seule flex row (badges à gauche, drapeaux à droite).
          Deux coins absolus se chevauchaient sur les cartes étroites (badge
          « HIGH » tronqué sous les 3 drapeaux, constat audit 17/07) : ici les
          badges wrappent sous la première ligne au lieu d'entrer en collision. */}
      <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {position ? (
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
          ) : null}
          {/* LevelBandBadge — null si pas encore calculé, pas de rendu vide */}
          <LevelBandBadge
            band={levelBand}
            score={levelScore}
            size="sm"
            showScore={false}
          />
        </div>
        {nationalities.length > 0 ? (
          <div className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-background/40 backdrop-blur-md border border-border/40 px-2 py-1">
            {nationalities.slice(0, 3).map((nat) => (
              <span key={nat} className="text-sm leading-none" title={nationalityFr(nat)}>
                {flagFor(nat)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {current_club ? (
          <p className="text-sm text-foreground/70 truncate">{current_club}</p>
        ) : null}
        <h3 className="mt-1 font-serif text-xl font-semibold text-foreground tracking-tight leading-tight line-clamp-2">
          {name}
        </h3>
        {statBits.length > 0 ? (
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-light truncate">
            {statBits.join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default PlayerCard;
