import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StoryHero } from "@/components/stories/StoryHero";
import { StoryCard } from "@/components/stories/StoryCard";
import { STORIES, type StoryCategory } from "@/data/stories";
import { cn } from "@/lib/utils";

type CategoryFilter = "ALL" | StoryCategory;

/**
 * Page Histoires — couche éditoriale de Léopards Radar.
 *
 * Default view : featured hero + grille des autres en 2-col.
 * Filtré : la grille seule, en 2-col, sans hero (le hero n'a de sens
 * qu'en vue "Tous", sinon on noie le contexte).
 */
export default function Histoires() {
  useEffect(() => {
    document.title = "Histoires | Léopards Radar";
    return () => {
      document.title = "Léopards Radar";
    };
  }, []);

  const [filter, setFilter] = useState<CategoryFilter>("ALL");

  // Available filters = only categories that actually have ≥ 1 article.
  // Avoids dead pills that would look broken.
  const filters = useMemo(() => {
    const counts = new Map<StoryCategory, number>();
    STORIES.forEach((s) => {
      counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    });
    const orderedCats: StoryCategory[] = [
      "Investigation",
      "Profil",
      "Analyse",
      "Diaspora",
      "Histoire",
    ];
    return [
      { key: "ALL" as const, label: "Tous", count: STORIES.length },
      ...orderedCats
        .filter((c) => counts.has(c))
        .map((c) => ({ key: c, label: c, count: counts.get(c) ?? 0 })),
    ];
  }, []);

  const filtered = useMemo(() => {
    if (filter === "ALL") return STORIES;
    return STORIES.filter((s) => s.category === filter);
  }, [filter]);

  const featured = filter === "ALL" ? (STORIES.find((s) => s.featured) ?? STORIES[0]) : null;
  const grid = featured ? filtered.filter((s) => s.slug !== featured.slug) : filtered;

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
          <h1 className="mt-4 font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
            Histoires.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-light">
            Des récits longs sur la diaspora, les Léopards oubliés, les
            tournants tactiques. La voix éditoriale du radar.
          </p>
        </header>

        {/* Category filter bar — sits between the header and the content
            so it never overlaps the hero card. Sticky on scroll for long
            indexes; for now it just stays in flow at ≤ 5 categories. */}
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
                {grid.map((s) => (
                  <StoryCard key={s.slug} story={s} />
                ))}
              </div>
            </div>
          ) : !featured ? (
            <div className="rounded-card border border-dashed border-border bg-card/30 p-12 text-center">
              <p className="text-sm text-muted-light">
                Aucune histoire dans cette catégorie pour le moment.
              </p>
              <button
                onClick={() => setFilter("ALL")}
                className="mt-4 text-xs uppercase tracking-[0.2em] text-primary hover:text-primary-hover transition-colors"
              >
                Voir toutes les histoires →
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}
