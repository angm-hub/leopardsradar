import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function MentionsLegales() {
  return (
    <LegalPageLayout title="Mentions légales">
      <section>
        <h2 id="editeur">Éditeur du site</h2>
        <p>
          Léopards Radar — média indépendant dédié au suivi des joueurs éligibles
          à la sélection de la République Démocratique du Congo.
        </p>
        <p>Adresse : à compléter.</p>
        <p>
          Contact : <a href="mailto:contact@leopardsradar.com">contact@leopardsradar.com</a>
        </p>
      </section>

      <section>
        <h2 id="publication">Directeur de publication</h2>
        <p>À compléter.</p>
      </section>

      <section>
        <h2 id="hebergement">Hébergement</h2>
        <p>
          Le site est hébergé sur l'infrastructure Lovable. La base de données et
          les services applicatifs sont opérés via Supabase (Union européenne).
        </p>
      </section>

      <section>
        <h2 id="propriete">Propriété intellectuelle</h2>
        <p>
          Tous les contenus éditoriaux (textes, analyses, classements, images
          originales) sont la propriété de Léopards Radar et protégés par les
          dispositions du Code de la propriété intellectuelle.
        </p>
        <p>
          Les données joueurs sont sourcées auprès de tiers publics (notamment
          Transfermarkt, FBref) et créditées dans les pages concernées.
        </p>
      </section>

      <section>
        <h2 id="responsabilite">Responsabilité</h2>
        <p>
          Les informations publiées sont fournies à titre indicatif. Léopards
          Radar ne saurait garantir l'exactitude absolue des données ou être tenu
          responsable d'une décision prise sur la base de ces informations.
        </p>
      </section>
    </LegalPageLayout>
  );
}
