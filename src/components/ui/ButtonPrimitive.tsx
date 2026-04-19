import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "shimmer"
  | "ghost-premium";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

// Premium primary: yellow w/ inner highlight + outer yellow glow, lifts on hover
const PREMIUM_BASE =
  "bg-primary text-primary-foreground transition-all duration-300 " +
  "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),0_0_20px_rgba(252,209,22,0.15)] " +
  "hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.18),0_0_30px_rgba(252,209,22,0.3)] " +
  "hover:scale-[1.02] active:scale-[0.98]";

const variantClasses: Record<Variant, string> = {
  primary: PREMIUM_BASE,
  // Shimmer = primary + animated highlight sweep on hover
  shimmer:
    PREMIUM_BASE +
    " relative overflow-hidden isolate" +
    " before:content-[''] before:absolute before:inset-0 before:-translate-x-full" +
    " before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" +
    " hover:before:translate-x-[200%] before:transition-transform before:duration-[1000ms] before:ease-out",
  secondary:
    "bg-card border border-border text-foreground hover:border-border-hover hover:bg-card-hover",
  ghost: "bg-transparent text-foreground hover:bg-card",
  outline:
    "bg-transparent border border-border text-foreground hover:bg-card/60",
  "ghost-premium":
    "bg-transparent text-foreground border border-[rgba(252,209,22,0.3)] " +
    "transition-all duration-300 " +
    "hover:border-primary hover:bg-[rgba(252,209,22,0.05)] hover:text-primary",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-button font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {/* Wrap children so the ::before shimmer sits beneath the label */}
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
