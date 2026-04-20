import { useState, type FormEvent } from "react";
import { Activity, Sparkles, Feather, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { supabase } from "@/integrations/supabase/client";
import { useNewsletterCount } from "@/hooks/useNewsletterCount";
import { toast } from "sonner";
import { z } from "zod";

const PREVIEWS = [
  {
    icon: Activity,
    title: "Performances internationaux",
    desc: "Comment vos Léopards ont joué ce week-end. Buts, assists, minutes, analyses.",
  },
  {
    icon: Sparkles,
    title: "Un talent surveillé",
    desc: "Un profil du Radar chaque semaine : qui, pourquoi, où il en est.",
  },
  {
    icon: Feather,
    title: "L'analyse de la semaine",
    desc: "Une lecture courte et tranchante sur un sujet actuel des Léopards.",
  },
];

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Adresse email invalide" })
  .max(255);

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { count } = useNewsletterCount();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
        .insert({ email: parsed.data, source: "newsletter_page" });
      if (error) {
        if (error.code === "23505") {
          toast.success(
            "Tu es déjà dans la liste. Vérifie ta boîte mail.",
          );
        } else {
          throw error;
        }
      } else {
        try {
          await supabase.functions.invoke("send-newsletter-confirmation", {
            body: { email: parsed.data },
          });
        } catch (err) {
          console.warn("[newsletter] confirmation email not sent yet", err);
        }
        toast.success("Vérifie ta boîte mail pour confirmer.");
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-32 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-6xl font-semibold text-foreground">
              Le Radar Léopards.
            </h1>
            <p className="mt-6 text-xl text-muted">
              Une édition. Tous les vendredis.
            </p>

            <form
              onSubmit={onSubmit}
              className="mx-auto mt-12 flex max-w-lg flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                disabled={submitting}
                className="flex-1 rounded-button border border-border bg-card px-5 py-4 text-foreground outline-none transition-colors focus:border-primary disabled:opacity-60"
              />
              <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi…
                  </span>
                ) : (
                  "S'abonner"
                )}
              </Button>
            </form>

            <p className="mt-4 text-sm text-muted">
              {count === null
                ? "Rejoins les fans"
                : count === 0
                  ? "Sois le premier abonné"
                  : `${count} abonné${count > 1 ? "s" : ""}`}{" "}
              · 0 spam · Se désabonner en 1 clic
            </p>
          </div>
        </section>

        <section className="container-site py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PREVIEWS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-card border border-border bg-card p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/30">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
