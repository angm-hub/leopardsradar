import { useState, useMemo } from "react";
import { Search, Zap, Users } from "lucide-react";
import { useMaListeStore } from "@/store/maListeStore";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  POSITION_LABEL,
  formatMarketValue,
} from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import type { SlotPosition } from "@/types/maListe";
import { SLOT_COMPATIBILITY } from "@/types/maListe";

interface BuilderLibraryProps {
  allPlayers: DBPlayer[];
  /** slot actuellement actif sur le pitch — filtre la library par compatibilité */
  activeSlot: SlotPosition | null;
  /** quand on click un joueur, soit on remplit le slot actif soit on ajoute au banc */
  onPickForSlot: (player: DBPlayer) => void;
  onPickForBench: (player: DBPlayer) => void;
}

type FilterType = "all" | "roster" | "radar";
type PosFilter = "all" | DBPosition;

const POS_FILTERS: { value: PosFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "Goalkeeper", label: "GK" },
  { value: "Defender", label: "Déf" },
  { value: "Midfield", label: "Mil" },
  { value: "Attack", label: "Att" },
];

/**
 * BuilderLibrary — sidebar permanente listant les joueurs disponibles.
 *
 * Remplace le PlayerSelectionDrawer modal par un panneau toujours
 * visible. Quand un slot est actif sur le pitch, la library auto-filtre
 * par positions compatibles. Sinon, mode "ajouter au banc" actif.
 *
 * Recherche par nom/club, filtres roster/radar et poste.
 */
export function BuilderLibrary({
  allPlayers,
  activeSlot,
  onPickForSlot,
  onPickForBench,
}: BuilderLibraryProps) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<FilterType>("all");
  const [filterPos, setFilterPos] = useState<PosFilter>("all");

  const getAvailablePlayers = useMaListeStore((s) => s.getAvailablePlayers);
  const startingXI = useMaListeStore((s) => s.startingXI);
  const bench = useMaListeStore((s) => s.bench);

  const filtered = useMemo(() => {
    let players = getAvailablePlayers(allPlayers);

    // Si slot actif → filtre par positions compatibles
    if (activeSlot) {
      const compat = SLOT_COMPATIBILITY[activeSlot];
      players = players.filter(
        (p) => p.position && compat.includes(p.position),
      );
    } else if (filterPos !== "all") {
      players = players.filter((p) => p.position === filterPos);
    }

    if (filterCat === "roster") {
      players = players.filter((p) => p.player_category === "roster");
    } else if (filterCat === "radar") {
      players = players.filter((p) => p.player_category === "radar");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      players = players.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.current_club ?? "").toLowerCase().includes(q),
      );
    }

    return players.slice().sort((a, b) => {
      if (a.player_category !== b.player_category) {
        if (a.player_category === "roster") return -1;
        if (b.player_category === "roster") return 1;
      }
      return (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0);
    });
  }, [
    allPlayers,
    activeSlot,
    filterCat,
    filterPos,
    search,
    startingXI,
    bench,
    getAvailablePlayers,
  ]);

  const handlePick = (player: DBPlayer) => {
    if (activeSlot) onPickForSlot(player);
    else onPickForBench(player);
  };

  const headerContext = activeSlot
    ? `Joueurs compatibles · ${activeSlot}`
    : bench.length < 15
      ? `Ajouter au banc · ${bench.length}/15`
      : "Banc complet — désélectionnez un joueur";

  return (
    <aside className="flex flex-col h-full rounded-card border border-border bg-card overflow-hidden">
      {/* Header contextuel */}
      <div className="border-b border-border px-4 py-3 bg-card/60">
        <div className="flex items-center gap-2">
          {activeSlot ? (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground font-mono text-[10px] font-bold">
              {activeSlot[0]}
            </span>
          ) : (
            <Users className="h-4 w-4 text-muted" />
          )}
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono truncate">
            {headerContext}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 space-y-2.5 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, club…"
            className="w-full rounded-button border border-border bg-background py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Filtres catégorie */}
        <div className="flex items-center gap-1">
          {(["all", "roster", "radar"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterCat(type)}
              className={cn(
                "flex-1 rounded-full px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors",
                filterCat === type
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted hover:text-foreground",
              )}
            >
              {type === "all" ? "Tous" : type === "roster" ? "Roster" : "Radar"}
            </button>
          ))}
        </div>

        {/* Filtres poste — caché si slot actif (filtre auto par compat) */}
        {!activeSlot ? (
          <div className="flex items-center gap-1">
            {POS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterPos(value)}
                className={cn(
                  "flex-1 rounded-full px-1.5 py-1 text-[9px] font-mono uppercase tracking-wider transition-colors",
                  filterPos === value
                    ? "bg-foreground/10 text-foreground border border-foreground/20"
                    : "border border-border text-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Counter */}
      <div className="px-4 py-1.5 text-[10px] font-mono text-muted-light border-b border-border">
        {filtered.length} joueur{filtered.length > 1 ? "s" : ""} dispo
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center px-4">
            <p className="text-sm text-muted">Aucun joueur trouvé.</p>
            <p className="mt-2 text-xs text-muted-light">
              {activeSlot
                ? "Aucun joueur compatible avec ce poste."
                : "Élargis les filtres."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((player) => {
              const benchFull = !activeSlot && bench.length >= 15;
              return (
                <li key={player.slug}>
                  <button
                    type="button"
                    disabled={benchFull}
                    onClick={() => handlePick(player)}
                    className={cn(
                      "group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      "hover:bg-card-hover",
                      benchFull && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <div className="relative shrink-0">
                      <PlayerAvatar
                        name={player.name}
                        src={player.image_url}
                        className="h-9 w-9 rounded-full ring-1 ring-border group-hover:ring-primary/50 transition-all"
                        initialsClassName="text-[10px]"
                      />
                      {player.player_category === "radar" && (
                        <span
                          className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          title="Radar"
                        >
                          <Zap className="h-2 w-2" strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-[13px] text-foreground group-hover:text-primary transition-colors leading-tight">
                        {player.name}
                      </p>
                      <p className="truncate text-[10px] text-muted leading-tight mt-0.5 font-mono">
                        {player.position
                          ? POSITION_LABEL[player.position].slice(0, 3)
                          : "—"}
                        {" · "}
                        {player.current_club ?? "Sans club"}
                      </p>
                    </div>

                    {player.market_value_eur && player.market_value_eur > 0 ? (
                      <span className="shrink-0 font-mono text-[10px] text-primary/85">
                        {formatMarketValue(player.market_value_eur)}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
