import { Link } from "react-router-dom";
import { ArrowRight, Quote } from "lucide-react";
import { ResidualGradient } from "@/components/ui/GradientBackgrounds";
import { useBestXI } from "@/hooks/useBestXI";

/**
 * BestXIPreviewSection — promotion home du Best XI Diaspora.
 *
 * Refonte audit éditorial :
 *   - Avant : copy générique "On fait l'exercice tous les vendredis" + liste
 *     11 joueurs sans contexte, dans un BrowserFrame de mockup → UI/promo
 *     plus que produit.
 *   - Après : la composition s'affiche dans la home elle-même, avec la
 *     note éditoriale stockée en BDD mise en valeur en citation. Le visiteur
 *     voit le produit, pas une preview du produit.
 *
 * La note éditoriale (champ `editorial_note` de la table best_xi) est ce
 * qui sépare une compo automatique d'un avis. Elle est rédigée à chaque
 * édition et stockée en BDD — la voix reste anonyme (pas de signature),
 * c'est "Léopards Radar" qui parle.
 */
export function BestXIPreviewSection() {
  const { data, loading } = useBestXI();

  return (
    <section className="relative bg-card/30 py-16 md:py-24 border-y border-border/50">
      <ResidualGradient position="top-bottom" />
      <div className="container-site relative">
        <div className="mb-10 max-w-2xl">
          <p className="label-mono text-cobalt-mist mb-3">
            Best XI Diaspora
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-foreground text-balance">
            Le onze de la semaine.
          </h2>
          <p className="mt-4 text-muted-light text-base md:text-lg leading-relaxed">
            Roster + diaspora éligible confondus. La meilleure composition
            possible des Léopards si le coup d'envoi du Mondial était demain.
            Recomposée chaque dimanche soir.
          </p>
        </div>

        {loading ? (
          <BestXISkeleton />
        ) : !data ? (
          <BestXIEmpty />
        ) : (
          // Refonte audit Sprint 1 (mai 2026) : on a retiré la liste verticale
          // des 11 joueurs (qui doublait /best-xi sur la home). On garde le
          // signal éditorial fort — la note + la formation + un CTA — pour
          // pousser vers la page dédiée. Hauteur passée de ~1080 px à ~480 px.
          <div className="max-w-3xl mx-auto text-center">
            <div className="label-mono-sm text-muted mb-6">
              Édition · {formatPublishedDate(data.published_at)} ·{" "}
              <span className="text-cobalt-mist">{data.formation}</span>
            </div>
            {data.editorial_note ? (
              <blockquote className="relative">
                <Quote
                  className="absolute -left-2 -top-2 h-10 w-10 text-primary/15"
                  aria-hidden
                />
                <p className="px-8 italic text-2xl md:text-3xl leading-relaxed text-foreground/90 text-balance">
                  {data.editorial_note}
                </p>
                <footer className="mt-6 label-mono-sm text-muted">
                  — Note éditoriale Léopards Radar
                </footer>
              </blockquote>
            ) : (
              <p className="text-2xl text-foreground/70 italic">
                {data.title}
              </p>
            )}
            <Link
              to="/best-xi"
              className="group mt-10 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-background hover:bg-primary-hover transition-colors"
            >
              Voir la composition complète
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function BestXISkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12">
      <div className="space-y-3">
        <div className="h-3 w-40 rounded bg-card animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
        <div className="h-24 rounded bg-card animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
      </div>
      <div className="rounded-card border border-border bg-card/50 divide-y divide-border/60">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="h-12 animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
        ))}
      </div>
    </div>
  );
}

function BestXIEmpty() {
  return (
    <div className="rounded-card border border-dashed border-border bg-card/30 p-10 text-center max-w-2xl mx-auto">
      <p className="display-heading text-xl text-foreground">
        Première composition à venir
      </p>
      <p className="mt-2 text-sm text-muted-light">
        Le Best XI Diaspora sera publié lors de la prochaine édition du
        dimanche soir.
      </p>
    </div>
  );
}

function formatPublishedDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default BestXIPreviewSection;
