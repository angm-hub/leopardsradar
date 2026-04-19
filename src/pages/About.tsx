import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-site pt-32 pb-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-12 font-serif text-6xl font-semibold text-foreground">
            Pourquoi Léopards Radar ?
          </h1>

          <div className="space-y-8 font-serif text-xl leading-[1.7] text-foreground/90">
            <p>
              Les infos sur nos Léopards sont éparpillées. Entre Transfermarkt,
              Wikipedia, trois podcasts et cinq threads X, il faut être archéologue
              pour se faire une idée. Léopards Radar, c'est un endroit unique. Fait
              main. Pour les fans.
            </p>
            <p>
              Ici, pas d'algorithme qui régurgite. Pas de stats pour les stats.
              Chaque joueur du Radar est vérifié avec 2 sources minimum. Chaque bio
              est écrite — pas générée. On préfère 20 fiches solides à 200
              approximatives.
            </p>
            <p>
              Notre pari : que la diaspora congolaise mérite un produit à la hauteur
              de sa passion. Premium. Soigné. Rigoureux. Le foot africain arrête de
              s'excuser.
            </p>
            <p>
              Aujourd'hui, les Léopards. Demain, peut-être d'autres nations
              africaines. Un jour à la fois. Un joueur à la fois.
            </p>
          </div>

          {/* Team */}
          <section className="mt-20">
            <h2 className="mb-8 font-serif text-3xl text-foreground">L'équipe.</h2>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 flex-none items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30">
                <span className="font-serif text-2xl font-bold text-primary">AS</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-2xl font-semibold text-foreground">
                  Alex Sango
                </h3>
                <p className="text-muted">Stratège IA, fondateur de kAIra</p>
                <p className="max-w-prose text-foreground/80 leading-relaxed">
                  15 ans en advertising entre France et Afrique. Je conseille les
                  marques qui veulent parler à la diaspora et au continent. Léopards
                  Radar est un projet personnel, construit avec les outils et les
                  convictions que je défends.
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <a href="#" className="text-primary hover:text-primary-hover">
                    LinkedIn
                  </a>
                  <a href="#" className="text-primary hover:text-primary-hover">
                    kAIra
                  </a>
                  <a href="#" className="text-primary hover:text-primary-hover">
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mt-20 rounded-card border border-border bg-card p-8">
            <h3 className="font-serif text-2xl text-foreground">Nous contacter.</h3>
            <p className="mt-3 text-foreground/80 leading-relaxed">
              Tu es journaliste, scout, créateur de contenu, supporter ? Écris-nous à{" "}
              <a
                href="mailto:contact@leopardsradar.com"
                className="text-primary hover:text-primary-hover"
              >
                contact@leopardsradar.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
