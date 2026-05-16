/**
 * PitchLines — lignes terrain RDC pour Ma Liste v2.
 *
 * Cf. docs/DESIGN_MA_LISTE_V2.md § Pitch.
 * - Fond void-deeper avec halo radial jade subtil
 * - Lignes terrain stroke bone/18% (presque invisibles, juste suggérées)
 * - Drapeau RDC subliminal en bas (3 bandes verticales 8% opacité)
 *
 * ViewBox 400×500 (ratio 4/5). preserveAspectRatio="none" pour stretcher
 * sur n'importe quelle aspect-ratio du parent.
 */
export function PitchLines() {
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient id="jade-halo" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="oklch(0.22 0.06 158)" stopOpacity="0.55" />
          <stop offset="60%" stopColor="oklch(0.10 0.02 158)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="oklch(0.04 0.005 252)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo central jade */}
      <rect x="0" y="0" width="400" height="500" fill="url(#jade-halo)" />

      {/* Drapeau RDC subliminal — 3 bandes verticales sur le tiers inférieur,
          opacité très faible. À peine perceptible au premier coup d'œil. */}
      <g opacity="0.08">
        <rect x="0" y="333" width="133" height="167" fill="#F5C518" />
        <rect x="133" y="333" width="134" height="167" fill="#2563B8" />
        <rect x="267" y="333" width="133" height="167" fill="#C8202B" />
      </g>

      {/* Lignes terrain — stroke bone/15%, width 1.5px */}
      <g
        fill="none"
        stroke="rgba(236, 232, 221, 0.15)"
        strokeWidth="1.5"
      >
        {/* Périmètre */}
        <rect x="14" y="14" width="372" height="472" rx="2" />
        {/* Ligne médiane */}
        <line x1="14" y1="250" x2="386" y2="250" />
        {/* Rond central */}
        <circle cx="200" cy="250" r="42" />
        <circle cx="200" cy="250" r="3" fill="rgba(236, 232, 221, 0.25)" />
        {/* Surface de but haut */}
        <rect x="120" y="14" width="160" height="55" />
        <rect x="155" y="14" width="90" height="22" />
        {/* Surface de but bas */}
        <rect x="120" y="431" width="160" height="55" />
        <rect x="155" y="464" width="90" height="22" />
        {/* Arcs de surface (style FIFA) */}
        <path d="M 165 69 A 35 35 0 0 0 235 69" />
        <path d="M 165 431 A 35 35 0 0 1 235 431" />
      </g>
    </svg>
  );
}
