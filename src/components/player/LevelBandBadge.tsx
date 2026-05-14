/**
 * LevelBandBadge — Pill public de niveau de jeu.
 *
 * Affiche la bande (elite / high / mid / developing / watch) et,
 * optionnellement, le score composite sur 100. Deux tailles : sm (cards)
 * et md (fiche joueur hero).
 *
 * Défensif par design :
 *   - band={null} → return null (pas de chip vide qui casse le layout)
 *   - score={null} → cache le score silencieusement
 *   - isLevelBand() guard évite un rendu avec une string inconnue
 *
 * Palette cohérente avec la DA Léopards (fond sombre, accents vert/jaune) :
 *   elite      → jaune RDC (primary)
 *   high       → vert RDC vif (success)
 *   mid        → vert atténué (success/30)
 *   developing → gris bleu neutre (muted-light)
 *   watch      → gris très discret (muted)
 */

import { cn } from "@/lib/utils";
import {
  type LevelBand,
  LEVEL_BAND_LABEL,
  LEVEL_BAND_DESCRIPTION,
  formatLevelScore,
  isLevelBand,
} from "@/lib/playerLevel";

// ─── Props ─────────────────────────────────────────────────────────────────

interface LevelBandBadgeProps {
  band: LevelBand | string | null | undefined;
  score?: number | null;
  /** sm : chip compact pour cards. md : pill plus lisible pour la fiche joueur. */
  size?: "sm" | "md";
  showScore?: boolean;
  className?: string;
}

// ─── Mapping de styles ──────────────────────────────────────────────────────

/**
 * Classes Tailwind par bande. On évite les classes dynamiques (purge CSS)
 * en les listant statiquement ici.
 *
 * Règles DA :
 *   elite      → yellow — couleur signature RDC, réservée au sommet
 *   high       → vert vif — engagement, progression forte
 *   mid        → vert doux — présence européenne sans surbrillance
 *   developing → bleu-gris — neutre, encourageant sans surévaluer
 *   watch      → gris discret — "on surveille", pas de jugement
 */
const BAND_CLASSES: Record<LevelBand, string> = {
  elite:      "bg-primary/20 text-primary border-primary/40",
  high:       "bg-success/20 text-success border-success/40",
  mid:        "bg-success/10 text-success/70 border-success/20",
  developing: "bg-muted/20 text-muted-light border-border/60",
  watch:      "bg-muted/10 text-muted border-border/40",
};

// ─── Composant ──────────────────────────────────────────────────────────────

export function LevelBandBadge({
  band,
  score,
  size = "sm",
  showScore = false,
  className,
}: LevelBandBadgeProps) {
  // Guard défensif : null, undefined, ou string non reconnue → rien
  if (!band || !isLevelBand(band)) return null;

  const label       = LEVEL_BAND_LABEL[band];
  const description = LEVEL_BAND_DESCRIPTION[band];
  const bandClasses = BAND_CLASSES[band];

  const isMd = size === "md";

  return (
    <span
      title={description}
      aria-label={`Niveau ${label}${showScore && score != null ? ` — ${formatLevelScore(score)}` : ""}`}
      className={cn(
        // Base — pill arrondie avec border
        "inline-flex items-center gap-1 rounded-full border font-mono uppercase tracking-wider select-none",
        // Taille
        isMd
          ? "px-3 py-1 text-[11px]"
          : "px-2 py-0.5 text-[9px]",
        bandClasses,
        className,
      )}
    >
      {/* Dot de couleur — signal visuel rapide, identique au dot position */}
      <span
        aria-hidden
        className={cn(
          "inline-block shrink-0 rounded-full",
          isMd ? "h-1.5 w-1.5" : "h-1 w-1",
          // Couleur du dot = même famille que le texte mais plus saturée
          band === "elite"      && "bg-primary",
          band === "high"       && "bg-success",
          band === "mid"        && "bg-success/60",
          band === "developing" && "bg-muted-light",
          band === "watch"      && "bg-muted",
        )}
      />
      {label}
      {showScore && score != null && (
        <span className="opacity-60">{score}</span>
      )}
    </span>
  );
}

export default LevelBandBadge;
