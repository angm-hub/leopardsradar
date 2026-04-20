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

          {/* Approche */}
          <section className="mt-20">
            <h2 className="mb-8 font-serif text-3xl text-foreground">L'approche.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  k: "Vérifié",
                  v: "Chaque profil croisé avec au moins 2 sources publiques.",
                },
                {
                  k: "Sourcé",
                  v: "Transfermarkt, fédérations, presse spécialisée. Jamais d'à-peu-près.",
                },
                {
                  k: "Éditorial",
                  v: "Pas de bio générée à la chaîne. Un regard, des choix, un parti-pris.",
                },
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-card border border-border bg-card p-6"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    {item.k}
                  </p>
                  <p className="mt-3 text-foreground/85 leading-relaxed">{item.v}</p>
                </div>
              ))}
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
