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
 * Compact press item card used both in the home "Revue de presse" row and
 * in the dense list on `/revue-de-presse`.
 *
 * The card is itself the link — single click target, single tab open. We
 * avoid an explicit "Lire" button so the visitor doesn't second-guess
 * whether clicking the headline does the same thing.
 */
export function PressReviewCard({ item }: { item: DBPressItem }) {
  const fav = item.source_logo_url ?? "";
  const ago = formatRelativeFR(item.published_at);
  const accent = PRESS_CATEGORY_ACCENT[item.category];
  const catLabel = PRESS_CATEGORY_LABEL[item.category];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex h-full flex-col gap-3 rounded-card border border-border bg-card p-5 transition-all",
        "hover:border-primary/40 hover:bg-card-hover hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
      aria-label={`${item.headline} — source ${item.source_name}`}
    >
      {/* Source row — favicon + name + tier badge + horodatage */}
      <div className="flex items-center gap-2 text-xs text-muted">
        {fav ? (
          <img
            src={fav}
            alt=""
            aria-hidden
            className="h-5 w-5 shrink-0 rounded bg-card-hover object-contain"
            loading="lazy"
            onError={(e) => {
              // Hide the favicon if it 404s; keep the source name visible.
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="h-5 w-5 shrink-0 rounded bg-card-hover" aria-hidden />
        )}
        <span className="truncate font-medium text-foreground/85">
          {item.source_name}
        </span>
        {/* Tier badge — only show on S/A (the high-signal tiers). B/C
            keep the card cleaner and avoid screaming "low quality". */}
        {item.source_tier === "S" || item.source_tier === "A" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider",
              PRESS_TIER_ACCENT[item.source_tier],
            )}
            title={item.source_bias ?? `Source ${PRESS_TIER_LABEL[item.source_tier]}`}
          >
            {item.source_tier === "S" ? <ShieldCheck className="h-2.5 w-2.5" aria-hidden /> : null}
            {PRESS_TIER_LABEL[item.source_tier]}
          </span>
        ) : null}
        <span className="opacity-50">·</span>
        <time className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {ago}
        </time>
      </div>

      {/* Headline — the actual product */}
      <h3 className="font-serif text-base leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-3">
        {item.headline}
      </h3>

      {/* Curator note (only when the editorial team added context) */}
      {item.curator_note && item.curator !== "seed_demo" ? (
        <p className="text-xs italic leading-relaxed text-muted-light line-clamp-2">
          {item.curator_note}
        </p>
      ) : null}

      {/* Footer row : category + first 2 tags + outbound icon */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
              accent,
            )}
          >
            {catLabel}
          </span>
          {/* Top 2 tags max — keeps the footer compact. The full list is
              available via title on the badge for power users. */}
          {item.tags && item.tags.length > 0
            ? item.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-card-hover px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-light"
                >
                  {t}
                </span>
              ))
            : null}
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted opacity-60 transition-opacity group-hover:opacity-100 shrink-0" aria-hidden />
      </div>
    </a>
  );
}

/**
 * Returns "il y a 2h", "hier 18h", "lundi 12 mai" depending on the age
 * of `iso`. Designed to be skim-readable in a feed without taking too
 * much horizontal space.
 *
 * Same logic could live in a util module, but it's currently used only
 * here so it stays colocated for now.
 */
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
    return `hier ${pad(d.getHours())}h`;
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

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
