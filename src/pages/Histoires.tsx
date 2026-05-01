import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StoryHero } from "@/components/stories/StoryHero";
import { StoryCard } from "@/components/stories/StoryCard";
import { STORIES } from "@/data/stories";

/**
 * Page Histoires — la couche éditoriale de Léopards Radar.
 *
 * Layout : 1 hero featured + grille des autres stories en 2-col.
 * Pas d'image dans cette V1 — typo-first, ton kAIra premium dark.
 */
export default function Histoires() {
  useEffect(() => {
    document.title = "Histoires | Léopards Radar";
    return () => {
      document.title = "Léopards Radar";
    };
  }, []);

  const featured = STORIES.find((s) => s.featured) ?? STORIES[0];
  const rest = STORIES.filter((s) => s.slug !== featured?.slug);

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

        <section className="container-site pb-20 space-y-10 md:space-y-14">
          {featured ? <StoryHero story={featured} /> : null}

          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-2xl text-foreground">
                Plus d'histoires.
              </h2>
              <p className="text-xs text-muted font-mono">
                {rest.length} article{rest.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {rest.map((s) => (
                <StoryCard key={s.slug} story={s} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
