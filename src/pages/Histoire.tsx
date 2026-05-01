import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { StoryMeta } from "@/components/stories/StoryMeta";
import { StoryCard } from "@/components/stories/StoryCard";
import { getStoryBySlug, getRelatedStories, type StoryBlock } from "@/data/stories";

/**
 * Page Histoire (single article) — single column éditorial dark.
 *
 * Inspiration : Linear blog (sobriété, generous whitespace, headline XL).
 * Rendu typé des blocs (h2, p, quote) pour préserver la sémantique.
 */
export default function Histoire() {
  const { slug } = useParams<{ slug: string }>();
  const story = slug ? getStoryBySlug(slug) : undefined;

  useEffect(() => {
    if (story) {
      document.title = `${story.title} | Histoires | Léopards Radar`;
    }
    return () => {
      document.title = "Léopards Radar";
    };
  }, [story]);

  if (!story) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
          <h1 className="font-serif text-5xl text-foreground">
            Article introuvable.
          </h1>
          <p className="mt-4 text-muted">Cette histoire n'existe pas (encore).</p>
          <Link
            to="/histoires"
            className="mt-8 inline-flex items-center gap-2 text-primary hover:text-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux Histoires
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const related = getRelatedStories(story.slug, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header article */}
        <header className="container-site pt-32 pb-10 max-w-3xl">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">
              Home
            </a>
            <span className="mx-2 text-muted/60">/</span>
            <Link
              to="/histoires"
              className="hover:text-foreground transition-colors"
            >
              Histoires
            </Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80 truncate inline-block max-w-xs align-bottom">
              {story.category}
            </span>
          </nav>

          <div className="mt-6">
            <StoryMeta story={story} size="md" />
          </div>

          <h1 className="mt-5 font-serif text-4xl md:text-6xl text-foreground tracking-tight leading-[1.05] text-balance">
            {story.title}
          </h1>

          <p className="mt-5 font-serif text-lg md:text-xl italic text-foreground/85 leading-relaxed text-balance">
            {story.subtitle}
          </p>
        </header>

        {/* Corps de l'article */}
        <article className="container-site pb-16 max-w-2xl">
          <div className="space-y-6 md:space-y-7">
            {story.body.map((block, i) => (
              <BodyBlock key={i} block={block} />
            ))}
          </div>

          {/* Author footer + CTA */}
          <div className="mt-14 pt-8 border-t border-border space-y-5">
            <p className="text-sm text-muted-light font-mono">
              Texte signé <span className="text-foreground">{story.author}</span>.
              Vous avez du contexte à ajouter ?{" "}
              <a
                href="mailto:contact@leopardsradar.com"
                className="text-primary hover:underline"
              >
                contact@leopardsradar.com
              </a>
              .
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/histoires">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4" /> Toutes les histoires
                </Button>
              </Link>
              <Link to="/newsletter">
                <Button size="sm">
                  S'abonner à la newsletter <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </article>

        {/* Related */}
        {related.length > 0 ? (
          <section className="container-site py-16 border-t border-border">
            <h2 className="font-serif text-2xl text-foreground mb-6">
              À lire ensuite.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {related.map((s) => (
                <StoryCard key={s.slug} story={s} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

/**
 * BodyBlock — rendu typé d'un bloc d'article. Sépare la sémantique
 * (paragraphe, titre h2, citation) du style — facilite une migration
 * vers un format structuré (Sanity, MDX, etc.) sans réécrire le rendu.
 */
function BodyBlock({ block }: { block: StoryBlock }) {
  if (block.type === "h2") {
    return (
      <h2 className="font-serif text-2xl md:text-3xl text-foreground tracking-tight pt-4">
        {block.text}
      </h2>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote className="border-l-2 border-primary/60 pl-5 md:pl-6 py-1">
        <p className="font-serif text-xl md:text-2xl italic text-foreground/95 leading-relaxed">
          « {block.text} »
        </p>
        {block.cite ? (
          <footer className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-muted-light">
            — {block.cite}
          </footer>
        ) : null}
      </blockquote>
    );
  }
  // Paragraphe par défaut
  return (
    <p className="text-base md:text-lg text-foreground/90 leading-[1.75]">
      {block.text}
    </p>
  );
}
