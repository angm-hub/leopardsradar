import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PlayerCard from "@/components/home/PlayerCard";
import PlayerCardSkeleton from "@/components/ui/PlayerCardSkeleton";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Select } from "@/components/ui/SelectPrimitive";
import { RosterHero } from "@/components/roster/RosterHero";
import { PositionSection } from "@/components/roster/PositionSection";
import { PlayerTable } from "@/components/roster/PlayerTable";
import { RosterModeToggle, type RosterMode } from "@/components/roster/RosterModeToggle";
import { RosterMoversSection } from "@/components/roster/RosterMoversSection";
import { TopScorersBlock } from "@/components/roster/TopScorersBlock";
import { TopGABlock } from "@/components/roster/TopGABlock";
import { DesabreXI } from "@/components/roster/DesabreXI";
import { usePlayers } from "@/hooks/usePlayers";
import { useHomeStats } from "@/hooks/useHomeStats";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import type { DBPosition } from "@/types/dbPlayer";

const POSITION_ORDER: DBPosition[] = [
  "Goalkeeper",
  "Defender",
  "Midfield",
  "Attack",
];

type PositionFilter = "ALL" | DBPosition;
type SortKey = "VALUE_DESC" | "CAPS_DESC" | "NAME_ASC" | "AGE_ASC" | "AGE_DESC";

const POSITION_OPTIONS: { value: PositionFilter; label: string }[] = [
  { value: "ALL", label: "Tous postes" },
  { value: "Goalkeeper", label: "Gardien" },
  { value: "Defender", label: "Défenseur" },
  { value: "Midfield", label: "Milieu" },
  { value: "Attack", label: "Attaquant" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "VALUE_DESC", label: "Valeur marchande" },
  { value: "CAPS_DESC", label: "Caps RDC" },
  { value: "NAME_ASC", label: "Nom A-Z" },
  { value: "AGE_ASC", label: "Âge ↑" },
  { value: "AGE_DESC", label: "Âge ↓" },
];

// Valeurs URL → types app
function parsePosition(raw: string | null): PositionFilter {
  const valid: PositionFilter[] = ["ALL", "Goalkeeper", "Defender", "Midfield", "Attack"];
  return valid.includes(raw as PositionFilter) ? (raw as PositionFilter) : "ALL";
}

function parseSortKey(raw: string | null): SortKey {
  const valid: SortKey[] = ["VALUE_DESC", "CAPS_DESC", "NAME_ASC", "AGE_ASC", "AGE_DESC"];
  return valid.includes(raw as SortKey) ? (raw as SortKey) : "VALUE_DESC";
}

function parseMode(raw: string | null): RosterMode {
  return raw === "liste" || raw === "editorial" ? raw : "editorial";
}

