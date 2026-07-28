/**
 * AdvancedFilters — filtres granulaires du Radar.
 *
 * Complète les filtres de base (poste, tier, nationalité, search) avec :
 *   - Slider âge (14-40 ans ; min au plancher = aucune borne basse, on garde
 *     les rares U14 plutôt que de les couper — cible scouting précoce)
 *   - Toggle "inclure les joueurs sans âge" (activé par défaut : sinon les 95
 *     profils sans date de naissance disparaissaient dès qu'on bougeait le slider)
 *   - Slider valeur marchande (0 - 50M, étapes log)
 *   - Toggle pied fort (G / D / Ambidextre)
 *   - Toggle "avec photo uniquement"
 *   - Toggle "contrat actif uniquement"
 *
 * Tous les filtres opèrent côté client (pas de refetch Supabase).
 * Le composant est repliable sur mobile via un bouton "Filtres avancés".
 */

import { useEffect, useRef, useState } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DBFoot } from "@/types/dbPlayer";

// Plancher du slider âge. Le min à cette valeur = "aucune borne basse" : on
// n'exclut jamais les rares U14 par défaut (cible scouting précoce).
export const AGE_SLIDER_MIN = 14;

// Bandes du re-score tier-aware (score_band). Bien plus discriminant que
// level_band, dont 89% du vivier tombe dans "watch". Ne filtre que les joueurs
// notés (cohort performers) — comportement attendu : "montre-moi l'élite".
export type LevelBandFilter =
  | "ALL"
  | "Élite"
  | "Haut niveau"
  | "Solide"
  | "En retrait"
  | "Sous-régime";
export type LeagueTierFilter = "ALL" | "1" | "2" | "3" | "4";

export interface AdvancedFilterState {
  ageMin: number;
  ageMax: number;
  includeUnknownAge: boolean;
  valueMin: number; // en M€
  valueMax: number; // en M€
  foot: DBFoot | "ALL";
  levelBand: LevelBandFilter;
  leagueTier: LeagueTierFilter;
  capedRdc: boolean;
  uncotedOnly: boolean;
  withStats: boolean;
  withPhoto: boolean;
  withActiveContract: boolean;
}

export const ADVANCED_FILTERS_DEFAULT: AdvancedFilterState = {
  ageMin: AGE_SLIDER_MIN,
  ageMax: 40,
  includeUnknownAge: true,
  valueMin: 0,
  valueMax: 50,
  foot: "ALL",
  levelBand: "ALL",
  leagueTier: "ALL",
  capedRdc: false,
  uncotedOnly: false,
  withStats: false,
  withPhoto: false,
  withActiveContract: false,
};

function isDefaultAdvanced(f: AdvancedFilterState): boolean {
  return (
    f.ageMin === ADVANCED_FILTERS_DEFAULT.ageMin &&
    f.ageMax === ADVANCED_FILTERS_DEFAULT.ageMax &&
    f.includeUnknownAge === ADVANCED_FILTERS_DEFAULT.includeUnknownAge &&
    f.valueMin === ADVANCED_FILTERS_DEFAULT.valueMin &&
    f.valueMax === ADVANCED_FILTERS_DEFAULT.valueMax &&
    f.foot === ADVANCED_FILTERS_DEFAULT.foot &&
    f.levelBand === ADVANCED_FILTERS_DEFAULT.levelBand &&
    f.leagueTier === ADVANCED_FILTERS_DEFAULT.leagueTier &&
    f.capedRdc === ADVANCED_FILTERS_DEFAULT.capedRdc &&
    f.uncotedOnly === ADVANCED_FILTERS_DEFAULT.uncotedOnly &&
    f.withStats === ADVANCED_FILTERS_DEFAULT.withStats &&
    f.withPhoto === ADVANCED_FILTERS_DEFAULT.withPhoto &&
    f.withActiveContract === ADVANCED_FILTERS_DEFAULT.withActiveContract
  );
}

