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

          {/* Qui écrit ce truc — page signée pour casser l'anonymat éditorial.
              Avant : "par des fans, pour des fans" (générique, zéro confiance).
              Après : nom, visage, contexte, pacte de cadence, contact direct. */}
          <section className="mt-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
              03 — Qui écrit ce truc
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">
              Un projet signé. Un seul auteur.
            </h2>

            <div className="flex items-start gap-5 mb-8">
              <div
                aria-hidden
                className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-serif text-3xl flex items-center justify-center font-semibold shadow-lg shadow-primary/20"
              >
                AN
              </div>
              <div>
                <div className="font-serif text-2xl text-foreground">
                  Alexandre Ngomo
                </div>
                <div className="mt-1 text-sm text-muted-light">
                  Diaspora RDC · Paris · Auteur, éditeur, dev
                </div>
              </div>
            </div>

            <div className="space-y-5 text-lg leading-[1.75] text-foreground/85">
              <p>
                Je suis fan des Léopards depuis toujours. Diaspora congolaise à
                Paris, je suis passé par le marketing tech, la production data
                et le studio. Léopards Radar est né d'un constat simple : aucun
                outil n'existait pour suivre <strong className="text-foreground">tous</strong> les
                Léopards et leur diaspora éligible avec rigueur. J'en avais besoin
                comme fan. Je l'ai construit.
              </p>
              <p>
                <strong className="text-foreground">Le pacte :</strong> mise à jour
                chaque dimanche soir, sources ouvertes (Transfermarkt, presse
                spécialisée, football-data.org), méthodologie publiée, et
                indépendance totale. Aucune affiliation FECOFA, aucun lien
                commercial avec un club, un agent ou un joueur. Si tu repères une
                erreur, un joueur manquant ou une donnée à corriger, écris-moi —
                je réponds.
              </p>
              <p>
                <strong className="text-foreground">Contact direct :</strong>{" "}
                <a
                  href="mailto:contact@leopardsradar.com"
                  className="text-primary hover:text-primary-hover underline underline-offset-4"
                >
                  contact@leopardsradar.com
                </a>
                . Pour les journalistes, scouts, recruteurs, fédérations — même
                adresse, je remonte la file.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
