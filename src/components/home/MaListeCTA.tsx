import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";

export function MaListeCTA() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <StrongGradient position="center" intensity={1} />
      <div className="container-site max-w-3xl text-center relative z-10">
        <span className="inline-block font-mono text-[11px] uppercase tracking-[0.25em] text-primary border border-primary/30 rounded-full px-3 py-1 bg-primary/5">
          NOUVEAU · MONDIAL 2026
        </span>
        <h2 className="mt-6 font-serif text-4xl md:text-5xl text-foreground leading-tight">
          Et toi, ta{" "}
          <span className="text-primary italic">liste des 26</span> ?
        </h2>
        <p className="mt-4 text-muted-light text-base md:text-lg max-w-xl mx-auto">
          Compose ta sélection Léopards pour le Mondial 2026. Compare aux
          autres fans. Partage.
        </p>
        <Link
          to="/ma-liste"
          className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 bg-primary text-primary-foreground rounded-button font-medium hover:bg-primary/90 transition-colors"
        >
          Composer ma liste
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default MaListeCTA;
