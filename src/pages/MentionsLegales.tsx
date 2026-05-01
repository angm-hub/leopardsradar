import LegalLayout from "@/components/layout/LegalLayout";

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="1er mai 2026">
      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Éditeur du site
        </h2>
        <p>
          Le site <strong>Léopards Radar</strong> (ci-après « le Site ») est édité
          par Alexandre Ngomo, opérant sous le studio kAIra.
        </p>
        <p>
          <span className="text-muted-light">
            Adresse : [adresse à compléter]
            <br />
            Statut juridique : [statut à compléter]
            <br />
            SIREN : [numéro à compléter]
          </span>
        </p>
        <p>
          Contact :{" "}
          <a
            href="mailto:contact@leopardsradar.com"
            className="text-primary hover:underline"
          >
            contact@leopardsradar.com
          </a>
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Directeur de la publication
        </h2>
        <p>Alexandre Ngomo.</p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Hébergement
        </h2>
        <p>
          Le Site est hébergé par <strong>Lovable</strong> (lovable.dev) pour le
          front-end et par <strong>Supabase Inc.</strong> (970 Toa Payoh North,
          Singapore 318992) pour la base de données et les services associés. Les
          données sont stockées dans la région Europe (eu-central-1) ou
          équivalent.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Propriété intellectuelle
        </h2>
        <p>
          L'ensemble des contenus éditoriaux du Site (textes, mises en page,
          analyses, charte graphique) est la propriété exclusive de Léopards
          Radar, sauf mention contraire. Toute reproduction, représentation,
          modification ou exploitation sans autorisation écrite est interdite.
        </p>
        <p>
          Les données joueurs sont agrégées à partir de sources publiques (clubs,
          fédérations, presse spécialisée, Transfermarkt). Chaque profil cite ses
          sources lorsqu'elles sont publiques.
        </p>
        <p>
          Les noms, logos et marques cités sur le Site appartiennent à leurs
          propriétaires respectifs. Leur mention n'implique aucun lien de
          partenariat ou d'affiliation.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Crédits photo
        </h2>
        <p>
          Les photos de joueurs sont la propriété de leurs auteurs et clubs
          respectifs. Elles sont utilisées dans un cadre éditorial et
          informationnel. Pour toute demande de retrait, contacter{" "}
          <a
            href="mailto:contact@leopardsradar.com"
            className="text-primary hover:underline"
          >
            contact@leopardsradar.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
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
