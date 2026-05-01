import { LayoutTemplate, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type RosterMode = "editorial" | "liste";

interface RosterModeToggleProps {
  current: RosterMode;
  onChange: (mode: RosterMode) => void;
  /** Désactive l'éditorial (forcé en liste quand un filtre est actif) */
  forcedListe?: boolean;
}

const TABS: { value: RosterMode; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "editorial", label: "Éditorial", Icon: LayoutTemplate },
  { value: "liste", label: "Liste", Icon: LayoutGrid },
];

/**
 * RosterModeToggle — bascule entre vue éditoriale (hero + sections par ligne)
 * et vue liste (grid uniforme historique).
 *
 * Si un filtre poste/search est actif, on force la liste et on grise
 * l'option éditorial avec un tooltip explicatif.
 */
export function RosterModeToggle({
  current,
  onChange,
  forcedListe = false,
}: RosterModeToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1"
      role="tablist"
      aria-label="Mode d'affichage du roster"
    >
      {TABS.map(({ value, label, Icon }) => {
        const isActive = current === value;
        const isDisabled = forcedListe && value === "editorial";
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={isDisabled}
            title={isDisabled ? "Désactivez les filtres pour revenir à la vue éditoriale" : undefined}
            onClick={() => !isDisabled && onChange(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-light hover:text-foreground",
              isDisabled && "opacity-40 cursor-not-allowed",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
