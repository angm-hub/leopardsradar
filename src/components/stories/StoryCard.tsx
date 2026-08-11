import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { StoryMeta } from "./StoryMeta";
import { StoryCover } from "./StoryCover";
import type { Article } from "@/hooks/useArticles";

interface StoryCardProps {
  story: Article;
}

/**
 * StoryCard — card secondaire pour la grille de la page Histoires.
 * Cover en tête (photo si dispo, sinon couverture typographique cobalt),
 * puis contenu. Donne un point d'accroche visuel à ce qui était une carte
 * 100% texte (audit lisibilité 11/08/2026).
 */
export function StoryCard({ story }: StoryCardProps) {
  return (
    <Link
      to={`/histoires/${story.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <StoryCover story={story} />
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <StoryMeta story={story} />
        <h3 className="font-serif text-xl md:text-2xl text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
          {story.title}
        </h3>
        <p className="text-sm text-muted-light leading-relaxed flex-1">
          {story.excerpt}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-mono uppercase tracking-[0.2em]">
          Lire
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
