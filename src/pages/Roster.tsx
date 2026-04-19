import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PlayerCard from "@/components/home/PlayerCard";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Select } from "@/components/ui/SelectPrimitive";
import { MOCK_PLAYERS } from "@/data/mockPlayers";
import type { League, PositionCode } from "@/types/player";

type PositionFilter = "ALL" | PositionCode;
type LeagueFilter = "ALL" | League;
type AgeFilter = "ALL" | "U23" | "23_30" | "30_PLUS";
type SortKey = "VALUE_DESC" | "NAME_ASC" | "CAPS_DESC";

const POSITION_OPTIONS: { value: PositionFilter; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "GK", label: "Gardien" },
  { value: "DEF", label: "Défenseur" },
  { value: "MID", label: "Milieu" },
  { value: "ATT", label: "Attaquant" },
];

const LEAGUE_OPTIONS: { value: LeagueFilter; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "Premier League", label: "Premier League" },
  { value: "Ligue 1", label: "Ligue 1" },
  { value: "La Liga", label: "La Liga" },
  { value: "Serie A", label: "Serie A" },
  { value: "Bundesliga", label: "Bundesliga" },
  { value: "Other Europe", label: "Autre Europe" },
  { value: "Africa", label: "Afrique" },
  { value: "Middle East", label: "Moyen-Orient" },
  { value: "Other", label: "Autre" },
];

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "U23", label: "U23" },
  { value: "23_30", label: "23-30" },
  { value: "30_PLUS", label: "30+" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "VALUE_DESC", label: "Valeur ↓" },
  { value: "NAME_ASC", label: "Nom A-Z" },
  { value: "CAPS_DESC", label: "Sélections ↓" },
];

const Roster = () => {
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [league, setLeague] = useState<LeagueFilter>("ALL");
  const [age, setAge] = useState<AgeFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("VALUE_DESC");
  const [query, setQuery] = useState("");

  const filtersActive =
    position !== "ALL" ||
    league !== "ALL" ||
    age !== "ALL" ||
    sort !== "VALUE_DESC" ||
    query.trim() !== "";

  const reset = () => {
    setPosition("ALL");
    setLeague("ALL");
    setAge("ALL");
    setSort("VALUE_DESC");
    setQuery("");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = MOCK_PLAYERS.filter((p) => {
      if (position !== "ALL" && p.position !== position) return false;
      if (league !== "ALL" && p.league !== league) return false;
      if (age === "U23" && p.age >= 23) return false;
      if (age === "23_30" && (p.age < 23 || p.age > 30)) return false;
      if (age === "30_PLUS" && p.age <= 30) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sort === "CAPS_DESC") return b.capsRdc - a.capsRdc;
      return b.marketValueEur - a.marketValueEur;
    });

    return list;
  }, [position, league, age, sort, query]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Page header */}
        <header className="container-site pt-32 pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <a href="/" className="hover:text-foreground transition-colors">
              Home
            </a>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Roster</span>
          </nav>
          <h1 className="mt-4 font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
            Roster Léopards
          </h1>
          <p className="mt-3 text-lg text-muted-light">
            {MOCK_PLAYERS.length} joueurs appelés ou éligibles — Saison 2025/26
          </p>
        </header>

        {/* Sticky filter bar */}
        <div className="sticky top-16 z-20 bg-background/85 backdrop-blur-lg border-y border-border">
          <div className="container-site py-4 flex flex-wrap gap-3 items-center">
            <Select
              label="Poste"
              options={POSITION_OPTIONS}
              value={position}
              onChange={(e) => setPosition(e.target.value as PositionFilter)}
            />
            <Select
              label="Ligue"
              options={LEAGUE_OPTIONS}
              value={league}
              onChange={(e) => setLeague(e.target.value as LeagueFilter)}
            />
            <Select
              label="Âge"
              options={AGE_OPTIONS}
              value={age}
              onChange={(e) => setAge(e.target.value as AgeFilter)}
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
              {filtered.length} joueur{filtered.length > 1 ? "s" : ""}
            </span>

            {filtersActive ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </Button>
            ) : null}
          </div>
        </div>

        {/* Grid */}
        <section className="container-site py-12">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <Search className="h-10 w-10 text-foreground/30" />
              <p className="text-muted-light">Aucun joueur ne correspond.</p>
              <Button variant="outline" size="sm" onClick={reset}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((player) => (
                <PlayerCard key={player.slug} player={player} />
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
