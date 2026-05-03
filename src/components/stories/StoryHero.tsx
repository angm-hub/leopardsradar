import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { StoryMeta } from "./StoryMeta";
import type { Article } from "@/hooks/useArticles";

interface StoryHeroProps {
  story: Article;
}

/**
 * StoryHero — featured article en tête de la page Histoires.
 * Card élargie sur 2 colonnes en desktop, typographie XL, gradient
 * primary subtil pour signaler la mise en avant.
 */
export function StoryHero({ story }: StoryHeroProps) {
  return (
    <Link
      to={`/histoires/${story.slug}`}
      className="group block relative overflow-hidden rounded-card border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-7 md:p-10 transition-all hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
            À la une
          </span>
          <StoryMeta story={story} size="md" />
        </div>

        <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-foreground tracking-tight leading-[1.05] group-hover:text-primary transition-colors">
          {story.title}
        </h2>

        <p className="mt-4 md:mt-5 font-serif text-base md:text-lg italic text-foreground/80 leading-relaxed">
          {story.subtitle}
        </p>

        <p className="mt-5 text-sm md:text-base text-muted-light leading-relaxed">
          {story.excerpt}
        </p>

        <span className="mt-7 inline-flex items-center gap-2 text-sm text-primary font-mono uppercase tracking-[0.2em]">
          Lire l'article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
