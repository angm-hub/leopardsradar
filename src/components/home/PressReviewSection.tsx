import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePressItems } from "@/hooks/usePressItems";
import { PressReviewCard } from "@/components/press/PressReviewCard";

/**
 * Home section : 5 most-recent press items in a horizontal grid.
 *
 * Editorially this is the "raison de revenir tous les jours" : the radar
 * is updated weekly, but the Revue de presse moves all week. Placed
 * directly under the hero on purpose — it answers "what's new today ?"
 * before the visitor scrolls to evergreen sections (Best XI, stats).
 */
export function PressReviewSection() {
  // 4 items en grille lg:cols-4 — limite réduite pour respirer (5 cards
   // sur 1280px donnaient des cards de ~240px, headlines coupées partout).
  const { items, loading } = usePressItems({ limit: 4 });

  // Hide the entire section if there's nothing to show — better than
  // rendering an empty grid that signals a broken site.
  if (!loading && items.length === 0) return null;

  return (
    <section className="relative border-t border-border bg-background py-16 md:py-20">
      <div className="container-site">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-2">
              Revue de presse
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
              Ce qui s'est dit cette semaine.
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-light max-w-xl">
              Sources spécialisées RDC + diaspora, curées à la main. Pas de
              firehose, pas de bruit.
            </p>
          </div>
          <Link
            to="/revue-de-presse"
            className="group inline-flex items-center gap-2 self-start text-sm font-medium text-foreground hover:text-primary transition-colors sm:self-auto"
          >
            Voir tout
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[180px] rounded-card border border-border bg-gradient-to-r from-card via-card-hover to-card animate-shimmer"
                style={{ backgroundSize: "200% 100%" }}
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((it) => (
              <PressReviewCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
