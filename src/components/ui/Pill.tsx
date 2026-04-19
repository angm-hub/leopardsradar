import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PillProps {
  children: ReactNode;
  icon?: LucideIcon;
  dot?: boolean;
  dotColor?: string;
  className?: string;
}

export function Pill({
  children,
  icon: Icon,
  dot = false,
  dotColor = "bg-primary",
  className,
}: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
        "border border-border bg-card/60 backdrop-blur-sm",
        "text-[11px] uppercase tracking-wider text-muted-light",
        className,
      )}
    >
      {dot ? (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse-subtle",
              dotColor,
            )}
          />
          <span
            className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dotColor)}
          />
        </span>
      ) : null}
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2} /> : null}
      {children}
    </span>
  );
}

export default Pill;
