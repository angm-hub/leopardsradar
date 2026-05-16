import { ArrowRight, Share2 } from "lucide-react";
import { useMaListeV2Store } from "@/store/maListeV2Store";
import { cn } from "@/lib/utils";

interface StickyShareCTAProps {
  onShare: () => void;
}

export function StickyShareCTA({ onShare }: StickyShareCTAProps) {
  const isXIComplete = useMaListeV2Store((s) => s.isStartersComplete());
  const isBenchComplete = useMaListeV2Store((s) => s.isBenchComplete());
  const captain = useMaListeV2Store((s) => s.captain);
  const xiCount = useMaListeV2Store((s) => s.getStartersCount());
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
    <div className="sticky bottom-0 z-20 border-t border-border/40 bg-background/85 backdrop-blur-2xl">
      {/* Progress bar plus généreuse */}
      <div className="h-[3px] w-full bg-border/40 overflow-hidden">
        <div
          className="relative h-full bg-gradient-to-r from-primary via-star-soft to-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        >
          {isComplete && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>
      </div>
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-6">
        {/* Progress */}
        <div className="hidden sm:flex items-center gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full transition-colors", isXIComplete ? "bg-primary" : "bg-foreground/20")} />
            <span className="text-foreground/55">
              <span className={cn("font-bold", isXIComplete && "text-primary")}>{xiCount}</span>/11
            </span>
            <span className="text-foreground/35 uppercase tracking-[0.06em] text-[10px]">XI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full transition-colors", isBenchComplete ? "bg-primary" : "bg-foreground/20")} />
            <span className="text-foreground/55">
              <span className={cn("font-bold", isBenchComplete && "text-primary")}>{benchCount}</span>/15
            </span>
            <span className="text-foreground/35 uppercase tracking-[0.06em] text-[10px]">Banc</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full transition-colors", captain ? "bg-primary" : "bg-foreground/20")} />
            <span className={cn("text-foreground/55", captain && "text-primary")}>
              {captain ? captain.name.split(" ").slice(-1)[0] : "Capitaine"}
            </span>
          </div>
        </div>

        {/* Mobile : un seul compteur */}
        <span className="sm:hidden font-mono text-[11px] text-foreground/55">
          <span className="text-primary font-bold">{filled}</span>/27
        </span>

        {/* Action */}
        <button
          type="button"
          onClick={onShare}
          disabled={!isComplete}
          className={cn(
            "group relative flex items-center gap-2.5 rounded-full px-6 py-3 font-sans text-[14px] font-semibold transition-all duration-200",
            isComplete
              ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(245,197,24,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(245,197,24,0.7)] hover:-translate-y-0.5"
              : "bg-card/60 text-foreground/40 cursor-not-allowed border border-border/60",
          )}
        >
          {isComplete && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/30 blur-xl -z-10"
            />
          )}
          {isComplete ? (
            <>
              <Share2 className="h-4 w-4" strokeWidth={2.5} />
              <span>{label}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          ) : (
            <span>{label}</span>
          )}
        </button>
      </div>
    </div>
  );
}
