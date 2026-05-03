import { Link } from "react-router-dom";
import { Activity, Feather, Sparkles, ArrowRight } from "lucide-react";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

/**
 * NewsletterSection — promesse alignée sur la cadence data.
 *
 * Avant : "Tous les vendredis" (incohérent avec hero "chaque dimanche").
 * Après : "Dimanche soir, 21 h" — match l'horaire réel de refresh data
 * (cron pg_cron sur Supabase tourne le dimanche soir UTC) et donne au
 * lecteur une raison précise de s'abonner ("le récap du week-end").
 *
 * Le compteur d'abonnés est intentionnellement absent : avec 0 abonnés,
 * l'afficher est anti-conversion. Le proof se fait via le teaser "Aperçu
 * d'une édition" qui renvoie vers Histoires (contenu déjà publié).
 */
export function NewsletterSection() {
  return (
    <section
      id="newsletter"
      className="relative py-16 md:py-20 bg-card overflow-hidden scroll-mt-24"
    >
      <StrongGradient intensity={0.95} position="flow" />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-[0.03] text-foreground"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="container-site relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">
            Le Récap Léopards
          </span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Le récap du dimanche soir.
          </h2>
          <p className="mt-5 text-muted-light text-lg max-w-xl mx-auto leading-relaxed">
            Performances du week-end, un talent surveillé, l'analyse de la
            semaine. <span className="text-foreground/85">6 minutes de
            lecture, livrées le dimanche à 21 h.</span> Gratuit.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {[
              { icon: Activity, label: "Performances week-end" },
              { icon: Sparkles, label: "Un talent surveillé" },
              { icon: Feather, label: "L'analyse de la semaine" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 text-sm text-foreground/80"
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center">
            <NewsletterForm
              source="section"
              variant="full"
              buttonLabel="Recevoir l'édition du dimanche"
              placeholder="Ton email"
              helper="Une édition par semaine. Zéro spam. Désinscription en un clic."
            />
          </div>

          <Link
            to="/histoires"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            Voir un aperçu d'édition
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSection;
