import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMaListeV2Store } from "@/store/maListeV2Store";
import type { Formation } from "@/types/maListe";

const FORMATIONS: Formation[] = ["4-3-3", "4-2-3-1", "3-5-2"];

export function TopBar() {
  const formation = useMaListeV2Store((s) => s.formation);
  const setFormation = useMaListeV2Store((s) => s.setFormation);
  const lastSavedAt = useMaListeV2Store((s) => s.lastSavedAt);
  const [savedLabel, setSavedLabel] = useState<string>("");

  useEffect(() => {
    if (!lastSavedAt) {
      setSavedLabel("");
      return;
    }
    const update = () => {
      const seconds = Math.floor((Date.now() - lastSavedAt) / 1000);
      if (seconds < 5) setSavedLabel("sauvegardé");
      else if (seconds < 60) setSavedLabel(`il y a ${seconds}s`);
      else setSavedLabel(`il y a ${Math.floor(seconds / 60)} min`);
    };
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 md:px-6">
        {/* Back */}
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/55 hover:bg-card hover:text-foreground transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Brand */}
        <Link
          to="/"
          className="font-v2 text-[15px] font-bold tracking-tight text-foreground hidden sm:block"
        >
          Léopards Radar
        </Link>
        <span className="hidden sm:inline font-v2-mono text-[10px] uppercase tracking-[0.12em] text-foreground/45">
          / Ma Liste
        </span>

        {/* Formation toggle (centré sur desktop) */}
        <div className="flex-1 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5" role="tablist">
            {FORMATIONS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={formation === f}
                onClick={() => setFormation(f)}
                className={cn(
                  "rounded-full px-3 py-1 font-v2-mono text-[11px] font-semibold uppercase tracking-[0.06em] transition-all",
                  formation === f
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/55 hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Save indicator */}
        <div className="hidden md:flex items-center gap-1.5">
          {lastSavedAt && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-v2-mono text-[10px] uppercase tracking-[0.06em] text-foreground/45">
                {savedLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
