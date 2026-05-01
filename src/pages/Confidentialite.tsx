import LegalLayout from "@/components/layout/LegalLayout";

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="1er mai 2026">
      <section className="space-y-3 mb-10">
        <p className="text-muted-light italic">
          Léopards Radar prend la protection de tes données personnelles au
          sérieux. Cette politique explique simplement ce qu'on collecte, à quoi
          ça sert, et comment exercer tes droits.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Responsable du traitement
        </h2>
        <p>
          Alexandre Ngomo (kAIra), éditeur du site Léopards Radar. Voir les{" "}
          <a
            href="/mentions-legales"
            className="text-primary hover:underline"
          >
            mentions légales
          </a>{" "}
          pour les coordonnées.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Données collectées
        </h2>

        <div>
          <h3 className="font-serif text-lg text-foreground mb-2">Newsletter</h3>
          <p>
            Lorsque tu t'abonnes à la newsletter, on collecte uniquement ton{" "}
            <strong>adresse email</strong> et la <strong>source</strong> de
            l'inscription (page d'origine), avec les dates d'inscription, de
            confirmation et de désinscription le cas échéant.
          </p>
          <p className="text-sm text-muted-light mt-2">
            Finalité : t'envoyer l'édition hebdomadaire du Radar Léopards.
            <br />
            Base légale : ton consentement explicite (case d'inscription +
            confirmation par email).
          </p>
        </div>

        <div>
          <h3 className="font-serif text-lg text-foreground mb-2">
            Mesure d'audience
          </h3>
          <p>
            On utilise les outils d'analyse fournis par Lovable et par notre
            hébergeur pour comprendre comment le site est consulté (pages vues,
            durée de session, type d'appareil, pays). Ces données sont
            anonymisées et agrégées.
          </p>
          <p className="text-sm text-muted-light mt-2">
            Finalité : améliorer le produit et l'éditorial.
            <br />
            Base légale : intérêt légitime de l'éditeur (article 6.1.f RGPD),
            avec opt-out possible via les réglages de ton navigateur.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-lg text-foreground mb-2">
            « Ma Liste » et compositions partagées
          </h3>
          <p>
            Lorsque tu composes ta liste des 26 et que tu la partages, le contenu
            de la liste (joueurs sélectionnés, formation, capitaine, pseudo
            optionnel) est stocké dans notre base. Aucune donnée d'identification
            personnelle n'est requise pour utiliser cette fonctionnalité.
          </p>
        </div>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Durée de conservation
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Newsletter</strong> : tant que tu es abonné, plus 36 mois
            après ta désinscription pour la traçabilité du consentement.
          </li>
          <li>
            <strong>Données analytics</strong> : 14 mois maximum, conformément
            aux recommandations de la CNIL.
          </li>
          <li>
            <strong>Listes partagées</strong> : conservées tant que la liste est
            consultée, supprimables sur demande.
          </li>
        </ul>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Tes droits
        </h2>
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, tu disposes
          des droits suivants :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Accès à tes données</li>
          <li>Rectification</li>
          <li>Suppression (droit à l'oubli)</li>
          <li>Limitation du traitement</li>
          <li>Opposition</li>
          <li>Portabilité</li>
          <li>Retrait du consentement à tout moment</li>
        </ul>
        <p className="mt-4">
          Pour exercer ces droits, écris à{" "}
          <a
            href="mailto:contact@leopardsradar.com"
            className="text-primary hover:underline"
          >
            contact@leopardsradar.com
          </a>
          . Réponse sous 30 jours maximum.
        </p>
        <p className="text-sm text-muted-light">
          Pour la newsletter, chaque édition contient un lien de désinscription
          en un clic.
        </p>
        <p>
          En cas de désaccord, tu peux saisir la{" "}
          <a
            href="https://www.cnil.fr/"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            CNIL
          </a>
          .
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Sous-traitants et destinataires
        </h2>
        <p>
          Tes données ne sont jamais vendues. Elles sont traitées uniquement par
          les sous-traitants suivants, choisis pour leur conformité RGPD :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Supabase</strong> — base de données et authentification
          </li>
          <li>
            <strong>Lovable</strong> — hébergement et analytics anonymisés
          </li>
        </ul>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Cookies
        </h2>
        <p>
          Le site utilise uniquement les cookies strictement nécessaires à son
          fonctionnement (session, préférences). Aucun cookie publicitaire ou de
          tracking tiers n'est déposé.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-foreground mt-0 mb-4">
          Mises à jour
        </h2>
        <p>
          Cette politique peut évoluer. Toute mise à jour majeure sera notifiée
          par email aux abonnés newsletter et signalée en haut de cette page.
        </p>
      </section>
    </LegalLayout>
  );
}
