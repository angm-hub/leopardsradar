import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function Confidentialite() {
  return (
    <LegalPageLayout title="Confidentialité">
      <section>
        <h2 id="donnees">Données collectées</h2>
        <p>
          Léopards Radar collecte uniquement les données strictement nécessaires
          à la fourniture du service :
        </p>
        <ul>
          <li>Adresse email, lorsque tu t'inscris à la newsletter.</li>
          <li>Données de navigation anonymisées (analytics agrégés).</li>
        </ul>
      </section>

      <section>
        <h2 id="finalite">Finalité</h2>
        <ul>
          <li>Envoi de la newsletter hebdomadaire.</li>
          <li>Mesure d'audience pour améliorer le contenu et l'expérience.</li>
        </ul>
      </section>

      <section>
        <h2 id="base-legale">Base légale</h2>
        <ul>
          <li>Consentement explicite pour la newsletter.</li>
          <li>Intérêt légitime pour la mesure d'audience anonymisée.</li>
        </ul>
      </section>

      <section>
        <h2 id="conservation">Durée de conservation</h2>
        <p>
          Les emails sont conservés tant que tu restes abonné, puis effacés
          3 ans après ta dernière interaction avec la newsletter.
        </p>
      </section>

      <section>
        <h2 id="droits">Tes droits</h2>
        <p>
          Tu disposes d'un droit d'accès, de rectification, de suppression,
          d'opposition et de portabilité sur tes données. Pour les exercer,
          écris à{" "}
          <a href="mailto:contact@leopardsradar.com">contact@leopardsradar.com</a>.
        </p>
      </section>

      <section>
        <h2 id="hebergement">Hébergement et transferts</h2>
        <p>
          Les données sont stockées au sein de l'Union européenne (Supabase).
          Aucun transfert de données personnelles hors UE n'est effectué.
        </p>
      </section>

      <section>
        <h2 id="cookies">Cookies</h2>
        <p>
          Le site n'utilise aucun cookie tiers de tracking publicitaire. Si une
          mesure d'audience avec cookies est mise en place, un bandeau de
          consentement sera affiché.
        </p>
      </section>
    </LegalPageLayout>
  );
}
