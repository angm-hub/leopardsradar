import { cn } from "@/lib/utils";
import type { Article } from "@/hooks/useArticles";

/**
 * StoryCover — couverture visuelle d'un récit.
 *
 * Deux modes :
 *   - `hero_image_url` présent → photo en object-cover + scrim.
 *   - sinon → couverture TYPOGRAPHIQUE dans la DA cobalt (surface graduée,
 *     grain, glow gold, mot-catégorie ghosté en bleed façon marqueur de
 *     rubrique). Zéro placeholder, zéro dépendance externe.
 *
 * Objectif lisibilité (audit 11/08/2026) : les cartes Histoires étaient
 * 100% texte, faible scannabilité. La cover donne un point d'accroche
 * visuel et signale la catégorie d'un coup d'œil.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function StoryCover({
  story,
  variant = "card",
  className,
}: {
  story: Article;
  variant?: "card" | "hero";
  className?: string;
}) {
  const ratio =
    variant === "hero"
      ? "aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[280px]"
      : "aspect-[16/10]";

  if (story.hero_image_url) {
    return (
      <div className={cn("relative overflow-hidden", ratio, className)}>
        <img
          src={story.hero_image_url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden", ratio, className)}
      style={{ background: "var(--surface-2)" }}
    >
      {/* Glow gold discret, coin haut-droit */}
      <div className="absolute -top-8 -right-6 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
      {/* Hairline haut */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
      {/* Mot-catégorie ghosté en bleed bas */}
      <span className="absolute inset-x-4 -bottom-1 truncate font-serif text-4xl md:text-5xl font-semibold uppercase tracking-tight leading-none text-foreground/[0.07] select-none">
        {story.category}
      </span>
      {/* Tick accent gold */}
      <span className="absolute left-4 top-4 h-1.5 w-1.5 rounded-full bg-primary/80" />
    </div>
  );
}
