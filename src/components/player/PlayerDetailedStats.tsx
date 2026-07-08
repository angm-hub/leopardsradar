/**
 * PlayerDetailedStats — Tab "Stats avancées".
 *
 * Tableau saison × compétition × stats depuis player_stats_advanced.
 * Scroll horizontal sur mobile.
 */

import { cn } from "@/lib/utils";
import type { PlayerStatsRow } from "@/lib/playerAttributes";

interface PlayerDetailedStatsProps {
  stats: PlayerStatsRow[];
  loading?: boolean;
  className?: string;
}

function fmt(v: number | null | undefined, decimals = 0): string {
  if (v === null || v === undefined) return "n.d.";
  if (!Number.isFinite(v)) return "n.d.";
  return decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return "n.d.";
  return `${(v * 100).toFixed(0)}%`;
}

const COLUMNS: {
  key: keyof PlayerStatsRow | "xg_r" | "long_pass_pct_r";
  label: string;
  format: (row: PlayerStatsRow) => string;
  highlight?: (row: PlayerStatsRow) => boolean;
}[] = [
  { key: "season",           label: "Saison",   format: (r) => r.season },
  { key: "competition",      label: "Comp.",     format: (r) => r.competition.length > 20 ? r.competition.slice(0, 18) + "…" : r.competition },
  { key: "matches_played",   label: "MJ",        format: (r) => fmt(r.matches_played) },
  { key: "minutes_played",   label: "Min",       format: (r) => fmt(r.minutes_played) },
  { key: "goals",            label: "Buts",      format: (r) => fmt(r.goals),    highlight: (r) => r.goals >= 5 },
  { key: "assists",          label: "PD",        format: (r) => fmt(r.assists),  highlight: (r) => r.assists >= 5 },
  { key: "xg_r",             label: "xG",        format: (r) => fmt(r.xg, 2) },
  { key: "xag",              label: "xAG",       format: (r) => fmt(r.xag, 2) },
  { key: "key_passes",       label: "KP",        format: (r) => fmt(r.key_passes) },
  { key: "progressive_carries", label: "PC",     format: (r) => fmt(r.progressive_carries) },
  { key: "progressive_passes",  label: "PP",     format: (r) => fmt(r.progressive_passes) },
  { key: "tackles_won",      label: "Tkl",       format: (r) => fmt(r.tackles_won) },
  { key: "interceptions",    label: "Int",       format: (r) => fmt(r.interceptions) },
  { key: "aerial_duels_won", label: "Aér G",     format: (r) => fmt(r.aerial_duels_won) },
  { key: "aerial_duels_total", label: "Aér T",   format: (r) => fmt(r.aerial_duels_total) },
  { key: "long_pass_pct_r",  label: "LP%",       format: (r) => fmtPct(r.long_pass_pct) },
  { key: "dribbles_completed", label: "Drib G",  format: (r) => fmt(r.dribbles_completed) },
  { key: "dribbles_attempted", label: "Drib T",  format: (r) => fmt(r.dribbles_attempted) },
  { key: "saves",            label: "Arrêts",    format: (r) => fmt(r.saves) },
  { key: "clean_sheets",     label: "CS",        format: (r) => fmt(r.clean_sheets) },
];

export function PlayerDetailedStats({ stats, loading, className }: PlayerDetailedStatsProps) {
  if (loading) {
    return (
      <div className={cn("rounded-card border border-border bg-card p-6 animate-pulse", className)}>
        <div className="h-4 w-48 bg-card-hover rounded mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 bg-card-hover rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className={cn("rounded-card border border-dashed border-border bg-card/40 p-8 text-center", className)}>
        <p className="text-sm text-muted-light">
          Aucune statistique avancée disponible pour ce joueur.
        </p>
        <p className="mt-2 text-xs text-muted">
          Les stats avancées (xG, progressive carries, tackles) sont alimentées par notre pipeline FBref.
          Les profils trackés dans le top 15 européen sont couverts en priorité.
        </p>
      </div>
    );
  }

  // Filtrer les colonnes pertinentes (exclure colonnes toutes à "n.d.")
  const relevantColumns = COLUMNS.filter((col) => {
    if (["season", "competition", "matches_played", "minutes_played", "goals", "assists"].includes(col.key as string)) {
      return true;
    }
    return stats.some((r) => col.format(r) !== "n.d.");
  });

  return (
    <div className={cn("rounded-card border border-border overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-border bg-card/60">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">
          Statistiques avancées ({stats.length} ligne{stats.length > 1 ? "s" : ""})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-border/60 bg-card/40">
              {relevantColumns.map((col) => (
                <th
                  key={col.key as string}
                  className="px-3 py-2.5 text-left text-[9px] font-mono uppercase tracking-[0.18em] text-muted whitespace-nowrap"
                  scope="col"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {stats.map((row, i) => (
              <tr
                key={`${row.season}-${row.competition}-${i}`}
                className="bg-card hover:bg-card-hover transition-colors"
              >
                {relevantColumns.map((col) => {
                  const isHighlight = col.highlight?.(row) ?? false;
                  const value = col.format(row);
                  const isSeason = col.key === "season";
                  const isComp = col.key === "competition";
                  return (
                    <td
                      key={col.key as string}
                      className={cn(
                        "px-3 py-2 whitespace-nowrap",
                        isSeason || isComp
                          ? "text-[11px] font-mono text-muted-light"
                          : "text-[11px] font-mono text-center",
                        isHighlight && "text-primary font-semibold",
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border/40 bg-card/30">
        <p className="text-[10px] font-mono text-muted">
          MJ = Matchs joués · PD = Passes décisives · KP = Key passes · PC/PP = Progressive carries/passes · Tkl = Tackles gagnés · Int = Interceptions · Aér = Duels aériens · LP% = Long pass% · Drib = Dribbles · CS = Clean sheets
        </p>
      </div>
    </div>
  );
}

export default PlayerDetailedStats;
