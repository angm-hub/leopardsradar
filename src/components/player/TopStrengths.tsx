/**
 * TopStrengths — Top 5 stats brutes avec percentile vs même poste.
 *
 * Format :
 *   GOALS PER 90    0.79   → 96e centile
 *
 * Barre percentile horizontale, couleur proportionnelle au percentile.
 */

import { cn } from "@/lib/utils";
import type { TopStrength } from "@/lib/playerAttributes";

interface TopStrengthsProps {
  strengths: TopStrength[];
  position?: string | null;
  className?: string;
}

export function TopStrengths({ strengths, position, className }: TopStrengthsProps) {
  if (strengths.length === 0) return null;

  return (
    <div className={cn("rounded-card border border-border bg-card p-4 md:p-5", className)}>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted">
          Points forts
        </h3>
        {position && (
          <span className="text-[10px] font-mono text-muted/60">
            vs {position.toLowerCase()}s
          </span>
        )}
      </div>

      <div className="space-y-3">
        {strengths.map((s, i) => (
          <StrengthRow key={i} strength={s} />
        ))}
      </div>
    </div>
  );
}

function StrengthRow({ strength }: { strength: TopStrength }) {
  const pct = Math.max(0, Math.min(100, strength.percentile));
  const barColor = pct >= 90
    ? "bg-emerald-400"
    : pct >= 75
      ? "bg-star-DEFAULT"
      : pct >= 50
        ? "bg-cobalt-400"
        : "bg-muted";

  return (
    <div
      className="flex items-center gap-3"
      aria-label={`${strength.label} : ${strength.rawValue}, ${pct}e centile`}
    >
      {/* Label */}
      <span className="w-44 flex-shrink-0 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-light truncate">
        {strength.label}
      </span>

      {/* Valeur brute */}
      <span className="w-16 flex-shrink-0 text-right text-[11px] font-mono text-foreground/80">
        {strength.rawValue}
      </span>

      {/* Barre percentile */}
      <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Percentile */}
      <span
        className={cn(
          "w-10 flex-shrink-0 text-right text-[11px] font-mono font-semibold",
          pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-star-DEFAULT" : "text-muted-light",
        )}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {pct}
      </span>
    </div>
  );
}

export default TopStrengths;
