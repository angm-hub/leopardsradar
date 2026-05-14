import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  MissionVisual,
  MethodVisual,
  IndependanceVisual,
  EditeurVisual,
} from "@/components/about/AboutSectionVisuals";

export default function About() {
  useDocumentMeta({
    title: "À propos",
    description:
      "Léopards Radar — média indépendant édité par Cobalt Sports & Entertainment. Data + curation + analyse sur le vivier congolais.",
  });
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

          {/* H1 différencié de la home (qui dit déjà la promesse). Ici on est
              sur le projet : qui le fait, comment, pourquoi. Le H1 doit
              annoncer ce qu'on va lire, pas répéter le pitch. */}
          <h1 className="mt-4 font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
            Le projet.
          </h1>
          <p className="mt-6 font-serif text-xl leading-[1.6] text-foreground/80 max-w-2xl">
            Un média indépendant qui trace tout le vivier congolais. Roster RDC,
            diaspora éligible, statut FIFA — sourcé, structuré, mis à jour
            chaque dimanche.
          </p>

          {/* La mission */}
          <section className="mt-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
              01 — La mission
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              La source de référence sur le vivier congolais.
            </h2>
            <MissionVisual />
            <div className="space-y-5 text-lg leading-[1.75] text-foreground/85">
              <p>
                Léopards Radar trace l'intégralité du vivier congolais : roster actif,
                diaspora éligible selon l'<strong className="text-foreground">article 9 FIFA</strong>,
                joueurs en formation, binationaux à instruire. On documente chaque trajectoire — du
                Tout-Puissant Mazembe à Manchester, de Kinshasa à Bruxelles.
              </p>
              <p>
                On fait de la data, du scouting et de l'analyse. Pas de hype, pas de remplissage.
                L'idée : qu'un fan congolais à Paris, Montréal ou Lubumbashi puisse savoir
                exactement qui joue où, qui peut être convoqué, et qui mérite un appel.
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
            <MethodVisual />
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

          {/* Indépendance — pose le pacte sans personnaliser l'auteur.
              Voix factuelle anonyme : le projet parle de lui-même, pas
              d'une personne. */}
          <section className="mt-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
              03 — Indépendance
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              Pas affilié. Pas commandité. Pas négociable.
            </h2>
            <IndependanceVisual />
            <div className="space-y-5 text-lg leading-[1.75] text-foreground/85">
              <p>
                Léopards Radar est un projet <strong className="text-foreground">indépendant</strong>{" "}
                et non affilié. Aucun lien avec la FECOFA. Aucun arrangement
                commercial avec un club, un agent ou un joueur. Aucune publicité.
                Le seul lien avec le monde du foot RDC, c'est la passion qui
                anime le projet.
              </p>
              <p>
                <strong className="text-foreground">Le pacte :</strong> mise à jour
                chaque dimanche soir, sources ouvertes (Transfermarkt, presse
                spécialisée, football-data.org), méthodologie publiée. Si une
                donnée vous semble erronée, un joueur manquant, une statistique
                à corriger : signalez-le, c'est traité à l'édition suivante.
              </p>
              <p>
                <strong className="text-foreground">Contact :</strong>{" "}
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

          {/* Signature institutionnelle — pas de nom personnel : la maison
              mère assume seule. Crédibilité = structure éditoriale claire,
              pas une signature individuelle. */}
          <section className="mt-20 border-t border-border pt-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-4">
              04 — Qui édite Léopards Radar
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              Édité par Cobalt Sports & Entertainment.
            </h2>
            <EditeurVisual />
            <div className="space-y-5 text-lg leading-[1.75] text-foreground/85">
              <p>
                Léopards Radar est édité par{" "}
                <strong className="text-foreground">Cobalt Sports &
                Entertainment</strong>, studio indépendant basé à Paris.
                On construit des médias et des outils éditoriaux autour du
                sport, de la musique et de la culture africaine.
              </p>
              <p>
                Léopards Radar est notre premier produit ouvert au public
                — d'autres suivront, dans la même logique : data sourcée,
                voix éditoriale claire, zéro hype.
              </p>
              <p className="text-base text-muted-light">
                Pour toute question éditoriale, partenariat presse ou
                proposition de source : <a
                  href="mailto:contact@leopardsradar.com"
                  className="text-primary hover:text-primary-hover underline underline-offset-4"
                >
                  contact@leopardsradar.com
                </a>.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
