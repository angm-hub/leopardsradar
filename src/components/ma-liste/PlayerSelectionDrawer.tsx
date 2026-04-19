import { useState, useMemo, useEffect } from "react";
import { X, Search, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMaListeStore } from "@/store/maListeStore";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  POSITION_LABEL,
  formatMarketValue,
} from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";
import type { SlotPosition } from "@/types/maListe";
import { SLOT_COMPATIBILITY } from "@/types/maListe";

interface PlayerSelectionDrawerProps {
  slot: SlotPosition | null;
  onClose: () => void;
  allPlayers: DBPlayer[];
}

type FilterType = "all" | "roster" | "radar";

export function PlayerSelectionDrawer({
  slot,
  onClose,
  allPlayers,
}: PlayerSelectionDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const placePlayerInSlot = useMaListeStore((s) => s.placePlayerInSlot);
  const getAvailablePlayers = useMaListeStore((s) => s.getAvailablePlayers);
  const startingXI = useMaListeStore((s) => s.startingXI);
  const bench = useMaListeStore((s) => s.bench);

  // Reset filters when slot changes / closes
  useEffect(() => {
    if (slot) {
      setSearchQuery("");
      setFilterType("all");
    }
  }, [slot]);

  // Lock body scroll while open
  useEffect(() => {
    if (slot) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [slot]);

  // ESC to close
  useEffect(() => {
    if (!slot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slot, onClose]);

  const compatiblePositions = slot ? SLOT_COMPATIBILITY[slot] : [];

  const filteredPlayers = useMemo(() => {
    if (!slot) return [];
    // Available = not used elsewhere in XI/bench
    let players = getAvailablePlayers(allPlayers);

    // Compatible positions for this slot
    players = players.filter(
      (p) => p.position && compatiblePositions.includes(p.position),
    );

    // Filter by category
    if (filterType === "roster") {
      players = players.filter((p) => p.player_category === "roster");
    } else if (filterType === "radar") {
      players = players.filter((p) => p.player_category === "radar");
    }

    // Search by name or club
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      players = players.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.current_club ?? "").toLowerCase().includes(q),
      );
    }

    // Sort: roster first, then by market value desc
    return players.slice().sort((a, b) => {
      if (a.player_category !== b.player_category) {
        if (a.player_category === "roster") return -1;
        if (b.player_category === "roster") return 1;
      }
      return (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    slot,
    searchQuery,
    filterType,
    allPlayers,
    startingXI,
    bench,
  ]);

  const handleSelect = (player: DBPlayer) => {
    if (!slot) return;
    placePlayerInSlot(slot, player);
    onClose();
  };

  return (
    <AnimatePresence>
      {slot && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Choisir un joueur pour le poste ${slot}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-foreground">
                  Choisir un joueur
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
                  Poste · {slot}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted hover:bg-background hover:text-foreground transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-3 border-b border-border p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un nom ou un club…"
                  className="w-full rounded-button border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                {(["all", "roster", "radar"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "flex-1 rounded-button px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
                      filterType === type
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted hover:text-foreground",
                    )}
                  >
                    {type === "all"
                      ? "Tous"
                      : type === "roster"
                        ? "Roster"
                        : "Radar"}
                  </button>
                ))}
              </div>
            </div>

            {/* Player list */}
            <div className="flex-1 overflow-y-auto p-3">
              {filteredPlayers.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted">Aucun joueur trouvé.</p>
                  <p className="mt-2 text-xs text-muted">
                    Essaie un autre filtre ou élargis ta recherche.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredPlayers.map((player) => (
                    <li key={player.slug}>
                      <button
                        onClick={() => handleSelect(player)}
                        className="group flex w-full items-center gap-3 rounded-card border border-border bg-background p-3 text-left transition-all hover:border-primary hover:bg-card-hover"
                      >
                        {/* Photo */}
                        <div className="relative shrink-0">
                          <PlayerAvatar
                            name={player.name}
                            src={player.image_url}
                            className="h-12 w-12 rounded-full"
                            initialsClassName="text-sm"
                          />
                          {player.player_category === "radar" && (
                            <span
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                              title="Radar"
                            >
                              <Zap className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {player.name}
                          </p>
                          <p className="truncate text-xs text-muted-light">
                            <span>{player.current_club ?? "Sans club"}</span>
                            <span className="mx-1.5 text-muted">·</span>
                            <span>
                              {player.position
                                ? POSITION_LABEL[player.position]
                                : "—"}
                            </span>
                            {player.market_value_eur ? (
                              <>
                                <span className="mx-1.5 text-muted">·</span>
                                <span className="font-mono">
                                  {formatMarketValue(player.market_value_eur)}
                                </span>
                              </>
                            ) : null}
                          </p>
                          {player.player_category === "radar" && (
                            <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-primary/80">
                              Éligibilité théorique · Non convocable actuel
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default PlayerSelectionDrawer;
