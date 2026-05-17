/**
 * KeyInsights — Bullets auto-générés depuis les 15 attributs.
 *
 * 2-3 bullets max :
 *   - "Elite Finishing 17" (note >= 17)
 *   - "Strong Goal Contrib. 15, Stamina 15"
 *   - "Limited Tackling 8, Long Pass 8"
 */

import { cn } from "@/lib/utils";
import type { KeyInsight } from "@/lib/playerAttributes";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KeyInsightsProps {
  insights: KeyInsight[];
  className?: string;
}

export function KeyInsights({ insights, className }: KeyInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <div className={cn("rounded-card border border-border bg-card p-4 md:p-5", className)}>
      <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted mb-3">
        Key Insights
      </h3>
      <ul className="space-y-2" role="list">
        {insights.map((insight, i) => (
          <InsightItem key={i} insight={insight} />
        ))}
      </ul>
    </div>
  );
}

function InsightItem({ insight }: { insight: KeyInsight }) {
  const config = {
    elite: {
      Icon: TrendingUp,
      iconClass: "text-emerald-400",
      textClass: "text-foreground/90",
      dotClass: "bg-emerald-400",
    },
    strong: {
      Icon: TrendingUp,
      iconClass: "text-star-DEFAULT",
      textClass: "text-foreground/80",
      dotClass: "bg-star-DEFAULT",
    },
    limited: {
      Icon: TrendingDown,
      iconClass: "text-blood-DEFAULT",
      textClass: "text-foreground/70",
      dotClass: "bg-blood-DEFAULT",
    },
  }[insight.type] ?? {
    Icon: Minus,
    iconClass: "text-muted",
    textClass: "text-muted-light",
    dotClass: "bg-muted",
  };

  const { Icon, iconClass, textClass, dotClass } = config;

  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className={cn("mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0", dotClass)}
      />
      <Icon className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", iconClass)} aria-hidden />
      <span className={cn("text-sm leading-relaxed", textClass)}>
        {insight.text}
      </span>
    </li>
  );
}

export default KeyInsights;
