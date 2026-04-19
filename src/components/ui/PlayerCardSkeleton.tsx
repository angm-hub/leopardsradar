import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function PlayerCardSkeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-card border border-border bg-card",
        className,
      )}
      aria-hidden
    >
      {/* Top-left dot (e.g., position indicator) */}
      <div className="absolute top-3 left-3 h-3 w-3 rounded-full bg-border" />

      {/* Top-right pill (e.g., league badge) */}
      <div className="absolute top-3 right-3 h-6 w-20 rounded-full bg-border" />

      {/* Bottom gradient overlay area mimicking PlayerCard */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/90 via-background/40 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 rounded bg-border" />
          <div className="h-3 w-20 rounded bg-border" />
        </div>
        <div className="h-5 w-32 rounded bg-border" />
      </div>

      {/* Shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-[200%] animate-shimmer"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}

export default PlayerCardSkeleton;
