import type { DBPlayer } from "@/types/dbPlayer";
import type { PlayerScores } from "@/lib/playerScores";
import { formatMarketValue } from "@/lib/playerHelpers";
import { COMPARE_COLORS } from "./HexagonCompare";

interface CompareDeltasProps {
  playerA: DBPlayer;
  playerB: DBPlayer;
  scoresA: PlayerScores;
  scoresB: PlayerScores;
}

type Row = {
  label: string;
  /** Raw numeric values used to compute the delta. Null = unknown. */
  vA: number | null;
  vB: number | null;
  /** Display strings (already formatted, e.g. "12 buts" or "—"). */
  dispA: string;
  dispB: string;
  /** Bigger-is-better. Set false to flip the leader colouring (e.g. age). */
  higherIsBetter?: boolean;
  /** "Footer" hint shown muted below the row. Optional. */
  hint?: string;
};

/**
 * CompareDeltas — head-to-head numeric comparison.
 *
 * Two blocks :
 *   - "Profil statistique" : the 6 hexagon axes, with a delta in points
 *     (+12 / -3) coloured against the leader.
 *   - "Saison & identité" : raw numbers (matchs, buts, PD, minutes,
 *     valeur marché, âge, caps RDC).
 *
 * Delta colouring uses the slot accent of the leader, so the user reads
 * the comparison the same way as the hexagon. When both values match,
 * neither side is highlighted.
 */
export function CompareDeltas({
  playerA,
  playerB,
  scoresA,
  scoresB,
}: CompareDeltasProps) {
  const axisRows: Row[] = scoresA.order.map((key) => {
    const a = scoresA.axes[key];
    const b = scoresB.axes[key];
    const labelMix = a.label === b.label ? a.label : `${a.label} / ${b.label}`;
    return {
      label: labelMix,
      vA: a.value,
      vB: b.value,
      dispA: a.value === null ? "—" : `${a.value}`,
      dispB: b.value === null ? "—" : `${b.value}`,
      hint: a.label === b.label ? a.fullLabel : undefined,
    };
  });

  const factualRows: Row[] = [
    {
      label: "Matchs joués",
      vA: playerA.season_games || 0,
      vB: playerB.season_games || 0,
      dispA: `${playerA.season_games ?? 0}`,
      dispB: `${playerB.season_games ?? 0}`,
    },
    {
      label: "Buts",
      vA: playerA.season_goals || 0,
      vB: playerB.season_goals || 0,
      dispA: `${playerA.season_goals ?? 0}`,
      dispB: `${playerB.season_goals ?? 0}`,
    },
    {
      label: "Passes décisives",
      vA: playerA.season_assists || 0,
      vB: playerB.season_assists || 0,
      dispA: `${playerA.season_assists ?? 0}`,
      dispB: `${playerB.season_assists ?? 0}`,
    },
    {
      label: "Minutes",
      vA: playerA.season_minutes || 0,
      vB: playerB.season_minutes || 0,
      dispA: playerA.season_minutes
        ? playerA.season_minutes.toLocaleString("fr-FR")
        : "—",
      dispB: playerB.season_minutes
        ? playerB.season_minutes.toLocaleString("fr-FR")
        : "—",
      hint: "Quand l'API ne livre pas les minutes, le profil hexagonal estime à matchs × 80.",
    },
    {
      label: "Sélections RDC",
      vA: playerA.caps_rdc || 0,
      vB: playerB.caps_rdc || 0,
      dispA: `${playerA.caps_rdc ?? 0}`,
      dispB: `${playerB.caps_rdc ?? 0}`,
    },
    {
      label: "Valeur marché",
      vA: playerA.market_value_eur,
      vB: playerB.market_value_eur,
      dispA: formatMarketValue(playerA.market_value_eur),
      dispB: formatMarketValue(playerB.market_value_eur),
    },
    {
      label: "Âge",
      vA: playerA.age,
      vB: playerB.age,
      dispA: playerA.age ? `${playerA.age} ans` : "—",
      dispB: playerB.age ? `${playerB.age} ans` : "—",
      higherIsBetter: false,
      hint: "Plus jeune = plus de runway international.",
    },
  ];

  return (
    <div className="space-y-12">
      <DeltasBlock title="Profil statistique" rows={axisRows} />
      <DeltasBlock title="Saison & identité" rows={factualRows} />
    </div>
  );
}

function DeltasBlock({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted mb-4">
        {title}
      </h3>
      <div className="rounded-card border border-border bg-card overflow-hidden">
        {rows.map((row, i) => (
          <DeltaRow key={`${title}-${row.label}-${i}`} row={row} />
        ))}
      </div>
    </div>
  );
}

function DeltaRow({ row }: { row: Row }) {
  const higherIsBetter = row.higherIsBetter !== false;
  const bothKnown = row.vA !== null && row.vB !== null;
  let leader: "A" | "B" | "tie" = "tie";
  let deltaText: string | null = null;

  if (bothKnown && row.vA !== row.vB) {
    const aWins = higherIsBetter ? row.vA! > row.vB! : row.vA! < row.vB!;
    leader = aWins ? "A" : "B";
    const diff = Math.abs(row.vA! - row.vB!);
    // Format the delta : integers stay integers, large numbers go compact.
    deltaText =
      diff >= 1_000_000
        ? `${(diff / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`
        : diff >= 1000
          ? diff.toLocaleString("fr-FR")
          : `${diff}`;
  }

  const colorA = leader === "A" ? COMPARE_COLORS.A : "var(--tw-foreground, #F4F4F1)";
  const colorB = leader === "B" ? COMPARE_COLORS.B : "var(--tw-foreground, #F4F4F1)";
  const aClass =
    leader === "A" ? "" : leader === "B" ? "text-muted-light" : "text-foreground";
  const bClass =
    leader === "B" ? "" : leader === "A" ? "text-muted-light" : "text-foreground";

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] sm:grid-cols-[1fr_minmax(140px,auto)_1fr] items-baseline gap-2 sm:gap-6 px-4 sm:px-6 py-3.5 border-b border-border/60 last:border-b-0">
      <div className="text-right">
        <span
          className={`font-serif text-xl sm:text-2xl ${aClass}`}
          style={leader === "A" ? { color: colorA } : undefined}
        >
          {row.dispA}
        </span>
      </div>
      <div className="text-center min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {row.label}
        </div>
        {deltaText ? (
          <div
            className="mt-1 font-mono text-[11px]"
            style={{ color: leader === "A" ? COMPARE_COLORS.A : COMPARE_COLORS.B }}
          >
            {leader === "A" ? "←" : "→"} {deltaText}
          </div>
        ) : !bothKnown ? (
          <div className="mt-1 font-mono text-[10px] text-muted">données partielles</div>
        ) : (
          <div className="mt-1 font-mono text-[10px] text-muted">égalité</div>
        )}
        {row.hint ? (
          <div className="mt-1 hidden sm:block text-[10px] text-muted leading-relaxed">
            {row.hint}
          </div>
        ) : null}
      </div>
      <div className="text-left">
        <span
          className={`font-serif text-xl sm:text-2xl ${bClass}`}
          style={leader === "B" ? { color: colorB } : undefined}
        >
          {row.dispB}
        </span>
      </div>
    </div>
  );
}

export default CompareDeltas;
