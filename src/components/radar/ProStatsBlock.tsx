/**
 * ProStatsBlock — "Pepites stats · Saison 25-26"
 *
 * 3 mini-cards horizontales placees entre RadarHighlights et le canvas :
 *   1. G+A : top 1 radar par (season_goals + season_assists)
 *   2. Buts : top 1 radar par season_goals
 *   3. Minutes/Matchs : top 1 radar par season_minutes (si disponible)
 *      Fallback sur season_games si season_minutes === 0 pour tous.
 *
 * Masque les cards si aucune donnee n'est disponible (FBRef pas encore synce).
 * Affiche un disclaimer clair si season_minutes est a 0 pour tous.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";

interface ProStatsBlockProps {
  players: DBPlayer[];
}

// ─── Mini-card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  player: DBPlayer;
  accentClass?: string;
}

function StatCard({ label, value, unit, player, accentClass = "text-primary" }: StatCardProps) {
  const posLabel = player.position ? POSITION_LABEL[player.position] : null;

  return (
    <Link
      to={`/player/${player.slug}`}
      aria-label={`${label} : ${player.name} — ${value} ${unit}`}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-card border border-border bg-card",
        "transition-colors duration-200 hover:border-border-hover flex-1 min-w-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {/* Stat en grand — a gauche */}
      <div className="shrink-0 text-right min-w-[48px]">
        <span
          className={cn(
            "font-mono text-3xl font-bold leading-none tabular-nums",
            accentClass,
          )}
        >
          {value}
        </span>
        <p className={cn("font-mono text-[9px] uppercase tracking-[0.18em] mt-0.5 opacity-60", accentClass)}>
          {unit}
        </p>
      </div>

      {/* Separateur */}
      <div className="h-10 w-px bg-border shrink-0" aria-hidden />

      {/* Joueur */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          srcAlt={player.image_url_alt}
          className="h-9 w-9 rounded-full ring-1 ring-border shrink-0"
          initialsClassName="text-[10px]"
        />
        <div className="min-w-0">
          <p className="font-serif text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
            {player.name}
          </p>
          <p className="font-mono text-[10px] text-muted-light truncate">
            {[posLabel, player.current_club].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Label categorie — coin haut droit */}
      <p className="hidden md:block shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-muted self-start">
        {label}
      </p>
    </Link>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ProStatsBlock({ players }: ProStatsBlockProps) {
  // Filtrer les joueurs radar/heritage avec au moins une stat
  const radarPlayers = useMemo(
    () =>
      players.filter(
        (p) =>
          (p.player_category === "radar" || p.player_category === "heritage") &&
          p.eligibility_status !== "ineligible",
      ),
    [players],
  );

  const hasAnyGoals = radarPlayers.some((p) => (p.season_goals ?? 0) > 0);
  const hasAnyMinutes = radarPlayers.some((p) => (p.season_minutes ?? 0) > 0);
  const hasAnyGames = radarPlayers.some((p) => (p.season_games ?? 0) > 0);

  // Top G+A
  const topGA = useMemo(() => {
    if (!hasAnyGoals) return null;
    return [...radarPlayers]
      .filter((p) => (p.season_goals ?? 0) + (p.season_assists ?? 0) > 0)
      .sort((a, b) => {
        const gaA = (a.season_goals ?? 0) + (a.season_assists ?? 0);
        const gaB = (b.season_goals ?? 0) + (b.season_assists ?? 0);
        return gaB - gaA;
      })[0] ?? null;
  }, [radarPlayers, hasAnyGoals]);

  // Top buts
  const topGoals = useMemo(() => {
    if (!hasAnyGoals) return null;
    return [...radarPlayers]
      .filter((p) => (p.season_goals ?? 0) > 0)
      .sort((a, b) => (b.season_goals ?? 0) - (a.season_goals ?? 0))[0] ?? null;
  }, [radarPlayers, hasAnyGoals]);

  // Top minutes — fallback sur games si minutes absent
  const topTime = useMemo(() => {
    if (hasAnyMinutes) {
      return (
        [...radarPlayers]
          .filter((p) => (p.season_minutes ?? 0) > 0)
          .sort((a, b) => (b.season_minutes ?? 0) - (a.season_minutes ?? 0))[0] ?? null
      );
    }
    if (hasAnyGames) {
      return (
        [...radarPlayers]
          .filter((p) => (p.season_games ?? 0) > 0)
          .sort((a, b) => (b.season_games ?? 0) - (a.season_games ?? 0))[0] ?? null
      );
    }
    return null;
  }, [radarPlayers, hasAnyMinutes, hasAnyGames]);

  // Aucune stat disponible — masquer
  const cards: React.ReactNode[] = [];

  if (topGA) {
    const ga = (topGA.season_goals ?? 0) + (topGA.season_assists ?? 0);
    cards.push(
      <StatCard
        key="ga"
        label="G+A"
        value={String(ga)}
        unit="G+A"
        player={topGA}
        accentClass="text-success"
      />,
    );
  }

  if (topGoals) {
    cards.push(
      <StatCard
        key="goals"
        label="Buts"
        value={String(topGoals.season_goals ?? 0)}
        unit="buts"
        player={topGoals}
        accentClass="text-primary"
      />,
    );
  }

  if (topTime) {
    const isMinutes = (topTime.season_minutes ?? 0) > 0;
    const val = isMinutes
      ? String(topTime.season_minutes)
      : String(topTime.season_games ?? 0);
    const unit = isMinutes ? "min" : "matchs";
    cards.push(
      <StatCard
        key="time"
        label={isMinutes ? "Minutes" : "Matchs"}
        value={val}
        unit={unit}
        player={topTime}
        accentClass="text-muted-light"
      />,
    );
  }

  if (cards.length === 0) return null;

  return (
    <section
      aria-labelledby="pro-stats-heading"
      className="container-site pb-8 pt-2"
    >
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
          Radar · Stats saison 25-26
        </p>
        <h2
          id="pro-stats-heading"
          className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground"
        >
          Pepites stats
        </h2>
        <p className="mt-1 text-xs text-muted-light">
          Meilleurs chiffres de saison parmi les talents eligibles RDC.
          {!hasAnyMinutes && hasAnyGames && (
            <span className="ml-1 text-muted/70">
              Minutes non encore synchronisees — affichage en matchs joues.
            </span>
          )}
        </p>
      </div>

      {/* 3 mini-cards */}
      <div className="flex flex-col sm:flex-row gap-3">
        {cards}
      </div>
    </section>
  );
}

export default ProStatsBlock;
