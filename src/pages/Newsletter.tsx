import { useState, type FormEvent } from "react";
import { Activity, Sparkles, Feather } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";

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

const EDITIONS = [
  { date: "12 avr. 2026", title: "Wissa flambe à Newcastle, Sadiki déjà patron" },
  { date: "05 avr. 2026", title: "Le retour de Bolasie au Brésil, vrai signal ?" },
  { date: "29 mars 2026", title: "Mukau, l'avenir du milieu congolais" },
  { date: "22 mars 2026", title: "Top 5 des U23 à suivre cette saison" },
  { date: "15 mars 2026", title: "Mbemba : portrait d'un capitaine" },
  { date: "08 mars 2026", title: "Diaspora belge : qui peut basculer ?" },
];

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmail("");
    alert("Merci ! Première édition vendredi.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
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
                className="flex-1 rounded-button border border-border bg-card px-5 py-4 text-foreground outline-none transition-colors focus:border-primary"
              />
              <Button type="submit" variant="primary" size="lg">
                S'abonner
              </Button>
            </form>

            <p className="mt-4 text-sm text-muted">
              247 abonnés · 0 spam · Se désabonner en 1 clic
            </p>
          </div>
        </section>

        {/* Previews */}
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

        {/* Archive */}
        <section className="container-site py-16">
          <h2 className="mb-8 font-serif text-3xl text-foreground">
            Éditions précédentes.
          </h2>
          <ul className="flex flex-col gap-3">
            {EDITIONS.map((ed) => (
              <li key={ed.title}>
                <a
                  href="#"
                  className="flex items-center justify-between gap-4 rounded-card border border-border bg-card p-6 transition-colors hover:border-border-hover"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-muted">{ed.date}</span>
                    <span className="font-serif text-lg text-foreground">
                      {ed.title}
                    </span>
                  </div>
                  <span className="text-sm text-primary">Lire →</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
