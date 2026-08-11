import { Link } from "react-router-dom";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { flagFor, formatMarketValue } from "@/lib/playerHelpers";
import type { BestXIPlayer } from "@/hooks/useBestXI";

interface XIRosterCardProps {
  player: BestXIPlayer;
  /** numéro d'ordre du onze (1-11), rendu en filigrane. */
  number: string;
  /** code de position tactique court (RB, RCB, ST, GK…). */
  tacticalPosition: string;
  /** libellé de rôle complet et lisible (« Défenseur central »…). */
  roleName?: string;
}

/**
 * XIRosterCard — fiche enrichie d'un joueur du onze.
 *
 * Lecture : photo, code + rôle tactique lisible, nom, club, âge + valeur +
 * drapeau diaspora. Le filigrane porte le numéro d'ordre (1-11) — avant, il
 * recevait le nom de rôle complet rendu en 48px, qui débordait la carte et
 * bleedait sur les voisines (bug lisibilité corrigé le 11/08/2026).
 */
export function XIRosterCard({
  player,
  number,
  tacticalPosition,
  roleName,
}: XIRosterCardProps) {
  const primaryFlag =
    player.other_nationalities?.[0] ??
    player.nationalities?.find((n) => n !== "DR Congo");

  return (
    <Link
      to={`/player/${player.slug}`}
      className="group relative flex items-stretch gap-3 overflow-hidden rounded-card border border-border bg-card p-3 transition-all hover:border-primary/50 hover:bg-card-hover hover:shadow-lg hover:shadow-primary/5"
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
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[10px] text-primary uppercase tracking-wider shrink-0">
            {tacticalPosition}
          </span>
          {roleName ? (
            <span className="text-[10px] text-muted truncate">· {roleName}</span>
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
            {player.age ? `${player.age} ans` : "n.d."}
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
