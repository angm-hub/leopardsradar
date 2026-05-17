/**
 * PlayerTabsV2 — Navigation par tabs : Overview / Detailed Stats / FIFA.
 *
 * - Sticky sous le header (top = hauteur navbar ~64px)
 * - Tabs : "OVERVIEW" · "STATS AVANCEES" · "STATUT FIFA"
 * - Mobile : scroll horizontal si tabs débordent
 * - Accessible : role="tablist", aria-selected, focus-visible
 */

import { cn } from "@/lib/utils";

export type PlayerTab = "overview" | "detailed" | "fifa";

interface PlayerTabsV2Props {
  active: PlayerTab;
  onSelect: (tab: PlayerTab) => void;
  showDetailed?: boolean;
}

const TABS: { id: PlayerTab; label: string }[] = [
  { id: "overview",  label: "Vue d'ensemble" },
  { id: "detailed",  label: "Stats avancées" },
  { id: "fifa",      label: "Statut FIFA" },
];

export function PlayerTabsV2({ active, onSelect, showDetailed = true }: PlayerTabsV2Props) {
  const visibleTabs = showDetailed ? TABS : TABS.filter((t) => t.id !== "detailed");

  return (
    <div
      className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur-sm"
      role="tablist"
      aria-label="Sections du profil joueur"
    >
      <div className="container-site">
        <div className="flex overflow-x-auto scrollbar-none">
          {visibleTabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onSelect(tab.id)}
                className={cn(
                  "relative flex-shrink-0 px-4 py-3.5 text-[11px] font-mono uppercase tracking-[0.18em] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-muted-light",
                )}
              >
                {tab.label}
                {/* Underline active */}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlayerTabsV2;
