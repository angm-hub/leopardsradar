import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function PlayerCardSkeleton({ className }: Props) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-card border border-border",
        "bg-gradient-to-r from-card via-card-hover to-card",
        "animate-shimmer",
        className,
      )}
      style={{ backgroundSize: "200% 100%" }}
      aria-hidden
    />
  );
}

export default PlayerCardSkeleton;
