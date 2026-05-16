import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";
import { useMaListeV2Store } from "@/store/maListeV2Store";

type FilterTab = "all" | "roster" | "radar";

interface LibraryProps {
  allPlayers: DBPlayer[];
  /** Compat ascendante avec ancien layout — ignoré dans le nouveau modèle */
  activeSlot?: string | null;
  onPickForSlot: (player: DBPlayer) => void;
  onPickForBench: (player: DBPlayer) => void;
  onDragStart: (player: DBPlayer) => void;
  onDragEnd: () => void;
}

export function Library({
  allPlayers, onPickForSlot, onPickForBench, onDragStart, onDragEnd,
}: LibraryProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const starters = useMaListeV2Store((s) => s.starters);
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
    starters.forEach((p) => set.add(p.slug));
    bench.forEach((p) => set.add(p.slug));
    return set;
  }, [starters, bench]);

  const filtered = useMemo(() => {
    let list = allPlayers;
    if (tab === "roster") list = list.filter((p) => p.player_category === "roster");
    else if (tab === "radar") list = list.filter((p) => p.player_category === "radar");
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.current_club ?? "").toLowerCase().includes(q),
      );
    }
    return list.slice().sort((a, b) => {
      if (a.player_category !== b.player_category) {
        return a.player_category === "roster" ? -1 : 1;
      }
      if ((a.caps_rdc ?? 0) !== (b.caps_rdc ?? 0)) {
        return (b.caps_rdc ?? 0) - (a.caps_rdc ?? 0);
      }
      return (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0);
    });
  }, [allPlayers, tab, search]);

  const handlePick = (p: DBPlayer) => {
    if (placedSlugs.has(p.slug)) return;
    // Avec le nouveau modèle simplifié, on délègue à la page qui décide
    // (starter si pas plein, sinon bench)
    onPickForSlot(p);
  };

  return (
    <div
      className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl"
      style={{
        boxShadow:
          "0 20px 60px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Search */}
      <div className="relative border-b border-border/60 p-4">
        <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cherche un nom, un club…"
          className="w-full rounded-lg border border-border bg-background/60 py-2.5 pl-10 pr-14 font-sans text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
        />
        <kbd className="absolute right-7 top-1/2 -translate-y-1/2 font-mono text-[10px] text-foreground/45 border border-border/80 rounded px-1.5 py-px hidden sm:block bg-background/60">
          ⌘K
        </kbd>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-border/60 bg-background/40">
        {(["all", "roster", "radar"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative py-3 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors",
              tab === t
                ? "text-primary"
                : "text-foreground/45 hover:text-foreground/80",
            )}
          >
            {t === "all" ? "Tous" : t === "roster" ? "Roster" : "Radar"}
            {tab === t && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-12 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center font-sans text-[13px] text-foreground/45">
            Rien ne match.
          </div>
        ) : (
          <ul>
            {filtered.map((p) => {
              const placed = placedSlugs.has(p.slug);
              return (
                <li key={p.slug} className="px-2">
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
                      "group relative my-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                      placed
                        ? "opacity-30 cursor-default"
                        : "hover:bg-background/80 cursor-grab active:cursor-grabbing hover:translate-x-0.5",
                    )}
                  >
                    <div className="relative shrink-0">
                      {(p.nationalities || []).includes("DR Congo") && (
                        <span aria-hidden className="absolute inset-[-2px] rounded-full bg-primary/30 blur-sm" />
                      )}
                      <PlayerAvatar
                        name={p.name}
                        src={p.image_url}
                        className={cn(
                          "relative h-11 w-11 rounded-full border-2 transition-all",
                          (p.nationalities || []).includes("DR Congo")
                            ? "border-primary/40"
                            : "border-foreground/10 group-hover:border-foreground/30",
                        )}
                        initialsClassName="text-xs"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-sans text-[14px] font-medium text-foreground">
                          {p.name}
                        </p>
                        {(p.caps_rdc ?? 0) > 0 && (
                          <span className="font-mono text-[9px] text-primary/80 shrink-0">
                            {p.caps_rdc}c
                          </span>
                        )}
                      </div>
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.04em] text-foreground/45 mt-0.5">
                        {(p.current_club ?? "—")} · {p.position ? POSITION_LABEL[p.position] : "—"}
                      </p>
                    </div>
                    {placed && (
                      <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer count */}
      <div className="border-t border-border bg-background/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/45">
        {filtered.length} disponibles
      </div>
    </div>
  );
}
