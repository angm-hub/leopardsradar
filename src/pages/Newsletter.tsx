import { Activity, Sparkles, Feather, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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

export default function Newsletter() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-32 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-mono uppercase tracking-[0.18em] text-primary"
              style={{ boxShadow: "0 0 0 1px hsl(var(--primary) / 0.15)" }}
            >
              <Clock className="h-3.5 w-3.5" />
              Newsletter · Bientôt disponible
            </span>
            <h1 className="mt-8 font-serif text-5xl md:text-6xl font-semibold text-foreground">
              Le Radar Léopards.
            </h1>
            <p className="mt-6 text-xl text-muted">
              Une édition. Tous les vendredis.
            </p>
            <p className="mt-8 text-base text-muted-light max-w-xl mx-auto leading-relaxed">
              On prépare une édition hebdo premium. Reviens à la date du premier
              match (17 juin) pour t'abonner.
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
