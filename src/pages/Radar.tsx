import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PlayerCardSkeleton from "@/components/ui/PlayerCardSkeleton";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Select } from "@/components/ui/SelectPrimitive";
import { usePlayers } from "@/hooks/usePlayers";
import { useHomeStats } from "@/hooks/useHomeStats";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ViewTabs, type RadarView } from "@/components/radar/ViewTabs";
import { BubbleChart } from "@/components/radar/BubbleChart";
import { RadarHighlights } from "@/components/radar/RadarHighlights";
import {
  POSITION_BADGE,
  POSITION_DOT,
  POSITION_LABEL,
  flagFor,
  formatMarketValue,
} from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPlayer, DBPosition, DBTier } from "@/types/dbPlayer";

// AtlasMap importé en lazy pour code-split le bundle leaflet (~100ko gzip)
const AtlasMap = lazy(() =>
  import("@/components/radar/AtlasMap").then((m) => ({ default: m.AtlasMap })),
);

// ── Types filtres ─────────────────────────────────────────────────────────────

type PositionFilter = "ALL" | DBPosition;
type TierFilter = "ALL" | DBTier;
type CategoryFilter = "ALL" | "radar" | "heritage";
type SortOption = "value_desc" | "value_asc" | "age_asc" | "age_desc" | "name_asc";

// ── Options de filtres ────────────────────────────────────────────────────────

const POSITION_OPTIONS: { value: PositionFilter; label: string }[] = [
  { value: "ALL", label: "Tous postes" },
  { value: "Goalkeeper", label: "Gardien" },
  { value: "Defender", label: "Défenseur" },
  { value: "Midfield", label: "Milieu" },
  { value: "Attack", label: "Attaquant" },
];

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "ALL", label: "Tous tiers" },
  { value: "tier1", label: "Tier 1 — Top clubs" },
  { value: "tier2", label: "Tier 2" },
];

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "Radar + Héritage" },
  { value: "radar", label: "Radar uniquement" },
  { value: "heritage", label: "Héritage uniquement" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "value_desc", label: "Valeur marchande" },
  { value: "age_asc", label: "Plus jeunes" },
  { value: "age_desc", label: "Plus anciens" },
  { value: "name_asc", label: "Nom A-Z" },
];

// ── Badge catégorie ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  if (category === "radar") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        Eligible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
      Heritage
    </span>
  );
}

// ── Card joueur ───────────────────────────────────────────────────────────────

