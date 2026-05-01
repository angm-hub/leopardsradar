import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useNewsletterSignup,
  type NewsletterSource,
} from "@/hooks/useNewsletterSignup";

type Variant = "compact" | "full";

interface NewsletterFormProps {
  source: NewsletterSource;
  variant?: Variant;
  buttonLabel?: string;
  placeholder?: string;
  helper?: string;
  className?: string;
}

/**
 * NewsletterForm — formulaire d'inscription newsletter (double opt-in côté Supabase).
 *
 * Variants :
 * - "compact" : input + bouton inline (hero, navbar)
 * - "full" : input + bouton large empilés (section newsletter, page newsletter)
 */
export function NewsletterForm({
  source,
  variant = "full",
  buttonLabel = "Recevoir l'édition du vendredi",
  placeholder = "Ton email",
  helper = "Une édition par semaine. Zéro spam. Désinscription en un clic.",
  className,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const { status, message, subscribe, isLoading, isSuccess } =
    useNewsletterSignup();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    await subscribe(email, source);
    if (status !== "error") setEmail("");
  }

  // Success / duplicate state — replace form by editorial confirmation.
  if (isSuccess) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-3 rounded-button border border-primary/30 bg-primary/5 px-5 py-3 text-sm text-foreground",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <Check className="h-4 w-4 text-primary shrink-0" />
        <span className="text-balance">
          {message}{" "}
          <span className="text-muted-light">— Léopards Radar</span>
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex w-full max-w-md flex-col gap-2",
          className,
        )}
        noValidate
      >
        <div className="flex w-full items-stretch gap-2 rounded-button border border-border bg-card/40 px-1 py-1 backdrop-blur-sm focus-within:border-primary/50 transition-colors">
          <label className="sr-only" htmlFor={`nl-${source}`}>
            Email
          </label>
          <input
            id={`nl-${source}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-button bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              "transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-60 disabled:pointer-events-none",
            )}
          >
            {isLoading ? "…" : "Préviens-moi"}
            {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
        <span
          className={cn(
            "text-xs leading-relaxed",
            status === "error" ? "text-red-400" : "text-foreground/45",
          )}
        >
          {message || helper}
        </span>
      </form>
    );
  }

  // variant === "full"
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full max-w-md mx-auto flex-col gap-3",
        className,
      )}
      noValidate
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor={`nl-${source}`}>
          Email
        </label>
        <input
          id={`nl-${source}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className={cn(
            "flex-1 rounded-button border border-border bg-card/60 px-4 py-3 text-base text-foreground placeholder:text-foreground/40",
            "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-50 transition-colors",
          )}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-button bg-primary px-6 py-3 text-base font-medium text-primary-foreground whitespace-nowrap",
            "transition-all duration-200",
            "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),0_0_20px_rgba(252,209,22,0.15)]",
            "hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.18),0_0_30px_rgba(252,209,22,0.3)]",
            "hover:scale-[1.02] active:scale-[0.98]",
            "disabled:opacity-60 disabled:pointer-events-none disabled:hover:scale-100",
          )}
        >
          {isLoading ? "Envoi…" : buttonLabel}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      <span
        className={cn(
          "text-xs leading-relaxed text-center",
          status === "error" ? "text-red-400" : "text-foreground/50",
        )}
        aria-live="polite"
      >
        {message || helper}
      </span>
    </form>
  );
}

export default NewsletterForm;
