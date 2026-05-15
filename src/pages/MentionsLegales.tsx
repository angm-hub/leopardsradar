import LegalLayout from "@/components/layout/LegalLayout";

/**
 * MentionsLegales — version 2026-05-15.
 *
 * Sprint 1.2 du brief Léopards Radar v3 : nettoyage des placeholders dev-mode
 * "[à compléter]". Disclosure honnête : éditeur en nom propre via la marque
 * Cobalt Sports & Entertainment, structure non encore immatriculée.
 *
 * Conformité LCEN (loi pour la confiance dans l'économie numérique) : pour un
 * éditeur non professionnel et personne physique, l'identité complète peut
 * rester anonyme dans les mentions PUBLIQUES si elle est communiquée à
 * l'hébergeur (GitHub) — mais on choisit ici la transparence (Alexandre Ngomo
 * est déjà identifié dans toute la communication publique du projet, sur
 * About et dans la presse).
 *
 * À mettre à jour quand :
 *   - La structure juridique est officiellement enregistrée (SIREN attribué)
 *   - Une boîte mail alexandre@withkaira.com est opérationnelle
 *   - L'adresse postale officielle est définie
 */
export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="15 mai 2026">
      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          Éditeur du site
        </h2>
        <p>
          Le site <strong>Léopards Radar</strong> (ci-après « le Site ») est
          édité par <strong>Alexandre Ngomo</strong>, personne physique, sous
          la marque <strong>Cobalt Sports &amp; Entertainment</strong>.
        </p>
        <p className="text-muted-light">
          Structure éditoriale indépendante basée à Paris (France).
          Immatriculation officielle en cours — toute mise à jour figurera
          dans cette page sous la rubrique « Dernière mise à jour ».
        </p>
        <p>
          Contact :{" "}
          <a
            href="mailto:alexandre@withkaira.com"
            className="text-primary hover:underline"
          >
            alexandre@withkaira.com
          </a>
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          Directeur de la publication
        </h2>
        <p>
          <strong>Alexandre Ngomo</strong> — joignable à l'adresse électronique
          de contact ci-dessus.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          Hébergement
        </h2>
        <p>
          Le front-end du Site est hébergé par <strong>GitHub, Inc.</strong>{" "}
          (88 Colin P. Kelly Jr St, San Francisco, CA 94107, USA) via le service
          GitHub Pages. Le code source est publié à l'adresse{" "}
          <a
            href="https://github.com/angm-hub/leopardsradar"
            className="text-primary hover:underline"
            rel="noopener"
          >
            github.com/angm-hub/leopardsradar
          </a>
          .
        </p>
        <p>
          La base de données et les services associés sont hébergés par{" "}
          <strong>Supabase Inc.</strong> (970 Toa Payoh North, Singapore 318992)
          dans la région Europe Ouest (eu-west-1).
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          Propriété intellectuelle
        </h2>
        <p>
          L'ensemble des contenus éditoriaux du Site (textes, mises en page,
          analyses, charte graphique) est la propriété exclusive de Léopards
          Radar, sauf mention contraire. Toute reproduction, représentation,
          modification ou exploitation sans autorisation écrite est interdite.
        </p>
        <p>
          Les données joueurs sont agrégées à partir de sources publiques
          (clubs, fédérations, presse spécialisée, Transfermarkt, FBRef,
          Wikidata). Chaque profil cite ses sources lorsqu'elles sont publiques.
        </p>
        <p>
          Les noms, logos et marques cités sur le Site appartiennent à leurs
          propriétaires respectifs. Leur mention n'implique aucun lien de
          partenariat ou d'affiliation.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          Crédits photo
        </h2>
        <p>
          Les photos de joueurs sont la propriété de leurs auteurs et clubs
          respectifs. Elles sont utilisées dans un cadre éditorial et
          informationnel. Pour toute demande de retrait, contacter{" "}
          <a
            href="mailto:alexandre@withkaira.com"
            className="text-primary hover:underline"
          >
            alexandre@withkaira.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          Données personnelles
        </h2>
        <p>
          Le traitement des données personnelles est détaillé dans la{" "}
          <a
            href="/confidentialite"
            className="text-primary hover:underline"
          >
            politique de confidentialité
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
