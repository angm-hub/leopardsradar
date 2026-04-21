import { Activity, Feather, Sparkles, Clock } from "lucide-react";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";

export function NewsletterSection() {
  return (
    <section className="relative py-24 md:py-32 bg-card overflow-hidden">
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
            Le Radar Léopards
          </span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Une édition. Tous les vendredis.
          </h2>
          <p className="mt-5 text-muted-light text-lg max-w-xl mx-auto leading-relaxed">
            Les performances de vos Léopards, un talent à surveiller, et
            l'analyse de la semaine. Soigné. Court. Gratuit.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {[
              { icon: Activity, label: "Performances hebdo" },
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

          <div className="mt-12 flex flex-col items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-mono uppercase tracking-[0.18em] text-primary"
              style={{ boxShadow: "0 0 0 1px hsl(var(--primary) / 0.15)" }}
            >
              <Clock className="h-3.5 w-3.5" />
              Newsletter · Bientôt disponible
            </span>
            <p className="text-xs text-muted">
              Une édition par semaine. Dès le lancement officiel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSection;
