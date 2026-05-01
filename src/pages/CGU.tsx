import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function CGU() {
  return (
    <LegalPageLayout title="Conditions générales d'utilisation">
      <section>
        <h2 id="objet">Objet</h2>
        <p>
          Les présentes conditions définissent les modalités d'accès et
          d'utilisation du site Léopards Radar.
        </p>
      </section>

      <section>
        <h2 id="service">Service</h2>
        <p>
          Léopards Radar agrège et éditorialise des données publiques relatives
          aux joueurs éligibles à la sélection nationale de la République
          Démocratique du Congo (roster actuel et talents éligibles).
        </p>
      </section>

      <section>
        <h2 id="disponibilite">Disponibilité</h2>
        <p>
          Le service est mis à disposition sans engagement de disponibilité 24/7.
          Les données sont mises à jour de manière hebdomadaire.
        </p>
      </section>

      <section>
        <h2 id="usage">Comportements interdits</h2>
        <ul>
          <li>Scraping massif ou automatisé du contenu.</li>
          <li>
            Reproduction, revente ou exploitation commerciale sans accord écrit
            préalable.
          </li>
          <li>Toute action visant à compromettre la sécurité du service.</li>
        </ul>
      </section>

      <section>
        <h2 id="responsabilite">Responsabilité</h2>
        <p>
          Les données et analyses sont fournies à titre informatif. Léopards
          Radar ne garantit pas l'exactitude absolue des informations publiées
          et ne saurait être tenu responsable d'une décision prise sur leur
          base.
        </p>
      </section>

      <section>
        <h2 id="modifications">Modification des CGU</h2>
        <p>
          Les présentes conditions peuvent être modifiées unilatéralement. Toute
          modification substantielle fera l'objet d'une notification visible sur
          le site.
        </p>
      </section>
    </LegalPageLayout>
  );
}
