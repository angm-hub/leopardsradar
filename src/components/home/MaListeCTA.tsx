import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * MaListeCTA — push conversion Mondial 2026.
 *
 * Polish DA Cobalt 2026-05-15 : remplace StrongGradient legacy par
 * atmos-dawn (cobalt + soft star — la teinte aube pile entre serieux
 * et signal de nouveaute). Eyebrow passe à label-mono text-cobalt-mist
 * (DA brand vs primary), H2 à display-heading.
 */
export function MaListeCTA() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      {/* Atmosphère dawn : cobalt + halo Star, signal nouveauté/Mondial */}
      <div aria-hidden className="absolute inset-0 atmos-dawn opacity-95" />

      {/* Grain texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.20]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette pour focaliser le CTA central */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 50% 50%, transparent 30%, rgba(5,11,26,0.55) 100%)",
        }}
      />

      <div className="container-site max-w-3xl text-center relative z-10">
        <span className="inline-flex items-center gap-2 label-mono-sm text-primary border border-primary/30 rounded-full px-3 py-1 bg-primary/10">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
          Nouveau · Mondial 2026
        </span>
        <h2 className="mt-6 display-heading text-4xl md:text-5xl text-foreground">
          Et toi, ta{" "}
          <span className="italic text-primary">liste des 26</span> ?
        </h2>
        <p className="mt-4 text-foreground/70 text-base md:text-lg max-w-xl mx-auto">
          Compose ta sélection Léopards pour le Mondial 2026. Compare aux
          autres fans. Partage.
        </p>
        <Link
          to="/ma-liste"
          className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 bg-primary text-primary-foreground rounded-button font-medium hover:bg-primary-hover transition-colors"
        >
          Composer ma liste
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default MaListeCTA;