const Roster = () => {
  useDocumentMeta({
    title: "Roster",
    description:
      "Le roster Léopards 2025/26 — internationaux RDC en activité, cartographiés par poste, valeur marchande, club et tier UEFA.",
  });

  const { players, loading, error } = usePlayers({
    category: "roster",
    excludeEligibilityStatus: "ineligible",
    orderBy: { column: "market_value_eur", ascending: false },
  });
  const { stats, loading: statsLoading } = useHomeStats();
  const rosterCount = stats?.roster_count;

  // ─── C1 : URL state sync ───────────────────────────────────────────────────
  // WHY : un utilisateur qui partage /roster?poste=Attack&tri=age_asc doit
  // retrouver exactement la même vue que celui qui l'a configurée. Sans URL
  // sync, refresh = perte de contexte, partage de lien = inutilisable.
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydratation initiale depuis les params URL
  const [position, setPositionState] = useState<PositionFilter>(
    () => parsePosition(searchParams.get("poste")),
  );
  const [sort, setSortState] = useState<SortKey>(
    () => parseSortKey(searchParams.get("tri")),
  );
  const [query, setQuery] = useState<string>(
    () => searchParams.get("q") ?? "",
  );
  const [debouncedQuery, setDebouncedQuery] = useState<string>(
    () => (searchParams.get("q") ?? "").trim().toLowerCase(),
  );

  // Persist user's mode preference — power users coming back default to "liste",
  // casuals stay on "editorial". Defaults to "editorial" when storage is empty.
  const [mode, setMode] = useState<RosterMode>(() => {
    const fromUrl = parseMode(searchParams.get("mode"));
    // Si l'URL contient un mode explicite, il prime sur localStorage.
    if (searchParams.has("mode")) return fromUrl;
    if (typeof window === "undefined") return "editorial";
    try {
      const saved = window.localStorage.getItem("lr_roster_mode");
      return saved === "liste" || saved === "editorial" ? saved : "editorial";
    } catch {
      return "editorial";
    }
  });

  // Persist mode dans localStorage à chaque changement
  useEffect(() => {
    try {
      window.localStorage.setItem("lr_roster_mode", mode);
    } catch {
      /* localStorage blocked — silent */
    }
  }, [mode]);

  // Setters avec sync URL — on fait un push (pas replace) pour que le bouton
  // Back du navigateur ramène au contexte précédent.
  // WHY : on reconstruit toujours les params depuis zéro pour éviter
  // d'écraser des params externes qui pourraient exister (ex. utm_*).
  const syncParams = (overrides: {
    poste?: PositionFilter;
    tri?: SortKey;
    q?: string;
    mode?: RosterMode;
  }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        const newPos = overrides.poste ?? position;
        const newTri = overrides.tri ?? sort;
        const newQ = overrides.q !== undefined ? overrides.q : query;
        const newMode = overrides.mode ?? mode;

        // Omettre les valeurs par défaut pour des URLs propres
        if (newPos === "ALL") next.delete("poste");
        else next.set("poste", newPos);

        if (newTri === "VALUE_DESC") next.delete("tri");
        else next.set("tri", newTri);

        const qTrimmed = newQ.trim();
        if (!qTrimmed) next.delete("q");
        else next.set("q", qTrimmed);

        if (newMode === "editorial") next.delete("mode");
        else next.set("mode", newMode);

        return next;
      },
      { replace: false },
    );
  };

  const setPosition = (val: PositionFilter) => {
    setPositionState(val);
    syncParams({ poste: val });
  };

  const setSort = (val: SortKey) => {
    setSortState(val);
    syncParams({ tri: val });
  };

  const handleModeChange = (val: RosterMode) => {
    setMode(val);
    syncParams({ mode: val });
  };

  // 300ms debounce sur la recherche — on sync l'URL uniquement au debounce
  // pour ne pas polluer l'historique à chaque frappe.
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = query.trim().toLowerCase();
      setDebouncedQuery(trimmed);
      syncParams({ q: query });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtersActive =
    position !== "ALL" || sort !== "VALUE_DESC" || debouncedQuery !== "";

  const reset = () => {
    setPositionState("ALL");
    setSortState("VALUE_DESC");
    setQuery("");
    // Réinitialisation URL : on supprime tous les params de filtre
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("poste");
        next.delete("tri");
        next.delete("q");
        return next;
      },
      { replace: false },
    );
  };

  const filtered = useMemo(() => {
    let list = players.filter((p) => {
      if (position !== "ALL" && p.position !== position) return false;
      if (debouncedQuery && !p.name.toLowerCase().includes(debouncedQuery)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sort === "AGE_ASC") return (a.age ?? 999) - (b.age ?? 999);
      if (sort === "AGE_DESC") return (b.age ?? 0) - (a.age ?? 0);
      if (sort === "CAPS_DESC") {
        const diff = (b.caps_rdc ?? 0) - (a.caps_rdc ?? 0);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      // VALUE_DESC default — NULLS LAST then alphabetical fallback
      const av = a.market_value_eur ?? -1;
      const bv = b.market_value_eur ?? -1;
      if (bv !== av) return bv - av;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [players, position, sort, debouncedQuery]);

  // Le mode éditorial est désactivé dès qu'un filtre est actif :
  // - filtre Poste : on ne veut pas montrer 4 sections vides
  // - filtre Tri non-VALUE_DESC : le hero est défini par la valeur
  // - search : on veut voir les résultats à plat
  const forcedListe = filtersActive;
  const effectiveMode: RosterMode = forcedListe ? "liste" : mode;

  // Group by position pour le mode éditorial — utilise `players` (non filtré)
  // car en éditorial il n'y a pas de filtre poste/search
  const grouped = useMemo(() => {
    const map = new Map<DBPosition, typeof players>();
    POSITION_ORDER.forEach((pos) => map.set(pos, []));
    players.forEach((p) => {
      if (p.position && map.has(p.position)) {
        map.get(p.position)!.push(p);
      }
    });
    return map;
  }, [players]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <header className="container-site pt-32 pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Roster</span>
          </nav>
          <h1 className="mt-4 display-heading text-5xl md:text-6xl text-foreground">
            Roster Léopards
          </h1>
          <p className="mt-3 text-lg text-muted-light">
            {`${statsLoading ? "—" : (rosterCount ?? "—")} internationaux RDC — Saison 2025/26`}
          </p>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Composition publique du staff RDC, mise à jour à chaque trêve internationale.
          </p>
        </header>

        {/* C2 — Section "Cette semaine, ça bouge" — avant la sticky filter bar,
            masquée dès qu'un filtre est actif. WHY : en mode filtré, la section
            movers n'a plus de contexte global ; l'utilisateur cherche quelque
            chose de précis, on ne distrait pas. */}
        <div className="container-site">
          <RosterMoversSection hidden={filtersActive} />
        </div>

        {/* Blocs éditoriaux stats — top buteurs, top G+A, 11 Desabre.
            Masqués dès qu'un filtre est actif : l'utilisateur cherche un joueur
            précis, les blocs agrégés n'ont plus de sens. */}
        {!filtersActive && (
          <div className="container-site mt-2 mb-6">
            <TopScorersBlock players={players} />
            <TopGABlock players={players} />
            <DesabreXI players={players} />
          </div>
        )}

        <div className="sticky top-16 z-20 bg-background/85 backdrop-blur-lg border-y border-border">
          <div className="container-site py-4 flex flex-wrap gap-3 items-center">
            <RosterModeToggle
              current={effectiveMode}
              onChange={handleModeChange}
              forcedListe={forcedListe}
            />
            <span className="hidden md:inline-block h-6 w-px bg-border mx-1" />

            <Select
              label="Poste"
              options={POSITION_OPTIONS}
              value={position}
              onChange={(e) => setPosition(e.target.value as PositionFilter)}
            />
            <Select
              label="Tri"
              options={SORT_OPTIONS}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            />

            <div className="relative flex-1 max-w-xs ml-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="search"
                placeholder="Rechercher un joueur…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-button pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted hover:border-border-hover focus:border-primary outline-none transition-colors"
              />
            </div>

            <span className="text-sm text-muted whitespace-nowrap">
              {(filtersActive ? filtered.length : (rosterCount ?? "—"))} joueur{(filtersActive ? filtered.length : (rosterCount ?? 0)) > 1 ? "s" : ""}
            </span>

            {filtersActive ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </Button>
            ) : null}
          </div>
        </div>

        <section className="container-site py-12">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <PlayerCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <p className="text-muted-light">Une erreur est survenue.</p>
              <p className="text-xs text-muted">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center max-w-md mx-auto">
              <Search className="h-10 w-10 text-foreground/30" />
              {players.length === 0 ? (
                <>
                  <p className="display-heading text-xl text-foreground">
                    Le roster est encore vide.
                  </p>
                  <p className="text-sm text-muted-light">
                    Mise à jour à chaque trêve internationale. La prochaine
                    convocation tombe d'ici quelques jours.
                  </p>
                </>
              ) : (
                <>
                  <p className="display-heading text-xl text-foreground">
                    Aucun Léopard avec ces filtres.
                  </p>
                  <p className="text-sm text-muted-light">
                    Sur les 65 internationaux du roster, aucun ne matche cette
                    combinaison. Essaie de changer le poste ou le tri.
                  </p>
                  <Button variant="outline" size="sm" onClick={reset}>
                    Réinitialiser les filtres
                  </Button>
                </>
              )}
            </div>
          ) : effectiveMode === "editorial" ? (
            <div className="space-y-16">
              <RosterHero players={players.slice(0, 3)} />
              {POSITION_ORDER.map((pos) => (
                <PositionSection
                  key={pos}
                  position={pos}
                  players={grouped.get(pos) ?? []}
                />
              ))}
            </div>
          ) : (
            // Mode Liste : tables denses Transfermarkt-style par poste,
            // construites depuis `filtered` (respecte search + sort + filtres).
            <div className="space-y-12">
              {POSITION_ORDER.map((pos) => (
                <PlayerTable
                  key={pos}
                  position={pos}
                  players={filtered.filter((p) => p.position === pos)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Roster;
