import { Link } from "react-router-dom";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL, flagFor, formatMarketValue } from "@/lib/playerHelpers";
import type { BestXIPlayer } from "@/hooks/useBestXI";
import type { DBPosition } from "@/types/dbPlayer";

interface XIRosterCardProps {
  player: BestXIPlayer;
  /** numéro de slot (1-11) */
  number: string;
  /** position tactique précise (RB, RCB, ST, etc.) */
  tacticalPosition: string;
}

/**
 * XIRosterCard — fiche enrichie d'un joueur du onze.
 *
 * Lecture en 5 dimensions : photo, nom, position tactique, club + poste,
 * âge + valeur + drapeau diaspora. Remplace l'ancienne card pauvre
 * (photo + nom + club seulement).
 */
export function XIRosterCard({
  player,
  number,
  tacticalPosition,
}: XIRosterCardProps) {
  const primaryFlag =
    player.other_nationalities?.[0] ??
    player.nationalities?.find((n) => n !== "DR Congo");

  return (
    <Link
      to={`/player/${player.slug}`}
      className="group relative flex items-stretch gap-3 rounded-card border border-border bg-card p-3 transition-all hover:border-primary/50 hover:bg-card-hover hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Numéro de maillot en filigrane */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-2 right-2 font-serif text-5xl text-foreground/5 leading-none select-none"
      >
        {number}
      </span>

      <PlayerAvatar
        name={player.name}
        src={player.image_url}
        className="h-14 w-14 rounded-full shrink-0 ring-1 ring-border"
        initialsClassName="text-base"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-primary uppercase tracking-wider">
            {tacticalPosition}
          </span>
          {player.position ? (
            <span className="text-[10px] text-muted">
              · {POSITION_LABEL[player.position as DBPosition] ?? player.position}
            </span>
          ) : null}
        </div>
        <p className="font-serif text-base text-foreground truncate group-hover:text-primary transition-colors">
          {player.name}
        </p>
        <p className="text-xs text-muted truncate">
          {player.current_club ?? "Sans club"}
        </p>

        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-muted-light">
            {primaryFlag ? (
              <span className="leading-none">{flagFor(primaryFlag)}</span>
            ) : null}
            {player.age ? `${player.age} ans` : "—"}
          </span>
          {player.market_value_eur && player.market_value_eur > 0 ? (
            <span className="text-primary/90 font-semibold">
              {formatMarketValue(player.market_value_eur)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
