import { cn } from "@/lib/utils";

interface StatBlockProps {
  label: string;
  value: string | number;
  change?: string;
  className?: string;
}

export function StatBlock({ label, value, change, className }: StatBlockProps) {
  const isPositive = change?.trim().startsWith("+");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      <span className="font-mono text-4xl md:text-5xl font-semibold text-foreground leading-none">
        {value}
      </span>
      {change ? (
        <span
          className={cn(
            "text-sm font-medium",
            isPositive ? "text-success" : "text-alert",
          )}
        >
          {change}
        </span>
      ) : null}
    </div>
  );
}

export default StatBlock;
