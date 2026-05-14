/**
 * AboutSectionVisuals — 4 micro-visuels signature pour la page À propos.
 *
 * WHY ce composant : la page À propos était un mur de texte (4 sections
 * empilées sans respiration graphique). Ces 4 visuels servent d'ancrage
 * visuel par section, dans la DA Léopards (mono uppercase + vert RDC),
 * sans casser la voix éditoriale dense.
 *
 * Ils restent volontairement minimaux : pas d'illustrations décoratives
 * type Storyset / unDraw, pas de photos. Une mini-grille, un flowchart
 * SVG, une grille de "non" et un wordmark.
 */

import { Check, X, ArrowRight } from "lucide-react";
import { useHomeStats } from "@/hooks/useHomeStats";

// ─── 01 — Mission : mini-grille 3 chiffres data-driven ────────────────────────
// Avant : valeurs hardcodées "1053 / 22 / 3" qui devenaient fausses dès qu'on
// ajoutait un joueur en BDD. Maintenant : lecture live depuis useHomeStats.
// "Continents" reste en dur (3 = Afrique, Europe, Amérique du Nord) — la BDD
// n'expose pas cette agrégation et ce chiffre ne bouge pas.

export function MissionVisual() {
  const { stats, loading } = useHomeStats();

  const items = [
    {
      value: loading ? "—" : (stats?.total_players ?? "—"),
      label: "joueurs",
    },
    {
      value: loading ? "—" : (stats?.total_countries ?? "—"),
      label: "pays",
    },
    { value: "3", label: "continents" },
  ];

  return (
    <div className="mb-8 flex divide-x divide-border/50 rounded-card border border-border/60 bg-card/40 overflow-hidden">
      {items.map((s) => (
        <div key={s.label} className="flex-1 px-4 py-4 text-center">
          <div className="font-serif text-2xl md:text-3xl font-semibold text-foreground leading-none">
            {s.value}
          </div>
          <div className="mt-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 02 — Méthode : mini flowchart Source → Vérification → Publication ────────

export function MethodVisual() {
  const steps = ["Source primaire", "Vérification croisée", "Publication"];
  return (
    <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-card border border-border/60 bg-card/40 p-4">
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-3">
          <div className="flex flex-1 flex-col items-center sm:items-start gap-1.5 px-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-success/85">
              0{i + 1}
            </span>
            <span className="text-sm font-medium text-foreground/90 text-center sm:text-left">
              {label}
            </span>
          </div>
          {i < steps.length - 1 ? (
            <ArrowRight
              aria-hidden
              className="hidden sm:block h-4 w-4 shrink-0 text-muted/60"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ─── 03 — Indépendance : grille des "non" ─────────────────────────────────────

export function IndependanceVisual() {
  const nos = [
    "Pas affilié FECOFA",
    "Pas de publicité",
    "Pas de commandite",
    "Pas d'arrangement club / agent",
  ];
  return (
    <div className="mb-8 grid grid-cols-2 gap-2">
      {nos.map((label) => (
        <div
          key={label}
          className="flex items-center gap-2.5 rounded-md border border-border/60 bg-card/40 px-3 py-2.5"
        >
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-alert/50 bg-alert/10">
            <X className="h-3 w-3 text-alert" aria-hidden />
          </span>
          <span className="text-xs sm:text-sm text-foreground/80">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 04 — Édition : wordmark Cobalt Sports & Entertainment ────────────────────

export function EditeurVisual() {
  return (
    <div className="mb-8 rounded-card border border-border/60 bg-card/40 p-6 flex flex-col gap-3 items-start">
      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-success/85">
        Édité par
      </span>
      <div className="font-serif text-2xl md:text-3xl text-foreground leading-tight tracking-tight">
        COBALT
        <span className="text-muted-light"> SPORTS &amp; ENTERTAINMENT</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <Check className="h-3 w-3 text-success" aria-hidden />
        <span>Studio indépendant — Paris</span>
      </div>
    </div>
  );
}
