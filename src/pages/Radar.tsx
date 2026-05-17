import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, X, Sparkles, Heart } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
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
import { RadarCanvas } from "@/components/radar/RadarCanvas";
import { RadarHighlights } from "@/components/radar/RadarHighlights";
import { ProStatsBlock } from "@/components/radar/ProStatsBlock";
import {
  AdvancedFilters,
  ADVANCED_FILTERS_DEFAULT,
  type AdvancedFilterState,
} from "@/components/radar/AdvancedFilters";
import {
  POSITION_BADGE,
  POSITION_DOT,
  POSITION_LABEL,
  flagFor,
  formatMarketValue,
} from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPlayer, DBPosition, DBTier } from "@/types/dbPlayer";

type PositionFilter = "ALL" | DBPosition;
type TierFilter = "ALL" | DBTier;

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

// ── URL state helpers ────────────────────────────────────────────────────────

function readSearchParam(params: URLSearchParams, key: string, def: string): string {
  return params.get(key) ?? def;
}

function readNumParam(params: URLSearchParams, key: string, def: number): number {
  const v = params.get(key);
  if (!v) return def;
  const n = parseInt(v, 10);
  return isNaN(n) ? def : n;
}

// ── Cards ────────────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  if (category === "radar") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        <Sparkles className="h-3 w-3" /> Eligible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
      <Heart className="h-3 w-3" /> Heritage
    </span>
  );
}

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Radar() {
  useDocumentMeta({
    title: "Radar",
    description:
      "Le Radar Leopards — talents eligibles RDC et diaspora binationale, cartographies par valeur marchande, jeunesse et tier UEFA.",
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

  // ── URL state ──────────────────────────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();

  // Lire les filtres depuis l'URL (avec fallback sur les défauts)
  const position = (readSearchParam(searchParams, "pos", "ALL")) as PositionFilter;
  const tier = (readSearchParam(searchParams, "tier", "ALL")) as TierFilter;
  const nation = readSearchParam(searchParams, "nat", "ALL");
  const query = readSearchParam(searchParams, "q", "");

  const advancedState: AdvancedFilterState = {
    ageMin: readNumParam(searchParams, "ageMin", ADVANCED_FILTERS_DEFAULT.ageMin),
    ageMax: readNumParam(searchParams, "ageMax", ADVANCED_FILTERS_DEFAULT.ageMax),
    valueMin: readNumParam(searchParams, "valMin", ADVANCED_FILTERS_DEFAULT.valueMin),
    valueMax: readNumParam(searchParams, "valMax", ADVANCED_FILTERS_DEFAULT.valueMax),
    foot: (readSearchParam(searchParams, "foot", "ALL")) as AdvancedFilterState["foot"],
    withPhoto: searchParams.get("photo") === "1",
    withActiveContract: searchParams.get("contrat") === "1",
  };

  // Helper pour mettre à jour l'URL proprement (sans repousser toute l'entrée)
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(updates)) {
            const isDefault =
              v === null ||
              v === "" ||
              v === "ALL" ||
              (k === "ageMin" && v === String(ADVANCED_FILTERS_DEFAULT.ageMin)) ||
              (k === "ageMax" && v === String(ADVANCED_FILTERS_DEFAULT.ageMax)) ||
              (k === "valMin" && v === String(ADVANCED_FILTERS_DEFAULT.valueMin)) ||
              (k === "valMax" && v === String(ADVANCED_FILTERS_DEFAULT.valueMax));
            if (isDefault) {
              next.delete(k);
            } else {
              next.set(k, v as string);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPosition = (v: PositionFilter) => updateParams({ pos: v });
  const setTier = (v: TierFilter) => updateParams({ tier: v });
  const setNation = (v: string) => updateParams({ nat: v });

  // Debounce sur le champ search — on garde un état local pour la saisie
  const [localQuery, setLocalQuery] = useState(query);
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => {
      updateParams({ q: localQuery.trim().toLowerCase() });
    }, 300);
    return () => clearTimeout(t);
  }, [localQuery, updateParams]);

  const setAdvanced = useCallback(
    (next: AdvancedFilterState) => {
      updateParams({
        ageMin: next.ageMin !== ADVANCED_FILTERS_DEFAULT.ageMin ? String(next.ageMin) : null,
        ageMax: next.ageMax !== ADVANCED_FILTERS_DEFAULT.ageMax ? String(next.ageMax) : null,
        valMin: next.valueMin !== ADVANCED_FILTERS_DEFAULT.valueMin ? String(next.valueMin) : null,
        valMax: next.valueMax !== ADVANCED_FILTERS_DEFAULT.valueMax ? String(next.valueMax) : null,
        foot: next.foot !== "ALL" ? next.foot : null,
        photo: next.withPhoto ? "1" : null,
        contrat: next.withActiveContract ? "1" : null,
      });
    },
    [updateParams],
  );

  // Vue — pas en URL pour ne pas polluer le share link
  const [view, setView] = useState<RadarView>(() => {
    if (typeof window === "undefined") return "liste";
    return window.matchMedia("(min-width: 768px)").matches ? "carte" : "liste";
  });

  // ── Dropdown nationalités dynamique ───────────────────────────────────────
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
      { value: "ALL", label: `Toutes nationalites (${players.length})` },
      ...sorted.map(([n, count]) => ({
        value: n,
        label: `${flagFor(n)} ${n} (${count})`,
      })),
    ];
  }, [players]);

  // ── Filtre combiné ────────────────────────────────────────────────────────
  const debouncedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return players.filter((p) => {
      if (p.eligibility_status === "ineligible") return false;

      // Filtres de base
      if (position !== "ALL" && p.position !== position) return false;
      if (tier !== "ALL" && p.tier !== tier) return false;
      if (nation !== "ALL" && !p.other_nationalities.includes(nation)) return false;
      if (debouncedQuery && !p.name.toLowerCase().includes(debouncedQuery)) return false;

      // Filtres avancés — âge
      if (p.age !== null) {
        if (p.age < advancedState.ageMin || p.age > advancedState.ageMax) return false;
      } else {
        // Si l'âge est null et le slider a bougé, exclure le joueur
        if (
          advancedState.ageMin !== ADVANCED_FILTERS_DEFAULT.ageMin ||
          advancedState.ageMax !== ADVANCED_FILTERS_DEFAULT.ageMax
        )
          return false;
      }

      // Valeur marchande (en M€, player.market_value_eur est en €)
      const valueM = (p.market_value_eur ?? 0) / 1_000_000;
      const effectiveMax =
        advancedState.valueMax >= 50 ? Infinity : advancedState.valueMax;
      if (valueM < advancedState.valueMin || valueM > effectiveMax) return false;

      // Pied fort
      if (advancedState.foot !== "ALL") {
        if (!p.foot || p.foot !== advancedState.foot) return false;
      }

      // Avec photo
      if (advancedState.withPhoto && !p.image_url && !p.image_url_alt) return false;

      // Contrat actif
      if (advancedState.withActiveContract) {
        if (!p.contract_expires || p.contract_expires < today) return false;
      }

      return true;
    });
  }, [
    players,
    position,
    tier,
    nation,
    debouncedQuery,
    advancedState.ageMin,
    advancedState.ageMax,
    advancedState.valueMin,
    advancedState.valueMax,
    advancedState.foot,
    advancedState.withPhoto,
    advancedState.withActiveContract,
  ]);

  // ── Etat actif ────────────────────────────────────────────────────────────
  const basicFiltersActive =
    position !== "ALL" || tier !== "ALL" || nation !== "ALL" || debouncedQuery !== "";

  const advancedFiltersActive =
    advancedState.ageMin !== ADVANCED_FILTERS_DEFAULT.ageMin ||
    advancedState.ageMax !== ADVANCED_FILTERS_DEFAULT.ageMax ||
    advancedState.valueMin !== ADVANCED_FILTERS_DEFAULT.valueMin ||
    advancedState.valueMax !== ADVANCED_FILTERS_DEFAULT.valueMax ||
    advancedState.foot !== "ALL" ||
    advancedState.withPhoto ||
    advancedState.withActiveContract;

  const filtersActive = basicFiltersActive || advancedFiltersActive;

  const reset = () => {
    setLocalQuery("");
    // Supprimer tous les params de filtre
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <header className="container-site pt-32 pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Radar</span>
          </nav>
          <h1 className="mt-4 display-heading text-5xl md:text-6xl text-foreground">
            Le Radar.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-light">
            {`${radarTotal ?? "—"} joueurs eligibles ou a ascendance RDC dans le monde.`}
          </p>
        </header>

        {/* Barre de filtres sticky */}
        <div className="sticky top-16 z-20 bg-background/85 backdrop-blur-lg border-y border-border">
          <div className="container-site py-4 flex flex-wrap gap-3 items-center">
            <ViewTabs current={view} onChange={setView} />

            <span className="hidden md:inline-block h-6 w-px bg-border mx-1" />

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

            {/* Filtres avancés */}
            <AdvancedFilters state={advancedState} onChange={setAdvanced} />

            <div className="relative flex-1 max-w-xs ml-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="search"
                placeholder="Rechercher un joueur…"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-button pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted hover:border-border-hover focus:border-primary outline-none transition-colors"
              />
            </div>

            {/* Compteur live */}
            <span className="text-sm text-muted whitespace-nowrap">
              <span className="text-foreground font-mono font-semibold">{filtered.length}</span>
              {radarTotal ? (
                <span className="text-muted"> / {radarTotal}</span>
              ) : null}
            </span>

            {filtersActive ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-3.5 w-3.5" /> Reinitialiser
              </Button>
            ) : null}
          </div>
        </div>

        {/* Pepites de la semaine — ancrage editorial */}
        <RadarHighlights />

        {/* Bloc stats saison — top G+A, buts, temps de jeu parmi les talents radar */}
        <ProStatsBlock players={players} />

        <section className="container-site py-12">
          {loading ? (
            view === "carte" ? (
              <div className="aspect-square md:aspect-[4/3] w-full rounded-card border border-border/60 bg-card animate-pulse" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <PlayerCardSkeleton key={i} />
                ))}
              </div>
            )
          ) : error ? (
            <p className="py-16 text-center text-muted-light">{error}</p>
          ) : filtered.length === 0 && view !== "carte" ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center max-w-md mx-auto">
              <Search className="h-10 w-10 text-foreground/30" />
              {players.length === 0 ? (
                <>
                  <p className="display-heading text-xl text-foreground">
                    Le Radar se construit.
                  </p>
                  <p className="text-sm text-muted-light">
                    Le Radar trace les joueurs eligibles ou a ascendance RDC
                    dans les championnats du monde. La cartographie initiale
                    arrive a la prochaine mise a jour.
                  </p>
                </>
              ) : (
                <>
                  <p className="display-heading text-xl text-foreground">
                    Aucun talent ne matche.
                  </p>
                  <p className="text-sm text-muted-light">
                    Sur les{" "}
                    {radarTotal ? `${radarTotal} profils` : "profils"} du Radar,
                    cette combinaison de filtres ne renvoie rien. Essaie un
                    poste, un tier ou une plage d'age plus large.
                  </p>
                  <Button variant="outline" size="sm" onClick={reset}>
                    Reinitialiser les filtres
                  </Button>
                </>
              )}
            </div>
          ) : view === "carte" ? (
            <RadarCanvas players={filtered} totalRoster={players.length} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p) => (
                <RadarCard key={p.slug} player={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
