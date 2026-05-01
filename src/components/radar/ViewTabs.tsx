import { LayoutGrid, Map, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export type RadarView = "carte" | "liste" | "atlas";

interface ViewTabsProps {
  current: RadarView;
  onChange: (v: RadarView) => void;
}

const TABS: { value: RadarView; label: string; Icon: typeof Map; soon?: boolean }[] =
  [
    { value: "carte", label: "Carte", Icon: Map },
    { value: "liste", label: "Liste", Icon: LayoutGrid },
    { value: "atlas", label: "Atlas mondial", Icon: Globe, soon: true },
  ];

/**
 * ViewTabs — bascule entre les modes de visualisation du Radar.
 * - Carte : canvas Hume-style avec joueurs scattered (nouveau)
 * - Liste : grille de cards 2-4 col (existant)
 * - Atlas : carte du monde diaspora (à venir)
 */
export function ViewTabs({ current, onChange }: ViewTabsProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1"
      role="tablist"
      aria-label="Mode de visualisation"
    >
      {TABS.map(({ value, label, Icon, soon }) => {
        const isActive = current === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={soon}
            onClick={() => !soon && onChange(value)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-light hover:text-foreground",
              soon && "opacity-40 cursor-not-allowed",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {soon ? (
              <span className="text-[8px] uppercase tracking-wider text-muted ml-0.5">
                Bientôt
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
