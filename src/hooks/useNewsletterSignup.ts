import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NewsletterStatus =
  | "idle"
  | "loading"
  | "success"
  | "duplicate"
  | "error";

export type NewsletterSource = "hero" | "section" | "page" | "navbar" | "footer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupResult {
  status: NewsletterStatus;
  message?: string;
}

export function useNewsletterSignup() {
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [message, setMessage] = useState<string>("");

  function reset() {
    setStatus("idle");
    setMessage("");
  }

  async function subscribe(
    email: string,
    source: NewsletterSource = "section",
  ): Promise<SignupResult> {
    const cleaned = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleaned)) {
      const msg = "Email non valide. Vérifie le format.";
      setStatus("error");
      setMessage(msg);
      return { status: "error", message: msg };
    }

    setStatus("loading");
    setMessage("");

    try {
      // Insert with is_active=false (RLS enforces this).
      // Double opt-in flow: confirmation email is handled by Supabase function/trigger.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("newsletter_subscribers")
        .insert({ email: cleaned, source });

      if (error) {
        // Postgres unique violation → already subscribed
        if (error.code === "23505") {
          const msg = "Tu es déjà sur la liste. À vendredi.";
          setStatus("duplicate");
          setMessage(msg);
          return { status: "duplicate", message: msg };
        }
        throw error;
      }

      const msg = "Bien reçu. Première édition à ton arrivée.";
      setStatus("success");
      setMessage(msg);
      return { status: "success", message: msg };
    } catch (e) {
      console.error("[useNewsletterSignup]", e);
      const msg = "Une erreur, réessaie dans quelques secondes.";
      setStatus("error");
      setMessage(msg);
      return { status: "error", message: msg };
    }
  }

  return {
    status,
    message,
    subscribe,
    reset,
    isLoading: status === "loading",
    isSuccess: status === "success" || status === "duplicate",
    isError: status === "error",
  };
}
