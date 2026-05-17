/**
 * AttributeProfile15 — 3 colonnes ATTACKING / TECHNICAL / PHYSICAL
 * avec 5 attributs chacune notés /20.
 *
 * Design :
 *   - Note colorée : vert >= 15 · ambre 9-14 · rouge <= 8 · gris = null
 *   - Label mono uppercase
 *   - Barre de progression proportionnelle à /20
 *   - Mobile : 1 colonne (stack vertical des 3 familles)
 *   - Tooltip au tap sur mobile / hover desktop
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AttributeProfile, AttributeScore, AttributeFamily } from "@/lib/playerAttributes";

interface AttributeProfile15Props {
  profile: AttributeProfile;
  className?: string;
}

export function AttributeProfile15({ profile, className }: AttributeProfile15Props) {
  if (profile.isGk) {
    return <GkAttributeProfile profile={profile} className={className} />;
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop : 3 colonnes, Mobile : stack vertical */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-px bg-transparent md:bg-border rounded-card overflow-hidden border border-border">
        <FamilyColumn family={profile.attacking} />
        <FamilyColumn family={profile.technical} />
        <FamilyColumn family={profile.physical} />
      </div>
    </div>
  );
}

function GkAttributeProfile({ profile, className }: { profile: AttributeProfile; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 gap-0 border border-border rounded-card overflow-hidden">
        <FamilyColumn family={profile.attacking} />
      </div>
      <p className="mt-3 text-[11px] font-mono text-muted text-center">
        Profil gardien — 5 attributs spécifiques
      </p>
    </div>
  );
}

function FamilyColumn({ family }: { family: AttributeFamily }) {
  return (
    <div className="bg-card">
      {/* En-tête famille */}
      <div className="px-4 py-3 border-b border-border/60 bg-card/80">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-light">
          {family.label}
        </h3>
      </div>
      {/* Attributs */}
      <div className="divide-y divide-border/40">
        {family.attributes.map((attr) => (
          <AttributeRow key={attr.key} attr={attr} />
        ))}
      </div>
    </div>
  );
}

function AttributeRow({ attr }: { attr: AttributeScore }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const noteColor = noteToColor(attr.note);
  const hasData = attr.note !== null;

  return (
    <div
      className="relative flex items-center gap-3 px-4 py-2.5 cursor-default select-none"
      aria-label={`${attr.label} : ${attr.note !== null ? `${attr.note}/20` : "données non disponibles"}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
    >
      {/* Label */}
      <span className="flex-1 text-[11px] font-mono uppercase tracking-[0.12em] text-muted-light truncate">
        {attr.label}
      </span>

      {/* Barre progress */}
      <div className="w-16 md:w-14 h-1 bg-border/60 rounded-full overflow-hidden flex-shrink-0">
        {hasData && (
          <div
            className={cn("h-full rounded-full transition-all duration-500", noteToBarColor(attr.note))}
            style={{ width: `${((attr.note ?? 0) / 20) * 100}%` }}
          />
        )}
      </div>

      {/* Note */}
      <span
        className={cn(
          "w-7 text-right font-semibold text-base leading-none flex-shrink-0",
          "font-mono",
          hasData ? noteColor : "text-muted/50",
        )}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {hasData ? attr.note : "—"}
      </span>

      {/* Tooltip */}
      {showTooltip && attr.rawLabel !== "—" && (
        <div
          className="absolute right-0 top-full z-20 mt-1 rounded-md border border-border bg-card/95 backdrop-blur-sm px-3 py-2 text-[11px] text-muted-light shadow-xl shadow-black/40 pointer-events-none"
          role="tooltip"
        >
          <span className="font-mono text-foreground/80">{attr.rawLabel}</span>
          {attr.percentile !== null && (
            <span className="ml-2 text-muted">
              — {attr.percentile}e centile
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers couleur ──────────────────────────────────────────────────────────

function noteToColor(note: number | null): string {
  if (note === null) return "text-muted/50";
  if (note >= 15) return "text-emerald-400";
  if (note >= 9)  return "text-star-DEFAULT";
  return "text-blood-DEFAULT";
}

function noteToBarColor(note: number | null): string {
  if (note === null) return "bg-border";
  if (note >= 15) return "bg-emerald-400/70";
  if (note >= 9)  return "bg-star-DEFAULT/70";
  return "bg-blood-DEFAULT/70";
}

export default AttributeProfile15;
