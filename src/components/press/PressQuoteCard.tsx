/**
 * PressQuoteCard — variante "quote pull" gros format pour la revue de presse.
 *
 * WHY ce composant : la grille de presse est uniforme (cards identiques),
 * ce qui est efficace pour scanner mais plat pour lire. En insérant une
 * card "quote" tous les N items, on crée un rythme magazine — l'œil se
 * pose sur la citation, ralentit, lit, puis reprend le scan.
 *
 * Usage typique : appelée par RevueDePresse.tsx en alternance avec
 * PressReviewCard, lorsqu'un item a une curator_note assez longue (> 50
 * caractères) pour que la mise en avant ait du sens.
 *
 * Format : background plus contrasté (bg-card-hover), pas de favicon
 * dominant, citation en font-serif italic text-xl prend tout l'espace.
 * Source name en footer, lien vers l'article.
 */

import { ExternalLink, Quote } from "lucide-react";
import {
  PRESS_TIER_LABEL,
  PRESS_TIER_ACCENT,
  type DBPressItem,
} from "@/types/pressItem";
import { cn } from "@/lib/utils";

export function PressQuoteCard({ item }: { item: DBPressItem }) {
  const ago = formatRelativeFR(item.published_at);
  const quoteText = item.curator_note ?? item.headline;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-card border border-border/80 bg-card-hover p-6 transition-all",
        "hover:border-primary/50 hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
      aria-label={`Citation de ${item.source_name} — ${item.headline}`}
    >
      {/* Quote glyph en arrière-plan, signature visuelle */}
      <Quote
        aria-hidden
        className="absolute right-4 top-4 h-10 w-10 text-primary/15 rotate-180"
      />

      {/* Citation principale — c'est l'élément */}
      <blockquote className="relative font-serif italic text-xl md:text-2xl leading-snug text-foreground/90 line-clamp-5">
        {quoteText}
      </blockquote>

      {/* Headline secondaire si on a remplacé par une vraie note de curator */}
      {item.curator_note && item.curator_note !== item.headline ? (
        <p className="text-xs text-muted-light line-clamp-2 leading-relaxed">
          À propos de : <span className="text-foreground/70">{item.headline}</span>
        </p>
      ) : null}

      {/* Footer attribution */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border/50">
        <div className="min-w-0 flex items-center gap-2 text-xs">
          <span className="truncate font-medium text-foreground/85">
            — {item.source_name}
          </span>
          {item.source_tier === "S" || item.source_tier === "A" ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider",
                PRESS_TIER_ACCENT[item.source_tier],
              )}
            >
              {PRESS_TIER_LABEL[item.source_tier]}
            </span>
          ) : null}
          <span className="opacity-50">·</span>
          <time className="font-mono text-[10px] uppercase tracking-wider text-muted">
            {ago}
          </time>
        </div>
        <ExternalLink
          aria-hidden
          className="h-3.5 w-3.5 text-muted opacity-60 transition-opacity group-hover:opacity-100 shrink-0"
        />
      </div>
    </a>
  );
}

function formatRelativeFR(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = now - t;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days < 7) return `il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(t));
}