const LEVEL_OPTIONS: { value: LevelBandFilter; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "Élite", label: "Élite" },
  { value: "Haut niveau", label: "Haut niveau" },
  { value: "Solide", label: "Solide" },
  { value: "En retrait", label: "En retrait" },
  { value: "Sous-régime", label: "Sous-régime" },
];

const LEAGUE_OPTIONS: { value: LeagueTierFilter; label: string }[] = [
  { value: "ALL", label: "Toutes" },
  { value: "1", label: "T1" },
  { value: "2", label: "T2" },
  { value: "3", label: "T3" },
  { value: "4", label: "T4" },
];

interface AdvancedFiltersProps {
  state: AdvancedFilterState;
  onChange: (next: AdvancedFilterState) => void;
}

const FOOT_OPTIONS: { value: DBFoot | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "right", label: "Pied D" },
  { value: "left", label: "Pied G" },
  { value: "both", label: "Ambidextre" },
];

// Formatage valeur pour le slider
function fmtValue(v: number): string {
  if (v === 0) return "0";
  if (v >= 50) return "50 M+";
  if (v >= 1) return `${v} M`;
  return `${v * 1000}k`;
}

export function AdvancedFilters({ state, onChange }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasActive = !isDefaultAdvanced(state);

  // Fermeture à l'Escape et au clic/tap hors du panneau. Sans ça, le panneau
  // ouvert bloque les contrôles qu'il recouvre (constat du test mobile 16/07).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const set = <K extends keyof AdvancedFilterState>(
    key: K,
    value: AdvancedFilterState[K],
  ) => onChange({ ...state, [key]: value });

  const reset = () => onChange(ADVANCED_FILTERS_DEFAULT);

  return (
    <div className="relative" ref={rootRef}>
      {/* Bouton toggle — affiche le nombre de filtres actifs */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Filtres avancés"
        className={cn(
          "flex items-center gap-1.5 rounded-button border px-3 py-2 text-sm transition-colors",
          hasActive
            ? "border-primary/60 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-light hover:border-border-hover hover:text-foreground",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Filtres avancés</span>
        {hasActive && (
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-background leading-none">
            {countActiveAdvanced(state)}
          </span>
        )}
      </button>

      {/* Panneau repliable */}
      {open && (
        <div
          className={cn(
            // Mobile : bottom sheet pleine largeur (le bouton icône est au bord
            // gauche, un panneau ancré right-0 partirait hors écran).
            "fixed inset-x-3 bottom-3 z-50 max-h-[70vh] overflow-y-auto",
            "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:z-40 md:max-h-none md:overflow-visible md:w-[320px]",
            "rounded-card border border-border bg-card shadow-2xl shadow-background/80",
            "p-5 flex flex-col gap-5",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
              Filtres avancés
            </p>
            <div className="flex items-center gap-2">
              {hasActive && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-[11px] text-muted-light hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer les filtres avancés"
                className="rounded p-0.5 text-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Âge */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-light">
                Âge
              </p>
              <p className="text-xs font-mono text-foreground">
                {state.ageMin <= AGE_SLIDER_MIN ? "≤" : ""}{state.ageMin} – {state.ageMax} ans
              </p>
            </div>
            <RadixSlider.Root
              min={AGE_SLIDER_MIN}
              max={40}
              step={1}
              value={[state.ageMin, state.ageMax]}
              onValueChange={([min, max]) => {
                onChange({ ...state, ageMin: min, ageMax: max });
              }}
              className="relative flex h-5 w-full touch-none select-none items-center"
              aria-label="Plage d'âge"
            >
              <RadixSlider.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-border">
                <RadixSlider.Range className="absolute h-full bg-primary" />
              </RadixSlider.Track>
              <RadixSlider.Thumb
                className="block h-4 w-4 rounded-full border border-primary/50 bg-primary shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Âge minimum"
              />
              <RadixSlider.Thumb
                className="block h-4 w-4 rounded-full border border-primary/50 bg-primary shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Âge maximum"
              />
            </RadixSlider.Root>
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>{AGE_SLIDER_MIN}</span>
              <span>40</span>
            </div>
          </div>

          {/* Valeur marchande */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-light">
                Valeur marchande
              </p>
              <p className="text-xs font-mono text-foreground">
                {fmtValue(state.valueMin)} – {fmtValue(state.valueMax)}
              </p>
            </div>
            <RadixSlider.Root
              min={0}
              max={50}
              step={1}
              value={[state.valueMin, state.valueMax]}
              onValueChange={([min, max]) => {
                onChange({ ...state, valueMin: min, valueMax: max });
              }}
              className="relative flex h-5 w-full touch-none select-none items-center"
              aria-label="Plage de valeur marchande"
            >
              <RadixSlider.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-border">
                <RadixSlider.Range className="absolute h-full bg-star" />
              </RadixSlider.Track>
              <RadixSlider.Thumb
                className="block h-4 w-4 rounded-full border border-star/50 bg-star shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star focus-visible:ring-offset-2"
                aria-label="Valeur minimum"
              />
              <RadixSlider.Thumb
                className="block h-4 w-4 rounded-full border border-star/50 bg-star shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-star focus-visible:ring-offset-2"
                aria-label="Valeur maximum"
              />
            </RadixSlider.Root>
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>0</span>
              <span>50 M+</span>
            </div>
          </div>

          {/* Pied fort */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-light">
              Pied fort
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {FOOT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("foot", opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    state.foot === opt.value
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-light hover:border-border-hover hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau de jeu (band, couvre tout le vivier) */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-light">
              Niveau de jeu
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("levelBand", opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    state.levelBand === opt.value
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-light hover:border-border-hover hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tier de ligue (T1–T4) */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-light">
              Ligue
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {LEAGUE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("leagueTier", opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    state.leagueTier === opt.value
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-light hover:border-border-hover hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
            <Toggle
              label="Déjà capé RDC"
              checked={state.capedRdc}
              onChange={(v) => set("capedRdc", v)}
            />
            <Toggle
              label="Non cotés uniquement"
              checked={state.uncotedOnly}
              onChange={(v) => set("uncotedOnly", v)}
            />
            <Toggle
              label="Avec stats saison"
              checked={state.withStats}
              onChange={(v) => set("withStats", v)}
            />
            <Toggle
              label="Inclure les joueurs sans âge"
              checked={state.includeUnknownAge}
              onChange={(v) => set("includeUnknownAge", v)}
            />
            <Toggle
              label="Avec photo uniquement"
              checked={state.withPhoto}
              onChange={(v) => set("withPhoto", v)}
            />
            <Toggle
              label="Contrat actif uniquement"
              checked={state.withActiveContract}
              onChange={(v) => set("withActiveContract", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-muted-light">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

function countActiveAdvanced(f: AdvancedFilterState): number {
  let count = 0;
  if (f.ageMin !== ADVANCED_FILTERS_DEFAULT.ageMin || f.ageMax !== ADVANCED_FILTERS_DEFAULT.ageMax) count++;
  if (f.includeUnknownAge !== ADVANCED_FILTERS_DEFAULT.includeUnknownAge) count++;
  if (f.valueMin !== ADVANCED_FILTERS_DEFAULT.valueMin || f.valueMax !== ADVANCED_FILTERS_DEFAULT.valueMax) count++;
  if (f.foot !== "ALL") count++;
  if (f.levelBand !== "ALL") count++;
  if (f.leagueTier !== "ALL") count++;
  if (f.capedRdc) count++;
  if (f.uncotedOnly) count++;
  if (f.withStats) count++;
  if (f.withPhoto) count++;
  if (f.withActiveContract) count++;
  return count;
}
