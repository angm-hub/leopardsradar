import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  POSITION_BADGE,
  POSITION_DOT,
  POSITION_LABEL,
  flagFor,
  formatMarketValue,
} from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";

interface RosterHeroProps {
  players: DBPlayer[];
}

/**
 * RosterHero — top 3 du roster en featured cards larges.
 *
 * Donne un point d'entrée visuel fort à la page Roster, façon HBO Max
 * hero rail. Aspect 4:5 plus généreux que les cards standard 3:4, avec
 * meta enrichie (valeur, caps RDC, drapeaux).
 */
export function RosterHero({ players }: RosterHeroProps) {
  if (players.length === 0) return null;
  const top = players.slice(0, 3);

  return (
    <section aria-label="Top 3 du roster">
      <div className="flex items-baseline gap-3 mb-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
          Top 3
        </p>
        <span className="text-[10px] text-muted-light font-mono">·</span>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted font-mono">
          Les leaders du roster (par valeur)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {top.map((p, idx) => (
          <HeroCard key={p.slug} player={p} rank={idx + 1} />
        ))}
      </div>
    </section>
  );
}

function HeroCard({ player, rank }: { player: DBPlayer; rank: number }) {
  return (
    <Link
      to={`/player/${player.slug}`}
      className={cn(
        "group relative block aspect-[4/5] rounded-card overflow-hidden",
        "surface-1 transition-[box-shadow,filter] duration-300",
        "hover:[filter:brightness(1.05)] hover:[box-shadow:0_0_0_0.5px_rgba(252,209,22,0.4),0_1px_2px_rgba(0,0,0,0.4),0_18px_44px_rgba(252,209,22,0.14)]",
      )}
    >
      <PlayerAvatar
        name={player.name}
        src={player.image_url}
        srcAlt={player.image_url_alt}
        className="absolute inset-0 h-full w-full"
        initialsClassName="text-7xl"
      />

      {/* Voiles de lisibilité */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-background via-background/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Numéro de rang en filigrane énorme */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 right-3 font-serif text-7xl text-primary/15 leading-none select-none"
      >
        {rank}
      </span>

      {/* Top-left : position badge */}
      {player.position ? (
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md",
              POSITION_BADGE[player.position],
            )}
          >
            <span
              aria-hidden
              className={cn("inline-block h-1.5 w-1.5 rounded-full", POSITION_DOT[player.position])}
            />
            {POSITION_LABEL[player.position]}
          </span>
        </div>
      ) : null}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-1.5 mb-2">
          {player.nationalities.slice(0, 3).map((nat) => (
            <span key={nat} className="text-base leading-none" title={nat}>
              {flagFor(nat)}
            </span>
          ))}
          {player.caps_rdc > 0 ? (
            <span className="ml-1 text-[10px] font-mono text-primary/85">
              {player.caps_rdc} caps
            </span>
          ) : null}
        </div>

        {player.current_club ? (
          <p className="text-xs text-foreground/70 truncate">
            {player.current_club}
          </p>
        ) : null}
        <h3 className="mt-1 font-serif text-2xl text-foreground tracking-tight truncate">
          {player.name}
        </h3>

        <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
          <span className="text-muted-light">
            {player.age ? `${player.age} ans` : "—"}
          </span>
          {player.market_value_eur && player.market_value_eur > 0 ? (
            <span className="text-primary font-semibold">
              {formatMarketValue(player.market_value_eur)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
