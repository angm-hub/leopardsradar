import { Clock, User } from "lucide-react";
import type { Article } from "@/hooks/useArticles";

interface StoryMetaProps {
  story: Article;
  size?: "sm" | "md";
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * StoryMeta — bandeau date · auteur · temps de lecture · catégorie.
 * Inline compact, utilisé dans cards et headers d'articles.
 */
export function StoryMeta({ story, size = "sm" }: StoryMetaProps) {
  const text = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <div
      className={`flex items-center flex-wrap gap-x-3 gap-y-1 ${text} font-mono text-muted-light uppercase tracking-[0.18em]`}
    >
      <span className="text-primary/85">{story.category}</span>
      <span className="text-muted/60">·</span>
      <span>{formatDate(story.published_at)}</span>
      <span className="text-muted/60">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {story.reading_minutes} min
      </span>
      {size === "md" ? (
        <>
          <span className="text-muted/60">·</span>
          <span className="inline-flex items-center gap-1 normal-case tracking-normal">
            <User className="h-3 w-3" />
            {story.author}
          </span>
        </>
      ) : null}
    </div>
  );
}
