import LegalLayout from "@/components/layout/LegalLayout";

export default function Cgu() {
  return (
    <LegalLayout
      title="Conditions générales d'utilisation"
      updatedAt="1er mai 2026"
    >
      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          1. Objet
        </h2>
        <p>
          Les présentes conditions générales (« CGU ») régissent l'accès et
          l'utilisation du site <strong>Léopards Radar</strong> (« le Site »),
          accessible à l'adresse{" "}
          <a
            href="https://angm-hub.github.io/leopardsradar/"
            className="text-primary hover:underline"
            rel="noopener"
          >
            angm-hub.github.io/leopardsradar
          </a>{" "}
          et ses sous-chemins éventuels.
        </p>
        <p>
          En accédant au Site, tu reconnais avoir lu et accepté ces conditions.
          Si tu n'es pas d'accord, n'utilise pas le Site.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          2. Description du service
        </h2>
        <p>
          Léopards Radar est un service éditorial qui agrège et analyse les
          données publiques relatives aux joueurs éligibles à la sélection
          nationale de la République Démocratique du Congo (« les Léopards »),
          notamment :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Le roster des joueurs actifs en sélection</li>
          <li>Le radar des joueurs éligibles via leur diaspora</li>
          <li>Une composition Best XI éditoriale hebdomadaire</li>
          <li>Une newsletter hebdomadaire d'analyse</li>
          <li>L'outil « Ma Liste » de composition de l'effectif des 26</li>
        </ul>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          3. Accès au service
        </h2>
        <p>
          L'accès au Site est gratuit et ouvert à toute personne disposant d'un
          accès à internet. Aucune inscription n'est requise pour la consultation
          des contenus. L'inscription à la newsletter et l'utilisation de « Ma
          Liste » sont également gratuites.
        </p>
        <p>
          On s'efforce d'assurer la disponibilité du Site 24h/24, sans garantie
          d'absence d'interruption pour maintenance, mise à jour ou cas de force
          majeure.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          4. Comportements interdits
        </h2>
        <p>Tu t'engages à ne pas :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Reproduire, copier, vendre ou exploiter commercialement tout ou
            partie du Site sans accord écrit
          </li>
          <li>
            Effectuer du scraping massif ou automatisé des données du Site
          </li>
          <li>
            Tenter de contourner les mesures techniques de protection
          </li>
          <li>
            Introduire un virus, malware ou code malveillant
          </li>
          <li>
            Utiliser le Site pour diffuser des contenus illicites, haineux,
            diffamatoires ou portant atteinte aux droits des joueurs cités
          </li>
        </ul>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          5. Données et exactitude
        </h2>
        <p>
          Les informations publiées sur le Site sont fournies à titre
          informatif. Bien qu'on apporte un soin particulier à leur vérification,
          aucune garantie absolue d'exactitude ou d'exhaustivité n'est donnée.
          Pour toute correction, écrire à{" "}
          <a
            href="mailto:alexandre@withkaira.com"
            className="text-primary hover:underline"
          >
            alexandre@withkaira.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          6. Propriété intellectuelle
        </h2>
        <p>
          Voir les{" "}
          <a
            href="/mentions-legales"
            className="text-primary hover:underline"
          >
            mentions légales
          </a>
          . Toute utilisation des contenus éditoriaux nécessite un accord écrit
          préalable.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          7. Données personnelles
        </h2>
        <p>
          Le traitement des données personnelles est régi par la{" "}
          <a
            href="/confidentialite"
            className="text-primary hover:underline"
          >
            politique de confidentialité
          </a>
          .
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          8. Responsabilité
        </h2>
        <p>
          L'éditeur ne peut être tenu pour responsable des conséquences directes
          ou indirectes liées à l'utilisation des informations du Site, ni des
          interruptions de service, ni des contenus de sites tiers vers lesquels
          des liens pourraient renvoyer.
        </p>
      </section>

      <section className="space-y-3 mb-10">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          9. Modification des CGU
        </h2>
        <p>
          Ces CGU peuvent être modifiées à tout moment. La version en vigueur est
          celle accessible en ligne à la date de ta visite. Les modifications
          substantielles seront notifiées par email aux abonnés newsletter.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="display-heading text-2xl text-foreground mt-0 mb-4">
          10. Droit applicable
        </h2>
        <p>
          Les CGU sont régies par le droit français. En cas de litige, et après
          tentative de résolution amiable, les tribunaux français sont
          compétents.
        </p>
      </section>
    </LegalLayout>
  );
}