function RadarCard({ player }: { player: DBPlayer }) {
  return (
    <Link
      to={`/player/${player.slug}`}
      className="group relative block aspect-[3/4] rounded-card overflow-hidden bg-card border border-border transition-all duration-300 hover:border-border-hover hover:shadow-xl hover:shadow-primary/5"
    >
      <PlayerAvatar
        name={player.name}
        src={player.image_url}
        className="absolute inset-0 h-full w-full"
        initialsClassName="text-6xl"
      />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
        <CategoryBadge category={player.player_category} />
        {player.position ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md",
              POSITION_BADGE[player.position],
            )}
          >
            <span
              aria-hidden
              className={cn("inline-block h-1.5 w-1.5 rounded-full", POSITION_DOT[player.position])}
            />
            {POSITION_LABEL[player.position]}
          </span>
        ) : null}
      </div>

      {player.nationalities.length > 0 ? (
        <div className="absolute top-3 right-3 flex items-center gap-0.5 rounded-full bg-background/40 backdrop-blur-md border border-border/40 px-2 py-1">
          {player.nationalities.slice(0, 3).map((nat) => (
            <span key={nat} className="text-sm leading-none" title={nat}>
              {flagFor(nat)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 p-5">
        {player.current_club ? (
          <p className="text-sm text-foreground/70 truncate">{player.current_club}</p>
        ) : null}
        <h3 className="mt-1 display-heading text-xl text-foreground truncate">
          {player.name}
        </h3>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-muted">
            {player.age ? `${player.age} ans` : ""}
          </span>
          {player.market_value_eur && player.market_value_eur > 0 ? (
            <span className="font-mono text-primary/90 font-semibold">
              {formatMarketValue(player.market_value_eur)}
            </span>
          ) : null}
        </div>
        {player.eligibility_note ? (
          <p className="mt-2 text-[11px] text-muted-light/80 line-clamp-2 leading-snug">
            {player.eligibility_note}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

// ── Skeleton liste ────────────────────────────────────────────────────────────

function ListSkeletons() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Radar() {
  useDocumentMeta({
    title: "Radar",
    description:
      "Le Radar Léopards — talents éligibles RDC et diaspora binationale, cartographiés par valeur marchande, jeunesse et tier UEFA.",
  });

  const { players, loading, error } = usePlayers({
    categories: ["radar", "heritage"],
    excludeEligibilityStatus: "ineligible",
    orderBy: { column: "market_value_eur", ascending: false },
  });
  const { stats } = useHomeStats();
  const radarTotal =
    stats && (stats.radar_count !== null || stats.heritage_count !== null)
      ? (stats.radar_count ?? 0) + (stats.heritage_count ?? 0)
      : null;

  // ── Filtres ─────────────────────────────────────────────────────────────────

  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [tier, setTier] = useState<TierFilter>("ALL");
  const [nation, setNation] = useState<string>("ALL");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [sort, setSort] = useState<SortOption>("value_desc");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Vue par défaut : liste sur mobile, carte sur desktop
  const [view, setView] = useState<RadarView>(() => {
    if (typeof window === "undefined") return "liste";
    return window.matchMedia("(min-width: 768px)").matches ? "carte" : "liste";
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // ── Dropdown nationalités dynamique ─────────────────────────────────────────

  const nationOptions = useMemo(() => {
    const counts = new Map<string, number>();
    players.forEach((p) =>
      p.other_nationalities.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1)),
    );
    const sorted = Array.from(counts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    return [
      { value: "ALL", label: `Toutes nationalités` },
      ...sorted.map(([n, count]) => ({
        value: n,
        label: `${flagFor(n)} ${n} (${count})`,
      })),
    ];
  }, [players]);

  // ── Filtre + tri ─────────────────────────────────────────────────────────────

  const filtersActive =
    position !== "ALL" ||
    tier !== "ALL" ||
    nation !== "ALL" ||
    category !== "ALL" ||
    debouncedQuery !== "";

  const reset = () => {
    setPosition("ALL");
    setTier("ALL");
    setNation("ALL");
    setCategory("ALL");
    setQuery("");
  };

  const filtered = useMemo(() => {
    let result = players.filter((p) => {
      if (p.eligibility_status === "ineligible") return false;
      if (position !== "ALL" && p.position !== position) return false;
      if (tier !== "ALL" && p.tier !== tier) return false;
      if (nation !== "ALL" && !p.other_nationalities.includes(nation)) return false;
      if (category !== "ALL" && p.player_category !== category) return false;
      if (debouncedQuery && !p.name.toLowerCase().includes(debouncedQuery)) return false;
      return true;
    });

    // Tri secondaire
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "value_desc":
          return (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0);
        case "value_asc":
          return (a.market_value_eur ?? 0) - (b.market_value_eur ?? 0);
        case "age_asc":
          return (a.age ?? 99) - (b.age ?? 99);
        case "age_desc":
          return (b.age ?? 0) - (a.age ?? 0);
        case "name_asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [players, position, tier, nation, category, debouncedQuery, sort]);

  // ── Handler filtre par nation depuis BubbleChart ──────────────────────────

  function handleNationFilter(n: string) {
    setNation(n);
    setView("liste");
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* Header */}
        <header className="container-site pt-32 pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">
              Home
            </a>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Radar</span>
          </nav>
          <h1 className="mt-4 display-heading text-5xl md:text-6xl text-foreground">
            Le Radar.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-light">
            {radarTotal != null
              ? `${radarTotal} joueurs éligibles ou à ascendance RDC dans le monde.`
              : loading
              ? "Chargement du vivier..."
              : "Vivier des talents éligibles RDC."}
          </p>
        </header>

        {/* Barre de filtres sticky */}
        <div className="sticky top-16 z-20 bg-background/85 backdrop-blur-lg border-y border-border">
          <div className="container-site py-3">

            {/* Ligne principale : onglets + search + compteur + toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <ViewTabs current={view} onChange={setView} />

              <span className="hidden md:inline-block h-6 w-px bg-border" />

              {/* Search */}
              <div className="relative min-w-0 flex-1 md:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="search"
                  placeholder="Rechercher…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-card border border-border rounded-button pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted hover:border-border-hover focus:border-primary outline-none transition-colors"
                  aria-label="Rechercher un joueur"
                />
              </div>

              {/* Compteur live */}
              <span className="text-sm text-muted whitespace-nowrap font-mono">
                {loading ? "..." : `${filtered.length} profil${filtered.length > 1 ? "s" : ""}`}
              </span>

              {/* Toggle filtres avancés (mobile-first) */}
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-button border px-3 py-2 text-xs font-medium transition-colors",
                  filtersActive
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-light hover:border-border-hover hover:text-foreground",
                )}
                aria-expanded={filtersOpen}
                aria-label="Filtres avancés"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filtres</span>
                {filtersActive && (
                  <span className="ml-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-mono px-1.5 py-0.5 leading-none">
                    {[position, tier, nation, category].filter((f) => f !== "ALL").length +
                      (debouncedQuery ? 1 : 0)}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    filtersOpen && "rotate-180",
                  )}
                />
              </button>

              {filtersActive ? (
                <Button variant="ghost" size="sm" onClick={reset} aria-label="Réinitialiser les filtres">
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </Button>
              ) : null}
            </div>

            {/* Panneau de filtres dépliable */}
            {filtersOpen && (
              <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-3 items-center">
                <Select
                  label="Poste"
                  options={POSITION_OPTIONS}
                  value={position}
                  onChange={(e) => setPosition(e.target.value as PositionFilter)}
                />
                <Select
                  label="Tier"
                  options={TIER_OPTIONS}
                  value={tier}
                  onChange={(e) => setTier(e.target.value as TierFilter)}
                />
                <Select
                  label="Nationalite"
                  options={nationOptions}
                  value={nation}
                  onChange={(e) => setNation(e.target.value)}
                />
                <Select
                  label="Type"
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryFilter)}
                />
                <Select
                  label="Trier par"
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Highlights éditoriaux */}
        <RadarHighlights />

        {/* Section principale */}
        <section className="container-site py-12">
          {loading ? (
            view === "carte" || view === "atlas" ? (
              <div
                className="w-full rounded-card border border-border/60 bg-card animate-pulse"
                style={{ height: 460 }}
              />
            ) : (
              <ListSkeletons />
            )
          ) : error ? (
            <p className="py-16 text-center text-muted-light">{error}</p>
          ) : view === "carte" ? (
            <BubbleChart
              players={filtered}
              totalRoster={players.length}
              onNationFilter={handleNationFilter}
            />
          ) : view === "atlas" ? (
            <Suspense
              fallback={
                <div
                  className="w-full rounded-card border border-border/60 bg-card animate-pulse flex items-center justify-center"
                  style={{ height: 520 }}
                >
                  <p className="text-sm text-muted">Chargement de la carte…</p>
                </div>
              }
            >
              <AtlasMap players={filtered} />
            </Suspense>
          ) : filtered.length === 0 ? (
            <EmptyState
              hasPlayers={players.length > 0}
              radarTotal={radarTotal}
              onReset={reset}
            />
          ) : (
            <GridView players={filtered} />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ── Vue grille ────────────────────────────────────────────────────────────────

function GridView({ players }: { players: DBPlayer[] }) {
  // Pagination simple : 48 premiers, bouton "charger plus"
  // (alternative plus légère à react-virtual pour les grilles de cards images)
  const PAGE_SIZE = 48;
  const [page, setPage] = useState(1);
  const visible = players.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < players.length;

  // Reset page quand les joueurs changent (filtre appliqué)
  useEffect(() => {
    setPage(1);
  }, [players]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {visible.map((p) => (
          <RadarCard key={p.slug} player={p} />
        ))}
      </div>

      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setPage((v) => v + 1)}
          >
            Charger {Math.min(PAGE_SIZE, players.length - visible.length)} profils de plus
          </Button>
        </div>
      ) : null}

      {players.length > PAGE_SIZE && !hasMore ? (
        <p className="mt-6 text-center text-xs font-mono text-muted">
          {players.length} profils affichés
        </p>
      ) : null}
    </>
  );
}

// ── État vide ─────────────────────────────────────────────────────────────────

function EmptyState({
  hasPlayers,
  radarTotal,
  onReset,
}: {
  hasPlayers: boolean;
  radarTotal: number | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center max-w-md mx-auto">
      <Search className="h-10 w-10 text-foreground/30" />
      {!hasPlayers ? (
        <>
          <p className="display-heading text-xl text-foreground">
            Le Radar se construit.
          </p>
          <p className="text-sm text-muted-light">
            Le Radar trace les joueurs éligibles ou à ascendance RDC dans les
            championnats du monde. La cartographie initiale arrive à la prochaine
            mise à jour.
          </p>
        </>
      ) : (
        <>
          <p className="display-heading text-xl text-foreground">
            Aucun talent ne matche.
          </p>
          <p className="text-sm text-muted-light">
            Sur les{" "}
            {radarTotal ? `${radarTotal} profils` : "profils"} du Radar, cette
            combinaison de filtres ne renvoie rien. Essaie un poste ou un tier
            plus large.
          </p>
          <Button variant="outline" size="sm" onClick={onReset}>
            Réinitialiser les filtres
          </Button>
        </>
      )}
    </div>
  );
}
