import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { StoryMeta } from "@/components/stories/StoryMeta";
import { StoryCard } from "@/components/stories/StoryCard";
import { useArticle, type ArticleBlock } from "@/hooks/useArticles";

/**
 * Page Histoire (single article) — Supabase-backed.
 *
 * Migration : avant, lookup local via getStoryBySlug(slug). Maintenant,
 * useArticle(slug) hit la table `articles` avec RLS publique en lecture.
 * Les related sont aussi fetchés via la RPC get_related_articles qui
 * priorise la même catégorie + fallback récents.
 */
export default function Histoire() {
  const { slug } = useParams<{ slug: string }>();
  const { article, related, loading } = useArticle(slug);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | Histoires | Léopards Radar`;
    }
    return () => {
      document.title = "Léopards Radar";
    };
  }, [article]);

  if (loading) return <ArticleSkeleton />;

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
          <h1 className="display-heading text-5xl text-foreground">
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
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
              {article.category}
            </span>
          </nav>

          <div className="mt-6">
            <StoryMeta story={article} size="md" />
          </div>

          <h1 className="mt-5 display-heading text-4xl md:text-6xl text-foreground leading-[1.05] text-balance">
            {article.title}
          </h1>

          <p className="mt-5 font-serif text-lg md:text-xl italic text-foreground/85 leading-relaxed text-balance">
            {article.subtitle}
          </p>
        </header>

        <article className="container-site pb-16 max-w-2xl">
          <div className="space-y-6 md:space-y-7">
            {article.body.map((block, i) => (
              <BodyBlock key={i} block={block} />
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-border space-y-5">
            <p className="text-sm text-muted-light font-mono">
              Texte signé <span className="text-foreground">{article.author}</span>.
              Une donnée à corriger ?{" "}
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

        {related.length > 0 ? (
          <section className="container-site py-16 border-t border-border">
            <h2 className="display-heading text-2xl text-foreground mb-6">
              À lire ensuite.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {related.map((a) => (
                <StoryCard key={a.slug} story={a} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container-site pt-32 pb-16 max-w-3xl">
        <div
          className="h-3 w-40 rounded bg-card animate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
          aria-hidden
        />
        <div
          className="mt-6 h-16 w-full rounded bg-card animate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
          aria-hidden
        />
        <div
          className="mt-4 h-6 w-2/3 rounded bg-card animate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
          aria-hidden
        />
        <div className="mt-12 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-card animate-shimmer"
              style={{ backgroundSize: "200% 100%", width: `${85 + (i % 3) * 5}%` }}
              aria-hidden
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/**
 * BodyBlock — rendu typé d'un bloc (h2 / p / quote). Sépare la sémantique
 * du style. Si on migre un jour vers un format richer (MDX, Sanity), il
 * suffit d'ajouter d'autres types ici sans toucher au reste.
 */
function BodyBlock({ block }: { block: ArticleBlock }) {
  if (block.type === "h2") {
    return (
      <h2 className="display-heading text-2xl md:text-3xl text-foreground pt-4">
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
  return (
    <p className="text-base md:text-lg text-foreground/90 leading-[1.75]">
      {block.text}
    </p>
  );
}
