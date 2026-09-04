import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import { useMaListeV2Store } from "@/store/maListeV2Store";

type FilterTab = "all" | "roster" | "radar";
type PosFilter = "all" | DBPosition;

// Filtre par poste — sert à retrouver les candidats d'un poste précis sans
// scroller tout le pool (on compose une convocation, on raisonne par ligne).
const POS_TABS: { value: PosFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "Goalkeeper", label: "GAR" },
  { value: "Defender", label: "DÉF" },
  { value: "Midfield", label: "MIL" },
  { value: "Attack", label: "ATT" },
];

// Cap de rendu : la pioche peut contenir ~1000 joueurs. Tout monter d'un coup
// = surcharge de choix + DOM lourd (audit lisibilité 11/08/2026). On rend un
// premier lot, « Voir plus » révèle la suite. La recherche/les filtres
// resserrent bien en-deçà du cap dans le cas courant.
const PAGE_SIZE = 60;

interface LibraryProps {
  allPlayers: DBPlayer[];
  loading?: boolean;
  error?: string | null;
  /** Compat ascendante avec ancien layout — ignoré dans le nouveau modèle */
  activeSlot?: string | null;
  onPickForSlot: (player: DBPlayer) => void;
  onPickForBench: (player: DBPlayer) => void;
  onDragStart: (player: DBPlayer) => void;
  onDragEnd: () => void;
  /** Poste à focaliser (déclenché en cliquant un slot vide du terrain). */
  focusPosition?: DBPosition | null;
  /** Nonce bumpé à chaque demande de focus, pour re-déclencher sur re-clic. */
  focusKey?: number;
}

export function Library({
  allPlayers, loading, error, onPickForSlot, onDragStart, onDragEnd,
  focusPosition, focusKey,
}: LibraryProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [posFilter, setPosFilter] = useState<PosFilter>("all");

  // Le terrain pilote la pioche : un slot vide cliqué focalise le poste.
  useEffect(() => {
    if (focusPosition) {
      setPosFilter(focusPosition);
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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
    // Garde-fou défensif : exclure les joueurs archivés et dédupliquer par slug
    // avant tout filtre UI — protège contre les doublons résiduels en cas de
    // cache React Query ou d'archive DB incomplète au moment du fetch.
    const seenSlugs = new Set<string>();
    let list = allPlayers.filter((p) => {
      if ((p as unknown as Record<string, unknown>)["archived"] === true) return false;
      if (seenSlugs.has(p.slug)) return false;
      seenSlugs.add(p.slug);
      return true;
    });
    if (tab === "roster") list = list.filter((p) => p.player_category === "roster");
    else if (tab === "radar") list = list.filter((p) => p.player_category === "radar");
    if (posFilter !== "all") list = list.filter((p) => p.position === posFilter);
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
  }, [allPlayers, tab, posFilter, search]);

  // Revenir au premier lot dès qu'un filtre change (sinon un « Voir plus »
  // d'une recherche précédente laisse un cap gonflé sur un pool resserré).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tab, posFilter, search]);

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

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

      {/* Filtre par poste — segmented compact */}
      <div className="flex gap-1 border-b border-border/60 bg-background/20 p-2">
        {POS_TABS.map((pt) => (
          <button
            key={pt.value}
            type="button"
            onClick={() => setPosFilter(pt.value)}
            className={cn(
              "flex-1 rounded-md py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] font-semibold transition-colors",
              posFilter === pt.value
                ? "bg-primary/15 text-primary"
                : "text-foreground/45 hover:text-foreground/80 hover:bg-background/50",
            )}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ul aria-busy="true" aria-label="Chargement des joueurs">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="px-2">
                <div className="my-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <span className="h-11 w-11 rounded-full bg-foreground/5 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <span className="block h-3 w-2/3 rounded bg-foreground/5 animate-pulse" />
                    <span className="block h-2 w-1/2 rounded bg-foreground/5 animate-pulse" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="py-12 px-6 text-center font-sans text-[13px] text-blood/80">
            Connexion impossible.
            <span className="block mt-1 text-foreground/40 text-[11px] font-mono uppercase tracking-[0.06em]">
              Recharge la page dans un instant.
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center font-sans text-[13px] text-foreground/45">
            Aucun résultat.
          </div>
        ) : (
          <ul>
            {visible.map((p) => {
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
                    aria-label={placed ? `${p.name} déjà dans ta liste` : `Ajouter ${p.name} à la convocation`}
                    className={cn(
                      "group relative my-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-background/80",
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
                        {(p.current_club ?? "n.d.")} · {p.position ? POSITION_LABEL[p.position] : "n.d."}
                      </p>
                    </div>
                    {placed && (
                      <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              );
            })}
            {remaining > 0 && (
              <li className="px-2 py-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="w-full rounded-lg border border-border/60 bg-background/40 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] font-semibold text-foreground/60 hover:text-foreground hover:border-border-hover hover:bg-background/70 transition-colors"
                >
                  Voir {Math.min(remaining, PAGE_SIZE)} de plus
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Footer count */}
      <div className="border-t border-border bg-background/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/45">
        {remaining > 0
          ? `${visible.length} sur ${filtered.length} affichés`
          : `${filtered.length} disponible${filtered.length > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
