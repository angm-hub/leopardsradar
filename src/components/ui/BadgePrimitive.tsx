import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "success" | "alert" | "position";
type Position = "gk" | "def" | "mid" | "att";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  position?: Position;
  children: ReactNode;
}

const variantClasses: Record<Exclude<Variant, "position">, string> = {
  default: "bg-card border border-border text-muted-light",
  primary: "bg-primary/15 text-primary border border-primary/25",
  success: "bg-success/15 text-success border border-success/25",
  alert: "bg-alert/15 text-alert border border-alert/30",
};

const positionClasses: Record<Position, string> = {
  gk: "bg-pos-gk/15 text-pos-gk border border-pos-gk/30",
  def: "bg-pos-def/15 text-pos-def border border-pos-def/30",
  mid: "bg-pos-mid/15 text-pos-mid border border-pos-mid/30",
  att: "bg-pos-att/15 text-pos-att border border-pos-att/30",
};

export function Badge({
  variant = "default",
  position,
  className,
  children,
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-full font-medium";
  const themed =
    variant === "position" && position
      ? positionClasses[position]
      : variantClasses[variant === "position" ? "default" : variant];

  return (
    <span className={cn(base, themed, className)} {...props}>
      {children}
    </span>
  );
}

export default Badge;
