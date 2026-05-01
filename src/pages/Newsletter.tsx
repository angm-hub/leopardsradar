import { Activity, Sparkles, Feather } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

const PREVIEWS = [
  {
    icon: Activity,
    title: "Performances internationaux",
    desc: "Comment tes Léopards ont joué ce week-end. Buts, assists, minutes, analyses.",
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

export default function Newsletter() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-32 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">
              Le Radar Léopards
            </span>
            <h1 className="mt-6 font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
              Une édition. Tous les vendredis.
            </h1>
            <p className="mt-6 text-xl text-muted-light max-w-xl mx-auto">
              Les performances de tes Léopards, un talent à surveiller, et
              l'analyse de la semaine. Soigné. Court. Gratuit.
            </p>

            <div className="mt-10 flex flex-col items-center">
              <NewsletterForm
                source="page"
                variant="full"
                buttonLabel="Recevoir l'édition du vendredi"
                placeholder="Ton email"
                helper="Une édition par semaine. Zéro spam. Désinscription en un clic."
              />
            </div>
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
