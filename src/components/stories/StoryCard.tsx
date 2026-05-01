import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { StoryMeta } from "./StoryMeta";
import type { Story } from "@/data/stories";

interface StoryCardProps {
  story: Story;
}

/**
 * StoryCard — card secondaire pour la grille de la page Histoires.
 * Pas d'image (volontairement : la couche éditoriale est typo-first
 * dans cette V1, on ajoutera des covers Nanobanana plus tard).
 */
export function StoryCard({ story }: StoryCardProps) {
  return (
    <Link
      to={`/histoires/${story.slug}`}
      className="group flex flex-col gap-3 rounded-card border border-border bg-card p-5 md:p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
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
    </Link>
  );
}
