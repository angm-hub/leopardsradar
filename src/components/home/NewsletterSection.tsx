import { Link } from "react-router-dom";
import { Activity, Feather, Sparkles, ArrowRight } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

/**
 * NewsletterSection — promesse alignée sur la cadence data.
 *
 * Avant : "Tous les vendredis" (incohérent avec hero "chaque dimanche").
 * Après : "Dimanche soir, 21 h" — match l'horaire réel de refresh data
 * (cron pg_cron sur Supabase tourne le dimanche soir UTC) et donne au
 * lecteur une raison précise de s'abonner ("le récap du week-end").
 *
 * Polish DA Cobalt 2026-05-15 : remplace StrongGradient (legacy) par
 * atmos-torch + grain — moment cinématique de clôture, jaune dimanche
 * soir cohérent avec la promesse "récap du week-end". L'eyebrow passe à
 * label-mono text-torch (heritage palette) et le H2 à display-heading.
 */
export function NewsletterSection() {
  return (
    <section
      id="newsletter"
      className="relative py-16 md:py-20 overflow-hidden scroll-mt-24"
    >
      {/* Atmos-torch : jaune dimanche soir + cobalt deep — cinéma. */}
      <div aria-hidden className="absolute inset-0 atmos-torch opacity-90" />

      {/* Grain texture — cohérent avec hero + Heritage */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.22]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette pour focaliser le formulaire au centre */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 50% 50%, transparent 30%, rgba(5,11,26,0.55) 100%)",
        }}
      />

      {/* Grid pattern subtil au-dessus de l'atmosphère — texture éditoriale */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-[0.04] text-foreground"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="container-site relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="label-mono text-torch">
            Le Récap Léopards
          </span>
          <h2 className="mt-4 display-heading text-4xl md:text-5xl text-foreground text-balance">
            Le récap du dimanche soir.
          </h2>
          <p className="mt-5 text-foreground/75 text-lg max-w-xl mx-auto leading-relaxed">
            Performances du week-end, un talent surveillé, l'analyse de la
            semaine. <span className="text-foreground">6 minutes de
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
