import { ArrowRight, Share2 } from "lucide-react";
import { useMaListeV2Store } from "@/store/maListeV2Store";
import { cn } from "@/lib/utils";

interface StickyShareCTAProps {
  onShare: () => void;
}

export function StickyShareCTA({ onShare }: StickyShareCTAProps) {
  const isXIComplete = useMaListeV2Store((s) => s.isXIComplete());
  const isBenchComplete = useMaListeV2Store((s) => s.isBenchComplete());
  const captain = useMaListeV2Store((s) => s.captain);
  const xiCount = useMaListeV2Store((s) => s.getXICount());
  const benchCount = useMaListeV2Store((s) => s.getBenchCount());

  const isComplete = isXIComplete && isBenchComplete && !!captain;

  let label = "Partager ma liste";
  if (!isXIComplete) label = `${xiCount}/11 titulaires`;
  else if (!isBenchComplete) label = `${benchCount}/15 sur le banc`;
  else if (!captain) label = "Choisis ton capitaine";

  // Progress fill (0 → 100)
  const total = 11 + 15 + 1;
  const filled = xiCount + benchCount + (captain ? 1 : 0);
  const pct = (filled / total) * 100;

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-md">
      {/* Progress bar fine */}
      <div className="h-px w-full bg-border">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 md:px-6">
        {/* Progress */}
        <div className="hidden sm:flex items-center gap-3 font-v2-mono text-[11px] text-foreground/55">
          <span>
            <span className={cn(isXIComplete && "text-primary")}>{xiCount}/11</span> XI
          </span>
          <span className="text-foreground/20">·</span>
          <span>
            <span className={cn(isBenchComplete && "text-primary")}>{benchCount}/15</span> banc
          </span>
          <span className="text-foreground/20">·</span>
          <span>
            <span className={cn(captain && "text-primary")}>{captain ? "✓" : "0"}</span> capitaine
          </span>
        </div>

        {/* Mobile : un seul compteur */}
        <span className="sm:hidden font-v2-mono text-[11px] text-foreground/55">
          {filled}/27
        </span>

        {/* Action */}
        <button
          type="button"
          onClick={onShare}
          disabled={!isComplete}
          className={cn(
            "group flex items-center gap-2 rounded-full px-5 py-2.5 font-v2-body text-[13px] font-semibold transition-all",
            isComplete
              ? "bg-primary text-primary-foreground hover:bg-primary-hover"
              : "bg-card text-foreground/40 cursor-not-allowed border border-border",
          )}
        >
          {isComplete ? (
            <>
              <Share2 className="h-4 w-4" strokeWidth={2.5} />
              <span>{label}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            <span>{label}</span>
          )}
        </button>
      </div>
    </div>
  );
}
