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

// Apple-grade primary :
//   - Gradient vertical subtle (top 6% plus clair → bottom plus dense)
//   - Inner highlight 1px blanc opacity 20 (effet "verre" sur le bord supérieur)
//   - Stack de shadows : focal contact 1px + ambient soft 4px + glow accent 12px
//   - Pas de hover:scale (anti-pattern AI). On joue sur la luminosité du gradient.
//   - active:translate-y-px → micro press feedback iOS-like
const PREMIUM_BASE =
  "text-primary-foreground transition-[transform,filter,box-shadow] duration-200 ease-out " +
  "bg-[linear-gradient(180deg,#FFD736_0%,#FCD116_55%,#E5BC10_100%)] " +
  "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.35),0_8px_24px_rgba(252,209,22,0.18)] " +
  "hover:[filter:brightness(1.04)] " +
  "hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.4),0_10px_28px_rgba(252,209,22,0.28)] " +
  "active:translate-y-px active:[filter:brightness(0.97)]";

const variantClasses: Record<Variant, string> = {
  primary: PREMIUM_BASE,
  shimmer:
    PREMIUM_BASE +
    " relative overflow-hidden isolate" +
    " before:content-[''] before:absolute before:inset-0 before:-translate-x-full" +
    " before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]" +
    " hover:before:translate-x-[200%] before:transition-transform before:duration-[1100ms] before:ease-out",
  secondary:
    "bg-[linear-gradient(180deg,#1A1A1F_0%,#131316_100%)] text-foreground " +
    "[box-shadow:0_0_0_0.5px_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.3)] " +
    "transition-[filter,box-shadow] duration-200 " +
    "hover:[filter:brightness(1.15)] " +
    "hover:[box-shadow:0_0_0_0.5px_rgba(255,255,255,0.14),0_2px_6px_rgba(0,0,0,0.35)] " +
    "active:translate-y-px",
  ghost:
    "bg-transparent text-foreground transition-[background-color,filter] duration-200 " +
    "hover:bg-[rgba(255,255,255,0.04)]",
  outline:
    "bg-[rgba(255,255,255,0.02)] text-foreground " +
    "[box-shadow:0_0_0_0.5px_rgba(255,255,255,0.1)] " +
    "transition-[background-color,box-shadow] duration-200 " +
    "hover:bg-[rgba(255,255,255,0.05)] " +
    "hover:[box-shadow:0_0_0_0.5px_rgba(255,255,255,0.18)] " +
    "active:translate-y-px",
  "ghost-premium":
    "bg-transparent text-foreground " +
    "[box-shadow:0_0_0_0.5px_rgba(252,209,22,0.3)] " +
    "transition-[background-color,box-shadow,color] duration-200 " +
    "hover:[box-shadow:0_0_0_0.5px_rgba(252,209,22,0.6)] " +
    "hover:bg-[rgba(252,209,22,0.06)] hover:text-primary",
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
