import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useRelatedPlayers } from "@/hooks/useRelatedPlayers";
import {
  POSITION_LABEL,
  flagFor,
  formatMarketValue,
} from "@/lib/playerHelpers";
import type { DBPosition } from "@/types/dbPlayer";

interface RelatedPlayersProps {
  position: DBPosition | null;
  positionLabelOverride?: string;
  excludeSlug: string | undefined;
}

/**
 * RelatedPlayers — bloc "Plus de Léopards" en bas de fiche joueur.
 *
 * Évite le cul-de-sac : propose 3-4 joueurs du même poste. Chaque card
 * mène vers la fiche correspondante. Footer link vers le Roster complet.
 */
export function RelatedPlayers({
  position,
  positionLabelOverride,
  excludeSlug,
}: RelatedPlayersProps) {
  const { players, loading } = useRelatedPlayers({
    position,
    excludeSlug,
    limit: 4,
  });

  if (!position) return null;
  if (!loading && players.length === 0) return null;

  const label = positionLabelOverride ?? POSITION_LABEL[position] ?? position;

  return (
    <section className="container-site py-16 border-t border-border">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h2 className="font-serif text-3xl text-foreground">
          Plus de Léopards.
        </h2>
        <p className="text-sm text-muted-light font-mono">
          Autres {label.toLowerCase()}s suivis
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-card border border-border bg-card animate-pulse"
              />
            ))
          : players.map((p) => {
              const flag = p.other_nationalities[0] ?? p.nationalities[0];
              return (
                <Link
                  key={p.slug}
                  to={`/player/${p.slug}`}
                  className="group block rounded-card border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="relative aspect-[3/4]">
                    <PlayerAvatar
                      name={p.name}
                      src={p.image_url}
                      className="absolute inset-0 h-full w-full"
                      initialsClassName="text-5xl"
                    />
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
                    {flag ? (
                      <span className="absolute top-2 right-2 text-base leading-none">
                        {flagFor(flag)}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="font-serif text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-muted truncate">
                        {p.current_club ?? "—"}
                      </span>
                      {p.market_value_eur && p.market_value_eur > 0 ? (
                        <span className="text-primary/85 shrink-0 ml-2">
                          {formatMarketValue(p.market_value_eur)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/roster"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-mono"
        >
          Voir tout le Roster <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
