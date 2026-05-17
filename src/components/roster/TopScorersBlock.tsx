/**
 * TopScorersBlock — Top 5 buteurs du roster · Saison 2025-26.
 *
 * Source : champ `players.season_goals` (FBRef via sync_fbref_stats).
 * Tri : `season_goals` desc, ties résolus par `season_assists` desc.
 * Si les stats FBRef ne sont pas encore synchronisées (season_goals === 0 pour
 * tous), la section est masquée plutôt que d'afficher des zéros trompeurs.
 *
 * Layout mobile : scroll horizontal avec snap — une card = une unité.
 * Layout desktop : grid 5 colonnes.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";

interface TopScorersBlockProps {
  players: DBPlayer[];
}

// ─── Card individuelle ────────────────────────────────────────────────────────

function ScorerCard({
  player,
  rank,
}: {
  player: DBPlayer;
  rank: number;
}) {
  const goals = player.season_goals ?? 0;
  const assists = player.season_assists ?? 0;
  const games = player.season_games ?? 0;

  return (
    <Link
      to={`/player/${player.slug}`}
      aria-label={`${player.name} — ${goals} buts cette saison`}
      className={cn(
        "group relative flex flex-col gap-3 shrink-0 w-[200px] sm:w-auto",
        "rounded-card border border-border bg-card p-4",
        "transition-colors duration-200 hover:border-border-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {/* Numéro rang — fond */}
      <span
        aria-hidden
        className="absolute top-3 right-3 font-mono text-4xl font-semibold leading-none text-foreground/[0.06] select-none tabular-nums"
      >
        {String(rank).padStart(2, "0")}
      </span>

      {/* Avatar + identité */}
      <div className="flex items-center gap-3 pr-8">
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          srcAlt={player.image_url_alt}
          className="h-10 w-10 rounded-full ring-1 ring-border shrink-0"
          initialsClassName="text-xs"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-sm font-semibold leading-tight text-foreground truncate group-hover:text-primary transition-colors">
            {player.name}
          </h3>
          <p className="text-[10px] text-muted-light truncate mt-0.5">
            {[
              player.position ? POSITION_LABEL[player.position] : null,
              player.current_club,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {/* Chiffre buteur — accent jaune */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <span
            aria-label={`${goals} buts`}
            className="font-mono text-3xl font-bold leading-none text-primary tabular-nums"
          >
            {goals}
          </span>
          <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary/60">
            buts
          </span>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-muted-light leading-tight">
            {assists}
            <span className="text-muted/60"> passes</span>
          </p>
          <p className="font-mono text-[10px] text-muted-light leading-tight">
            {games}
            <span className="text-muted/60"> matchs</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function TopScorersBlock({ players }: TopScorersBlockProps) {
  const top5 = useMemo(() => {
    const sorted = [...players]
      .filter((p) => p.season_goals > 0 || p.season_assists > 0)
      .sort((a, b) => {
        if (b.season_goals !== a.season_goals) return b.season_goals - a.season_goals;
        return (b.season_assists ?? 0) - (a.season_assists ?? 0);
      });
    return sorted.slice(0, 5);
  }, [players]);

  // Pas de stats FBRef disponibles — masquer plutôt qu'afficher des zéros
  if (top5.length === 0) return null;

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section aria-labelledby="top-buteurs-heading" className="mb-10">
      {/* En-tête */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
            Stats · Saison 25-26
          </p>
          <h2
            id="top-buteurs-heading"
            className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground"
          >
            Top buteurs Leopards
          </h2>
        </div>
      </div>

      {/* Grid — scroll horizontal sur mobile, 5 cols sur desktop */}
      <div
        role="list"
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory md:mx-0 md:px-0 md:grid md:grid-cols-5 md:overflow-x-visible md:pb-0"
        style={{ scrollbarWidth: "none" }}
      >
        {top5.map((p, i) => (
          <div key={p.id} role="listitem" className="snap-start">
            <ScorerCard player={p} rank={i + 1} />
          </div>
        ))}
      </div>

      {/* Mention fraicheur */}
      <p className="mt-3 text-[10px] font-mono text-muted" aria-live="polite">
        Source : FBRef · Mise a jour le {today}
      </p>
    </section>
  );
}

export default TopScorersBlock;
