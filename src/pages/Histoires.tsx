import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StoryHero } from "@/components/stories/StoryHero";
import { StoryCard } from "@/components/stories/StoryCard";
import { useArticles, type ArticleCategory } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";

type CategoryFilter = "ALL" | ArticleCategory;

/**
 * Page Histoires — couche éditoriale.
 *
 * Migration : avant on consommait `STORIES` depuis src/data/stories.ts
 * (hardcoded TypeScript). Maintenant on hit Supabase via useArticles —
 * publier un article = INSERT en BDD (admin) sans déploiement.
 *
 * Default view : featured hero + grille des autres en 2-col.
 * Filtré : la grille seule, sans hero.
 */
export default function Histoires() {
  useEffect(() => {
    document.title = "Histoires | Léopards Radar";
    return () => {
      document.title = "Léopards Radar";
    };
  }, []);

  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const { articles, loading } = useArticles();

  // Filters disponibles : seulement les catégories qui ont ≥1 article publié.
  const filters = useMemo(() => {
    const counts = new Map<ArticleCategory, number>();
    articles.forEach((a) => {
      counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    });
    const orderedCats: ArticleCategory[] = [
      "Investigation",
      "Profil",
      "Analyse",
      "Diaspora",
      "Histoire",
    ];
    return [
      { key: "ALL" as const, label: "Tous", count: articles.length },
      ...orderedCats
        .filter((c) => counts.has(c))
        .map((c) => ({ key: c, label: c, count: counts.get(c) ?? 0 })),
    ];
  }, [articles]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return articles;
    return articles.filter((a) => a.category === filter);
  }, [articles, filter]);

  const featured =
    filter === "ALL"
      ? (articles.find((a) => a.featured) ?? articles[0] ?? null)
      : null;
  const grid = featured ? filtered.filter((a) => a.slug !== featured.slug) : filtered;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <header className="container-site pt-32 pb-10">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">
              Home
            </a>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Histoires</span>
          </nav>
          <h1 className="mt-4 display-heading text-5xl md:text-6xl text-foreground">
            Histoires.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-light">
            Des récits longs sur la diaspora, les Léopards oubliés, les
            tournants tactiques. La voix éditoriale du radar.
          </p>
        </header>

        <div className="border-y border-border bg-background/85 backdrop-blur-sm">
          <div className="container-site flex flex-wrap gap-2 py-3">
            {filters.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] transition-colors",
                  filter === key
                    ? "border-primary/70 bg-primary/15 text-primary"
                    : "border-border text-muted hover:border-border-hover hover:text-foreground",
                )}
              >
                {label}
                <span className="font-mono text-[10px] opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <section className="container-site py-12 md:py-16 space-y-10 md:space-y-14">
          {loading ? (
            <ListSkeleton />
          ) : (
            <>
              {featured ? <StoryHero story={featured} /> : null}

              {grid.length > 0 ? (
                <div>
                  <div className="flex items-baseline justify-between mb-5">
                    <h2 className="font-serif text-2xl text-foreground">
                      {filter === "ALL" ? "Plus d'histoires." : `${filter}.`}
                    </h2>
                    <p className="text-xs text-muted font-mono">
                      {grid.length} article{grid.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {grid.map((a) => (
                      <StoryCard key={a.slug} story={a} />
                    ))}
                  </div>
                </div>
              ) : !featured ? (
                <EmptyState
                  hasFilter={filter !== "ALL"}
                  onReset={() => setFilter("ALL")}
                />
              ) : null}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ListSkeleton() {
  return (
    <>
      <div
        className="h-72 rounded-card animate-shimmer bg-card"
        style={{ backgroundSize: "200% 100%" }}
        aria-hidden
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-card animate-shimmer bg-card"
            style={{ backgroundSize: "200% 100%" }}
            aria-hidden
          />
        ))}
      </div>
    </>
  );
}

function EmptyState({
  hasFilter,
  onReset,
}: {
  hasFilter: boolean;
  onReset: () => void;
}) {
  return (
    <div className="rounded-card border border-dashed border-border bg-card/30 p-12 text-center max-w-2xl mx-auto">
      <p className="font-serif text-xl text-foreground">
        {hasFilter ? "Pas d'article dans cette catégorie." : "Aucune histoire publiée pour l'instant."}
      </p>
      <p className="mt-3 text-sm text-muted-light">
        {hasFilter
          ? "Essaie une autre catégorie ou consulte toutes les histoires."
          : "Le flux éditorial démarre bientôt — première publication imminente."}
      </p>
      {hasFilter ? (
        <button
          onClick={onReset}
          className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-primary hover:text-primary-hover transition-colors"
        >
          Voir toutes les histoires →
        </button>
      ) : null}
    </div>
  );
}
