import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { DBPlayer } from "@/types/dbPlayer";
import { usePlayerSearch } from "@/hooks/usePlayerSearch";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL, flagFor } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";

interface PlayerPickerProps {
  /** Anchor colour shown on the dot — uses COMPARE_COLORS hex strings. */
  accent: string;
  /** Slot label shown above the empty state ("Joueur 1", "Joueur 2"). */
  slotLabel: string;
  /** Currently selected player (if any). */
  player: DBPlayer | null;
  /** Slug to exclude from results — prevents picking the same player twice. */
  excludeSlug?: string | null;
  /** Triggered when the user picks a player from the dropdown. */
  onPick: (player: DBPlayer) => void;
  /** Triggered when the user clears the slot. */
  onClear: () => void;
}

/**
 * PlayerPicker — slot for one of the two compare positions.
 *
 * Two states :
 *   - empty   : large search input + dropdown of suggestions (debounced
 *               via usePlayerSearch)
 *   - selected: compact card with photo, name, club, and a "change"
 *               button that re-opens the search
 *
 * The accent dot at the top uses the same colour as the polygon for that
 * slot (yellow for A, green for B), so the user immediately associates
 * the slot with its silhouette.
 */
export function PlayerPicker({
  accent,
  slotLabel,
  player,
  excludeSlug,
  onPick,
  onClear,
}: PlayerPickerProps) {
  const [editing, setEditing] = useState(player === null);
  const [query, setQuery] = useState("");
  const { results, loading } = usePlayerSearch({ query, limit: 6 });
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Reset input when slot is filled or cleared from outside.
  useEffect(() => {
    if (player) setEditing(false);
    if (!player) setEditing(true);
  }, [player]);

  const filteredResults = excludeSlug
    ? results.filter((p) => p.slug !== excludeSlug)
    : results;

  // ---------- selected state ----------
  if (player && !editing) {
    return (
      <div className="rounded-card border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: accent }}
            />
            {slotLabel}
          </span>
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
            }}
            className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
            aria-label="Changer de joueur"
          >
            Changer
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card">
            <PlayerAvatar
              name={player.name}
              src={player.image_url}
              className="h-full w-full"
              initialsClassName="text-xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-xl text-foreground truncate">
              {player.name}
            </div>
            <div className="mt-1 text-sm text-muted-light truncate">
              {player.current_club ?? "Sans club"}
              {player.position ? (
                <>
                  <span className="mx-1.5 opacity-50">·</span>
                  {POSITION_LABEL[player.position]}
                </>
              ) : null}
            </div>
            {player.nationalities?.length ? (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <span className="text-base leading-none">
                  {flagFor(player.nationalities[0])}
                </span>
                {player.nationalities.slice(0, 2).join(" · ")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // ---------- empty / search state ----------
  return (
    <div className="rounded-card border border-dashed border-border bg-card/40 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: accent }}
          />
          {slotLabel}
        </span>
        {player ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" /> Annuler
          </button>
        ) : null}
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un joueur…"
          className="w-full rounded-button border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          aria-label={`Chercher ${slotLabel.toLowerCase()}`}
        />
      </div>

      {/* Suggestions */}
      <div className="mt-3 min-h-[2rem]">
        {query.trim().length < 2 ? (
          <p className="text-xs text-muted">Tapez 2 lettres pour démarrer.</p>
        ) : loading ? (
          <p className="text-xs text-muted">Recherche…</p>
        ) : filteredResults.length === 0 ? (
          <p className="text-xs text-muted">
            Aucun joueur trouvé pour « {query.trim()} ».
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filteredResults.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(p);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 py-2 px-1 -mx-1 rounded-button",
                    "hover:bg-card-hover transition-colors text-left",
                  )}
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                    <PlayerAvatar
                      name={p.name}
                      src={p.image_url}
                      className="h-full w-full"
                      initialsClassName="text-xs"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {p.current_club ?? "Sans club"}
                      {p.position ? (
                        <>
                          <span className="mx-1 opacity-50">·</span>
                          {POSITION_LABEL[p.position]}
                        </>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PlayerPicker;
