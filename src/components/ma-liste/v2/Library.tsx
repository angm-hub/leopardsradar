import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";
import type { SlotPosition } from "@/types/maListe";
import { SLOT_COMPATIBILITY } from "@/types/maListe";
import { useMaListeV2Store } from "@/store/maListeV2Store";

type FilterTab = "all" | "roster" | "radar";

interface LibraryProps {
  allPlayers: DBPlayer[];
  activeSlot: SlotPosition | null;
  onPickForSlot: (player: DBPlayer) => void;
  onPickForBench: (player: DBPlayer) => void;
  onDragStart: (player: DBPlayer) => void;
  onDragEnd: () => void;
}

export function Library({
  allPlayers, activeSlot, onPickForSlot, onPickForBench, onDragStart, onDragEnd,
}: LibraryProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const startingXI = useMaListeV2Store((s) => s.startingXI);
  const bench = useMaListeV2Store((s) => s.bench);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const placedSlugs = useMemo(() => {
    const set = new Set<string>();
    Object.values(startingXI).forEach((p) => p && set.add(p.slug));
    bench.forEach((p) => set.add(p.slug));
    return set;
  }, [startingXI, bench]);

  const filtered = useMemo(() => {
    let list = allPlayers;
    // Filtre par tab
    if (tab === "roster") list = list.filter((p) => p.player_category === "roster");
    else if (tab === "radar") list = list.filter((p) => p.player_category === "radar");
    // Filtre par compat slot si activeSlot
    if (activeSlot) {
      const compat = SLOT_COMPATIBILITY[activeSlot];
      list = list.filter((p) => p.position && compat.includes(p.position));
    }
    // Filtre par search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.current_club ?? "").toLowerCase().includes(q),
      );
    }
    // Sort : roster d'abord, puis caps_rdc desc, puis market_value desc
    return list.slice().sort((a, b) => {
      if (a.player_category !== b.player_category) {
        return a.player_category === "roster" ? -1 : 1;
      }
      if ((a.caps_rdc ?? 0) !== (b.caps_rdc ?? 0)) {
        return (b.caps_rdc ?? 0) - (a.caps_rdc ?? 0);
      }
      return (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0);
    });
  }, [allPlayers, tab, activeSlot, search]);

  const handlePick = (p: DBPlayer) => {
    if (placedSlugs.has(p.slug)) return;
    if (activeSlot) onPickForSlot(p);
    else onPickForBench(p);
  };

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Search */}
      <div className="relative border-b border-border p-3">
        <Search className="absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cherche un nom, un club…"
          className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-12 font-v2-body text-[13px] text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none transition-colors"
        />
        <kbd className="absolute right-5 top-1/2 -translate-y-1/2 font-v2-mono text-[9px] text-foreground/35 border border-border rounded px-1 py-px hidden sm:block">
          ⌘K
        </kbd>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-border">
        {(["all", "roster", "radar"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "py-2 font-v2-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
              tab === t
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-foreground/55 hover:text-foreground",
            )}
          >
            {t === "all" ? "Tous" : t === "roster" ? "Roster" : "Radar"}
          </button>
        ))}
      </div>

      {/* Active slot hint */}
      {activeSlot && (
        <div className="border-b border-border bg-primary/5 px-3 py-2 text-[11px] text-primary/90 font-v2-mono">
          Cherche un {activeSlot} · tap pour placer
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center font-v2-body text-[13px] text-foreground/45">
            Rien ne match.
          </div>
        ) : (
          <ul>
            {filtered.map((p) => {
              const placed = placedSlugs.has(p.slug);
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    draggable={!placed}
                    onDragStart={(e) => {
                      if (placed) return;
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", p.slug);
                      onDragStart(p);
                    }}
                    onDragEnd={onDragEnd}
                    onClick={() => handlePick(p)}
                    disabled={placed}
                    className={cn(
                      "group flex w-full items-center gap-3 border-b border-border/50 px-3 py-2 text-left transition-colors",
                      placed
                        ? "opacity-40 cursor-default"
                        : "hover:bg-background cursor-pointer",
                    )}
                  >
                    <PlayerAvatar
                      name={p.name}
                      src={p.image_url}
                      className="h-9 w-9 rounded-full shrink-0"
                      initialsClassName="text-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-v2-body text-[13px] font-medium text-foreground">
                          {p.name}
                        </p>
                        {(p.caps_rdc ?? 0) > 0 && (
                          <span className="font-v2-mono text-[9px] text-cobalt-mist shrink-0">
                            {p.caps_rdc}c
                          </span>
                        )}
                      </div>
                      <p className="truncate font-v2-mono text-[10px] uppercase tracking-[0.04em] text-foreground/45">
                        {(p.current_club ?? "—")} · {p.position ? POSITION_LABEL[p.position] : "—"}
                      </p>
                    </div>
                    {placed && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={2.5} />
                    )}
                    {!placed && (p.nationalities || []).includes("DR Congo") && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" title="DR Congo" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer count */}
      <div className="border-t border-border bg-background/40 px-3 py-2 font-v2-mono text-[10px] uppercase tracking-[0.08em] text-foreground/45">
        {filtered.length} disponibles
      </div>
    </div>
  );
}
