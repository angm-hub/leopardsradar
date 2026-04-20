import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container-site pt-32 pb-24">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">À propos</span>
          </nav>

          <h1 className="mt-4 font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
            À propos de Léopards Radar.
          </h1>
          <p className="mt-6 font-serif text-xl leading-[1.6] text-foreground/80 max-w-2xl">
            Un site indépendant pour suivre les Léopards de la République Démocratique du Congo —
            roster, radar, diaspora — avec rigueur, données et amour du jeu.
          </p>

          {/* La mission */}
          <section className="mt-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
              01 — La mission
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              Tracer la route vers le Mondial 2026.
            </h2>
            <div className="space-y-5 text-lg leading-[1.75] text-foreground/85">
              <p>
                Léopards Radar traque les <strong className="text-foreground">26 joueurs</strong> qui
                porteront le maillot de la RDC au Mondial 2026. On suit le roster actif convoqué par
                le sélectionneur, on cartographie la diaspora binationale éligible selon
                l'<strong className="text-foreground">article 9 FIFA</strong>, et on documente chaque
                trajectoire — du Tout-Puissant Mazembe à Manchester, de Kinshasa à Bruxelles.
              </p>
              <p>
                On parle data, scouting, diaspora et projection. Pas de hype, pas de remplissage.
                L'idée : qu'un fan congolais à Paris, Montréal ou Lubumbashi sache exactement qui
                joue où, qui peut être convoqué, et qui mérite un appel.
              </p>
            </div>
          </section>

          {/* La méthode */}
          <section className="mt-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
              02 — La méthode
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              Sources vérifiées, règles FIFA appliquées.
            </h2>
            <div className="space-y-5 text-lg leading-[1.75] text-foreground/85">
              <p>
                Les données viennent de <strong className="text-foreground">Transfermarkt</strong>,
                enrichies à la main : valeur marchande, club, contrat, sélections. Chaque profil est
                croisé avec au moins une source secondaire (presse spécialisée, fédérations,
                feuilles de match) avant publication.
              </p>
              <p>
                On applique strictement l'<strong className="text-foreground">article 9 du règlement
                FIFA (révision 2020)</strong> sur le changement d'association. Un joueur qui a
                disputé un match A senior officiel d'une autre nation est marqué{" "}
                <em className="text-foreground">cap-tied</em> et exclu du Radar. On distingue trois
                statuts : <strong className="text-foreground">roster</strong> (déjà international
                RDC), <strong className="text-foreground">radar</strong> (éligible, pas encore
                convoqué), <strong className="text-foreground">heritage</strong> (ascendance RDC à
                explorer). Mise à jour <strong className="text-foreground">hebdomadaire</strong>.
              </p>
            </div>
          </section>

          {/* L'équipe */}
          <section className="mt-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
              03 — L'équipe
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              Par des fans, pour des fans.
            </h2>
            <div className="space-y-5 text-lg leading-[1.75] text-foreground/85">
              <p>
                Léopards Radar est un projet <strong className="text-foreground">indépendant</strong>,
                fait par des fans congolais pour des fans congolais. Aucune affiliation avec la
                FECOFA, aucun lien commercial avec un club, un agent ou un joueur. Journalistes,
                scouts, passionnés ou supporters : pour toute demande, écrire à{" "}
                <a
                  href="mailto:contact@leopardsradar.com"
                  className="text-primary hover:text-primary-hover underline underline-offset-4"
                >
                  contact@leopardsradar.com
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
