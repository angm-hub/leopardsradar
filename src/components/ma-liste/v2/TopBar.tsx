import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useMaListeV2Store } from "@/store/maListeV2Store";

export function TopBar() {
  const lastSavedAt = useMaListeV2Store((s) => s.lastSavedAt);
  const reset = useMaListeV2Store((s) => s.reset);
  const hasPicks = useMaListeV2Store(
    (s) => s.getStartersCount() + s.getBenchCount() > 0,
  );
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

  const handleReset = () => {
    if (!hasPicks) return;
    if (
      window.confirm(
        "Tout effacer ? Un lien partagé peut être réimporté plus tard.",
      )
    ) {
      reset();
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
      <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-4 px-4 md:px-8">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/55 hover:bg-card/80 hover:text-foreground transition-all duration-200 ring-1 ring-transparent hover:ring-border"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-baseline gap-3">
          <Link
            to="/"
            className="font-display text-[15px] font-bold tracking-tight text-foreground hidden sm:flex items-center gap-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Léopards Radar
          </Link>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/40">
            Ma Liste
          </span>
        </div>

        <div className="flex-1" />

        {/* Save indicator */}
        {lastSavedAt && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 border border-border/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/55">
              {savedLabel}
            </span>
          </div>
        )}

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasPicks}
          className="flex items-center gap-1.5 h-10 px-3 rounded-full text-foreground/45 hover:text-foreground hover:bg-card/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Tout effacer"
          title="Tout effacer"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.08em]">
            Reset
          </span>
        </button>
      </div>
    </header>
  );
}
