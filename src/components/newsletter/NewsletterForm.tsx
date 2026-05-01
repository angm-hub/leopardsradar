import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import {
  EMAIL_RE,
  subscribeEmail,
  type NewsletterSource,
} from "@/lib/newsletterApi";

type Variant = "inline-hero" | "block";

interface Props {
  source: NewsletterSource;
  variant?: Variant;
  buttonLabel: string;
  placeholder?: string;
  microcopy?: string;
  successMessage?: string;
  className?: string;
}

const DEFAULT_SUCCESS =
  "Bien reçu. Première édition à ton arrivée. — Léopards Radar";

export function NewsletterForm({
  source,
  variant = "block",
  buttonLabel,
  placeholder = "Ton email",
  microcopy,
  successMessage = DEFAULT_SUCCESS,
  className,
}: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setErrorMsg(null);

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setState("error");
      setErrorMsg("Email invalide.");
      return;
    }

    setState("loading");
    const res = await subscribeEmail(trimmed, source);
    if (res.ok) {
      setState("success");
      setEmail("");
      return;
    }
    setState("error");
    if (res.reason === "duplicate") {
      setErrorMsg("Tu es déjà sur la liste. À vendredi.");
    } else if (res.reason === "invalid") {
      setErrorMsg("Email invalide.");
    } else {
      setErrorMsg("Une erreur, réessaie dans quelques secondes.");
    }
  }

  if (state === "success") {
    return (
      <div
        className={cn(
          "font-serif italic text-foreground/90",
          variant === "inline-hero" ? "text-base" : "text-lg",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        {successMessage}
      </div>
    );
  }

  if (variant === "inline-hero") {
    return (
      <form onSubmit={onSubmit} noValidate className={cn("w-full max-w-md", className)}>
        <div className="flex items-center gap-3 border-b border-foreground/20 focus-within:border-primary/60 transition-colors">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            placeholder={placeholder}
            aria-label="Adresse email"
            className="flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
            disabled={state === "loading"}
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className={cn(
              "shrink-0 rounded-button bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium",
              "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-wait",
            )}
          >
            {state === "loading" ? "…" : buttonLabel}
          </button>
        </div>
        {state === "error" && errorMsg ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {errorMsg}
          </p>
        ) : microcopy ? (
          <p className="mt-2 text-xs text-foreground/60">{microcopy}</p>
        ) : null}
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn("w-full max-w-md mx-auto", className)}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder={placeholder}
          aria-label="Adresse email"
          className={cn(
            "flex-1 rounded-button bg-background/60 border border-border px-4 py-3 text-sm text-foreground",
            "placeholder:text-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
            "transition-colors",
          )}
          disabled={state === "loading"}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className={cn(
            "shrink-0 rounded-button bg-primary text-primary-foreground px-5 py-3 text-sm font-medium",
            "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
            "disabled:opacity-60 disabled:cursor-wait",
            "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),0_0_20px_rgba(252,209,22,0.15)]",
          )}
        >
          {state === "loading" ? "Envoi…" : buttonLabel}
        </button>
      </div>
      {state === "error" && errorMsg ? (
        <p className="mt-3 text-sm text-destructive text-left sm:text-center" role="alert">
          {errorMsg}
        </p>
      ) : microcopy ? (
        <p className="mt-3 text-xs text-foreground/60 text-left sm:text-center">
          {microcopy}
        </p>
      ) : null}
    </form>
  );
}

export default NewsletterForm;
