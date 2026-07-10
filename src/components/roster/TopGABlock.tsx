/**
 * TopGABlock — Top 5 G+A (buts + passes) du roster · Saison 2025-26.
 *
 * Source : `players.season_goals` + `players.season_assists`.
 * Tri : (season_goals + season_assists) desc, ties résolus par goals desc.
 * Overlap avec TopScorersBlock acceptable — un joueur peut apparaître dans les deux.
 * Masqué si aucun joueur n'a de stats.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";
import { RevealOnScroll, RevealOnScrollItem } from "@/components/motion";

interface TopGABlockProps {
  players: DBPlayer[];
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function GACard({ player, rank }: { player: DBPlayer; rank: number }) {
  const goals = player.season_goals ?? 0;
  const assists = player.season_assists ?? 0;
  const ga = goals + assists;

  return (
    <Link
      to={`/player/${player.slug}`}
      aria-label={`${player.name} · ${ga} participations aux buts cette saison`}
      className={cn(
        "group relative flex flex-col gap-3 shrink-0 w-[200px] sm:w-auto",
        "rounded-card border border-border bg-card p-4",
        "transition-colors duration-200 hover:border-border-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {/* Rang de fond */}
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

      {/* Chiffre G+A */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <span
            aria-label={`${ga} participations`}
            className="font-mono text-3xl font-bold leading-none text-success tabular-nums"
          >
            {ga}
          </span>
          <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success/60">
            G+A
          </span>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-muted-light leading-tight">
            {goals}
            <span className="text-muted/60"> buts</span>
          </p>
          <p className="font-mono text-[10px] text-muted-light leading-tight">
            {assists}
            <span className="text-muted/60"> passes</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function TopGABlock({ players }: TopGABlockProps) {
  const top5 = useMemo(() => {
    const sorted = [...players]
      .filter((p) => (p.season_goals ?? 0) + (p.season_assists ?? 0) > 0)
      .sort((a, b) => {
        const gaA = (a.season_goals ?? 0) + (a.season_assists ?? 0);
        const gaB = (b.season_goals ?? 0) + (b.season_assists ?? 0);
        if (gaB !== gaA) return gaB - gaA;
        return (b.season_goals ?? 0) - (a.season_goals ?? 0);
      });
    return sorted.slice(0, 5);
  }, [players]);

  if (top5.length === 0) return null;

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section aria-labelledby="top-ga-heading" className="mb-10">
      {/* En-tête */}
      <RevealOnScroll className="mb-5" y={20}>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-success/80">
          Stats · Saison 25-26
        </p>
        <h2
          id="top-ga-heading"
          className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground"
        >
          Top G+A combinés
        </h2>
        <p className="mt-1 text-xs text-muted-light">
          Buts + passes décisives. Joueurs de nationalité RDC en activité.
        </p>
      </RevealOnScroll>

      {/* Grid — scroll horizontal mobile, 5 cols desktop */}
      <RevealOnScroll
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory md:mx-0 md:px-0 md:grid md:grid-cols-5 md:overflow-x-visible md:pb-0"
        staggerChildren={0.09}
        y={24}
      >
        {top5.map((p, i) => (
          <RevealOnScrollItem key={p.id} className="snap-start">
            <GACard player={p} rank={i + 1} />
          </RevealOnScrollItem>
        ))}
      </RevealOnScroll>

      <p className="mt-3 text-[10px] font-mono text-muted">
        Source : FBRef · Mise à jour le {today}
      </p>
    </section>
  );
}

export default TopGABlock;
