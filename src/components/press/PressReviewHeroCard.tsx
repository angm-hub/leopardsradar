import { ExternalLink, ShieldCheck } from "lucide-react";
import {
  PRESS_CATEGORY_LABEL,
  PRESS_CATEGORY_ACCENT,
  PRESS_TIER_LABEL,
  PRESS_TIER_ACCENT,
  type DBPressItem,
} from "@/types/pressItem";
import { cn } from "@/lib/utils";

/**
 * Hero card pour le 1er item de la revue de presse en vue non filtrée.
 *
 * WHY : dans un feed non filtré, l'item le plus récent (ou marqué featured)
 * mérite un traitement magazine — plus d'espace, hiérarchie visuelle claire,
 * CTA explicite. Ça évite l'effet "agrégateur d'égaux" de la grille uniforme
 * et donne un ancrage éditorial immédiat.
 *
 * Utilisé uniquement sur lg:col-span-2 lg:row-span-2. Sur mobile, rendu
 * en card normale (grid-cols-1 full-width).
 */
export function PressReviewHeroCard({ item }: { item: DBPressItem }) {
  const fav = item.source_logo_url ?? "";
  const ago = formatRelativeFR(item.published_at);
  const accent = PRESS_CATEGORY_ACCENT[item.category];
  const catLabel = PRESS_CATEGORY_LABEL[item.category];

  // Le corps affiché sous le headline : curator_note si renseignée et non seed,
  // sinon excerpt (snippet Supabase), sinon rien.
  const bodyText =
    item.curator_note && item.curator !== "seed_demo"
      ? item.curator_note
      : (item.excerpt ?? null);

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-5 rounded-card border border-border bg-card-hover p-6 md:p-8 transition-all",
        "hover:border-primary/40 hover:-translate-y-px",
        // Hauteur minimum pour occuper l'espace 2×2 sur lg
        "min-h-[340px] lg:min-h-0 aspect-auto lg:aspect-[16/10]",
      )}
    >
      {/* Source row — favicon plus grande que la card normale (h-20 w-20 px) */}
      <header className="flex items-center gap-3">
        {fav ? (
          <img
            src={fav}
            alt=""
            aria-hidden
            className="h-20 w-20 shrink-0 rounded-lg bg-card object-contain p-1 border border-border/60"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : (
          // Placeholder quand pas de favicon — même footprint visuel
          <div
            className="h-20 w-20 shrink-0 rounded-lg bg-card border border-border/60"
            aria-hidden
          />
        )}

        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground/90 truncate">
            {item.source_name}
          </p>

          {/* Tier badge S/A bien visible dans le hero — taille supérieure à la card normale */}
          {item.source_tier === "S" || item.source_tier === "A" ? (
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider",
                PRESS_TIER_ACCENT[item.source_tier],
              )}
              title={item.source_bias ?? `Source ${PRESS_TIER_LABEL[item.source_tier]}`}
            >
              {item.source_tier === "S" ? (
                <ShieldCheck className="h-3 w-3" aria-hidden />
              ) : null}
              {PRESS_TIER_LABEL[item.source_tier]}
            </span>
          ) : null}

          <time className="mt-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
            {ago}
          </time>
        </div>
      </header>

      {/* Headline — serif large, le produit éditorial principal */}
      <h2 className="font-serif text-2xl md:text-3xl leading-snug text-foreground transition-colors group-hover:text-primary">
        {item.headline}
      </h2>

      {/* Corps : curator_note en italique serif, ou excerpt en texte normal */}
      {bodyText ? (
        <p className="font-serif text-base italic leading-relaxed text-muted-light line-clamp-4">
          {bodyText}
        </p>
      ) : null}

      {/* Tags + catégorie */}
      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider",
            accent,
          )}
        >
          {catLabel}
        </span>
        {item.tags && item.tags.length > 0
          ? item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-card px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-light"
              >
                {t}
              </span>
            ))
          : null}
      </div>

      {/* CTA pleine largeur — ancre externe, pas un bouton <button> */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Lire l'article : ${item.headline}`}
        className={cn(
          // Reprend exactement le style variant="primary" de ButtonPrimitive
          "relative inline-flex w-full items-center justify-center gap-2 rounded-button font-medium",
          "text-primary-foreground transition-[transform,filter,box-shadow] duration-200 ease-out",
          "bg-[linear-gradient(180deg,#FFD736_0%,#FCD116_55%,#E5BC10_100%)]",
          "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.35),0_8px_24px_rgba(252,209,22,0.18)]",
          "hover:[filter:brightness(1.04)]",
          "hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.4),0_10px_28px_rgba(252,209,22,0.28)]",
          "active:translate-y-px active:[filter:brightness(0.97)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "px-5 py-2.5 text-base",
        )}
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          Lire l'article
          <ExternalLink className="h-4 w-4" aria-hidden />
        </span>
      </a>
    </article>
  );
}

// Réutilise exactement la même logique que PressReviewCard — copiée localement
// pour éviter une dépendance croisée entre deux composants de même dossier.
// WHY : si on extrait en util partagé, on crée un couplage superflu pour
// une fonction de 15 lignes. Si la logique diverge un jour, on veut pouvoir
// les faire évoluer indépendamment.
function formatRelativeFR(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffMs = now - t;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days === 1) {
    const d = new Date(t);
    return `hier ${d.getHours().toString().padStart(2, "0")}h`;
  }
  if (days < 7) {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      hour: "2-digit",
    }).format(new Date(t));
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(t));
}
