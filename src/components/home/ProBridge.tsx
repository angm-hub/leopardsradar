import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Bridge discret home fan → page Pro B2B.
 *
 * Rend /pro découvrable depuis l'audience sans coller d'offre payante :
 * l'app n'a pas de flux de paiement aujourd'hui, donc pas de bouton
 * d'achat. Ici on invite le décideur (club / agence / fédération) vers
 * la page Pro, où le CTA est « demander une démo » (réel, par email).
 */
export default function ProBridge() {
  return (
    <section className="container-site py-14">
      <div className="surface-1 rounded-card p-8 flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:gap-8 md:text-left">
        <div>
          <p className="label-mono text-primary">Léopards Radar Pro</p>
          <h2 className="mt-2 display-heading text-2xl md:text-3xl text-foreground">
            Vous recrutez, placez ou sélectionnez ?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Tout le vivier congolais et binational, avec l'éligibilité de
            chacun vérifiée à la main. Pour les clubs, les agences et les
            fédérations.
          </p>
        </div>
        <Link
          to="/pro"
          className="inline-flex flex-none items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Découvrir Léopards Radar Pro <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
