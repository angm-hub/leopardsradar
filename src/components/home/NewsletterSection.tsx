import { Activity, Feather, Sparkles, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/ButtonPrimitive";
import { supabase } from "@/integrations/supabase/client";
import { useNewsletterCount } from "@/hooks/useNewsletterCount";
import { toast } from "sonner";
import { z } from "zod";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Adresse email invalide" })
  .max(255);

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { count } = useNewsletterCount();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Email invalide");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: parsed.data, source: "home" });

      if (error) {
        // Unique violation -> already subscribed
        if (error.code === "23505") {
          toast.success(
            "Tu es déjà dans la liste. Vérifie ta boîte mail pour le lien de confirmation.",
          );
        } else {
          throw error;
        }
      } else {
        // Try to send confirmation email (non-blocking)
        try {
          await supabase.functions.invoke("send-newsletter-confirmation", {
            body: { email: parsed.data },
          });
        } catch (err) {
          console.warn("[newsletter] confirmation email not sent yet", err);
        }
        toast.success(
          "Presque ! Vérifie ta boîte mail pour confirmer ton inscription.",
        );
        setEmail("");
      }
    } catch (err) {
      console.error("[newsletter]", err);
      toast.error("Une erreur est survenue. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative py-24 md:py-32 bg-card overflow-hidden">
      <StrongGradient intensity={0.95} position="flow" />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-[0.03] text-foreground"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="container-site relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">
            Le Radar Léopards
          </span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Une édition. Tous les vendredis.
          </h2>
          <p className="mt-5 text-muted-light text-lg max-w-xl mx-auto leading-relaxed">
            Les performances de vos Léopards, un talent à surveiller, et
            l'analyse de la semaine. Soigné. Court. Gratuit.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {[
              { icon: Activity, label: "Performances hebdo" },
              { icon: Sparkles, label: "Un talent surveillé" },
              { icon: Feather, label: "L'analyse de la semaine" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 text-sm text-foreground/80"
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-12 mx-auto max-w-lg flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              required
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="flex-1 bg-background border border-border rounded-button px-5 py-4 text-foreground placeholder:text-muted focus:border-primary outline-none transition-colors disabled:opacity-60"
            />
            <Button type="submit" variant="shimmer" size="lg" disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi…
                </span>
              ) : (
                "Recevoir"
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted">
            {count !== null ? `${count} fans abonnés` : "Rejoins les fans"} · 0 spam · Se désabonner en 1 clic
          </p>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSection;
