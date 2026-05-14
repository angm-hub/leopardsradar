import { useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Newspaper } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { usePressItems } from "@/hooks/usePressItems";
import { usePressSources } from "@/hooks/usePressSources";
import { PressReviewCard } from "@/components/press/PressReviewCard";
import { PressReviewHeroCard } from "@/components/press/PressReviewHeroCard";
import { PressQuoteCard } from "@/components/press/PressQuoteCard";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  PRESS_CATEGORY_LABEL,
  type PressCategory,
} from "@/types/pressItem";
import { cn } from "@/lib/utils";

const CATEGORIES: { key: PressCategory | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "actu", label: PRESS_CATEGORY_LABEL.actu },
  { key: "mercato", label: PRESS_CATEGORY_LABEL.mercato },
  { key: "fecofa", label: PRESS_CATEGORY_LABEL.fecofa },
  { key: "diaspora", label: PRESS_CATEGORY_LABEL.diaspora },
  { key: "longread", label: PRESS_CATEGORY_LABEL.longread },
  { key: "social", label: PRESS_CATEGORY_LABEL.social },
];

const PERIODS: { key: number | null; label: string }[] = [
  { key: 1, label: "24h" },
  { key: 7, label: "7 jours" },
  { key: 30, label: "30 jours" },
  { key: null, label: "Tout" },
];

export default function RevueDePresse() {
  useDocumentMeta({
    title: "Revue de presse",
    description:
      "Ce qui se dit sur les Léopards. Sources spécialisées RDC + diaspora, curation éditoriale. Mis à jour en continu.",
  });

  const [category, setCategory] = useState<PressCategory | "all">("all");
  const [windowDays, setWindowDays] = useState<number | null>(7);
  const [source, setSource] = useState<string | null>(null);

  // Le layout magazine (hero + grille) n'a de sens qu'en vue feed non filtrée.
  // WHY : le hero met en avant "l'article du moment" — ce signal est brouillé
  // dès qu'on filtre par catégorie ou source, car tous les items ont alors la
  // même importance dans ce contexte précis.
  const filtersActive = category !== "all" || source !== null;

  const { sources } = usePressSources();
  const { items, loading } = usePressItems({
    limit: 60,
    category: category === "all" ? null : category,
    windowDays,
    source,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <header className="container-site pt-32 pb-8 md:pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Revue de presse</span>
          </nav>

          <div className="mt-4 flex items-start gap-4">
            <Newspaper className="hidden md:block h-10 w-10 mt-2 text-primary" aria-hidden />
            <div>
              <h1 className="font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
                Revue de presse.
              </h1>
              <p className="mt-3 text-lg text-muted-light max-w-2xl">
                Ce qui se dit sur les Léopards — sources spécialisées RDC,
                médias diaspora, comptes officiels. Curation éditoriale, pas
                de firehose.
              </p>
            </div>
          </div>
        </header>

        {/* Filter bar */}
        <section className="border-y border-border bg-card/30">
          <div className="container-site py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Categories */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="hidden sm:inline-block h-4 w-4 text-muted" aria-hidden />
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                      category === c.key
                        ? "bg-primary text-background border-primary"
                        : "border-border text-muted-light hover:text-foreground hover:border-foreground/30",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Time window */}
              <div className="flex items-center gap-1 self-start lg:self-auto">
                {PERIODS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setWindowDays(p.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
                      windowDays === p.key
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source filter — second row, hidden on small screens to keep
                the filter bar compact on mobile (full source list is long). */}
            {sources.length > 0 ? (
              <div className="mt-3 hidden sm:flex flex-wrap items-center gap-2 text-xs text-muted-light">
                <span className="font-mono uppercase tracking-wider text-muted">
                  Source :
                </span>
                <button
                  type="button"
                  onClick={() => setSource(null)}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-colors",
                    source === null
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  Toutes
                </button>
                {sources.map((s) => (
                  <button
                    key={s.handle}
                    type="button"
                    onClick={() => setSource(source === s.handle ? null : s.handle)}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition-colors",
                      source === s.handle
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {s.name}{" "}
                    <span className="opacity-60">·{s.count}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Items list */}
        <section className="container-site py-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[200px] rounded-card border border-border bg-gradient-to-r from-card via-card-hover to-card animate-shimmer"
                  style={{ backgroundSize: "200% 100%" }}
                  aria-hidden
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-card/30 p-12 text-center">
              <p className="font-serif text-2xl text-foreground mb-2">
                Aucun item dans cette fenêtre.
              </p>
              <p className="text-muted-light">
                Essayez d'élargir la période ou de retirer le filtre catégorie.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between text-sm text-muted">
                <span>
                  <strong className="text-foreground">{items.length}</strong>{" "}
                  {items.length > 1 ? "items" : "item"}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider">
                  Tri : plus récent d'abord
                </span>
              </div>

              {/* Layout magazine : hero + grille asymétrique quand pas de filtre actif.
                  Quote pull intercalée tous les ~5 items quand la curator_note
                  est assez longue (> 50 chars) — donne un rythme de lecture
                  type magazine, l'œil ralentit sur la citation. */}
              {!filtersActive && items.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[auto]">
                  <div className="lg:col-span-2 lg:row-span-2">
                    <PressReviewHeroCard item={items[0]} />
                  </div>
                  {items.slice(1).map((it, i) => {
                    const hasQuote =
                      it.curator_note && it.curator_note.length > 50;
                    // 1 quote card max tous les 4 items (i=3, 7, 11, …) pour
                    // garder l'effet rare. Les autres restent en card normale.
                    return hasQuote && i > 0 && (i + 1) % 4 === 0 ? (
                      <PressQuoteCard key={it.id} item={it} />
                    ) : (
                      <PressReviewCard key={it.id} item={it} />
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((it, i) => {
                    const hasQuote =
                      it.curator_note && it.curator_note.length > 50;
                    return hasQuote && i > 0 && (i + 1) % 5 === 0 ? (
                      <PressQuoteCard key={it.id} item={it} />
                    ) : (
                      <PressReviewCard key={it.id} item={it} />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
