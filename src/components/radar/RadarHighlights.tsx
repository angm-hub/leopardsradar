/**
 * RadarHighlights — "Top 5 valeurs du Radar"
 *
 * Section data-driven placée avant le canvas radar pour donner un ancrage
 * humain aux 988 nodes : les 5 joueurs du Radar avec la plus forte valeur
 * marchande, lus en direct depuis Supabase.
 *
 * Refonte 14 mai 2026 : la version précédente affichait 5 noms inventés
 * (Mokio, Mayulu, Bitshiabu, Mavissa, Engwanda) avec des notes éditoriales
 * fictives. Mensonger : retiré. Cette version est 100% data-driven.
 *
 * Quand une vraie sélection éditoriale "pépites de la semaine" sera en BDD
 * (table radar_highlights ou champ is_featured), ce composant lira cette
 * source à la place du tri par valeur. En attendant, le tri valeur est une
 * proxy honnête : "voici les 5 plus grosses valeurs du Radar à instruire".
 */

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { usePlayers } from "@/hooks/usePlayers";
import { POSITION_LABEL, formatMarketValue } from "@/lib/playerHelpers";
import type { DBPosition } from "@/types/dbPlayer";

// ─── Card individuelle ────────────────────────────────────────────────────────

interface RadarTopCardProps {
  rank: number;
  slug: string;
  name: string;
  position: DBPosition | null;
  age: number | null;
  club: string | null;
  marketValue: number | null;
  imageUrl: string | null | undefined;
  imageUrlAlt: string | null | undefined;
}

function RadarTopCard({
  rank,
  slug,
  name,
  position,
  age,
  club,
  marketValue,
  imageUrl,
  imageUrlAlt,
}: RadarTopCardProps) {
  const rankStr = String(rank).padStart(2, "0");
  const positionLabel = position ? POSITION_LABEL[position] : null;

  return (
    <Link
      to={`/player/${slug}`}
      className={cn(
        "group relative overflow-hidden rounded-card border border-border bg-card",
        "p-5 flex flex-col gap-3",
        "transition-colors duration-200 hover:border-border-hover",
      )}
    >
      {/* Numéro d'ordre — décor de fond */}
      <span
        aria-hidden
        className="absolute top-3 right-3 font-serif text-5xl font-semibold leading-none text-foreground/[0.07] select-none"
      >
        {rankStr}
      </span>

      {/* Photo + identité */}
      <div className="flex items-center gap-3 pr-8">
        <PlayerAvatar
          name={name}
          src={imageUrl}
          srcAlt={imageUrlAlt}
          className="h-12 w-12 rounded-full ring-1 ring-border shrink-0"
          initialsClassName="text-sm"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base font-semibold leading-tight text-foreground truncate group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-[11px] text-muted-light truncate">
            {[positionLabel, age ? `${age} ans` : null, club].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Footer : valeur marchande */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Valeur
        </span>
        <span className="font-mono text-sm font-semibold text-foreground">
          {marketValue ? formatMarketValue(marketValue) : "—"}
        </span>
      </div>
    </Link>
  );
}

// ─── Section principale ───────────────────────────────────────────────────────

export function RadarHighlights() {
  const { players, loading } = usePlayers({
    category: "radar",
    excludeEligibilityStatus: "ineligible",
    orderBy: { column: "market_value_eur", ascending: false },
    limit: 5,
  });

  // Si pas de data ou loading court → on ne montre rien plutôt qu'un placeholder
  // bidon. L'absence vaut mieux que le mensonge.
  if (loading) {
    return (
      <section className="container-site pb-10 pt-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-card border border-border bg-gradient-to-r from-card via-card-hover to-card animate-shimmer"
              style={{ backgroundSize: "200% 100%" }}
              aria-hidden
            />
          ))}
        </div>
      </section>
    );
  }

  if (players.length === 0) return null;

  return (
    <section
      aria-labelledby="highlights-heading"
      className="container-site pb-10 pt-2"
    >
      {/* En-tête éditorial — copy ajusté à la réalité : tri par valeur, pas
          curation à la main (qui n'existe pas encore). */}
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-success/85">
          Radar · Top 5 valeurs
        </p>
        <h2
          id="highlights-heading"
          className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Les 5 plus belles valeurs du vivier.
        </h2>
        <p className="mt-1.5 text-sm text-muted-light">
          Joueurs éligibles RDC ou diaspora avec la valeur marchande la plus élevée.
          Mis à jour automatiquement à chaque sync Transfermarkt.
        </p>
      </div>

      {/* Grille de 5 cards data-driven */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {players.map((p, i) => (
          <RadarTopCard
            key={p.id}
            rank={i + 1}
            slug={p.slug}
            name={p.name}
            position={p.position as DBPosition | null}
            age={p.age}
            club={p.current_club}
            marketValue={p.market_value_eur}
            imageUrl={p.image_url}
            imageUrlAlt={p.image_url_alt}
          />
        ))}
      </div>
    </section>
  );
}

export default RadarHighlights;
