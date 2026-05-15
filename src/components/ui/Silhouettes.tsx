/**
 * Silhouettes — sémiologie animale Léopards Radar.
 *
 * SVG minimalistes géométriques utilisées dans les surfaces signatures :
 * Three Symbols section (home), Heritage section (about), poster system
 * du brand book. Stylisation déconnectée du cliché ballon — figurative
 * mais réduite à l'essentiel. Couleur via prop `color`, scalable via `size`.
 *
 * Source : composants POkapi + PLeopard du handoff bundle Anthropic Design.
 */

interface SilhouetteProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Léopard — profil félin minimal géométrique ─────────────────────────────

export function LeopardSilhouette({
  size = 96,
  color = "currentColor",
  className,
  style,
}: SilhouetteProps) {
  return (
    <svg
      viewBox="0 0 120 80"
      width={size}
      height={(size * 80) / 120}
      aria-hidden
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <path
        d="M 8 50 L 12 44 Q 18 38, 26 38 L 38 36 Q 44 30, 50 28 L 64 26
           Q 72 26, 80 30 L 96 30 Q 100 28, 104 26 L 108 22 L 110 28
           L 108 32 Q 104 34, 102 34 L 100 40 Q 98 48, 102 56 L 104 70
           L 100 70 L 96 58 L 88 60 L 90 70 L 86 70 L 82 58 L 50 58
           L 48 70 L 44 70 L 44 58 L 30 58 L 28 70 L 24 70 L 24 56
           Q 18 54, 14 54 L 8 56 Z"
        fill={color}
      />
      <circle cx="60" cy="42" r="1.5" fill="#050B1A" opacity="0.55" />
      <circle cx="72" cy="40" r="1.5" fill="#050B1A" opacity="0.55" />
      <circle cx="84" cy="44" r="1.2" fill="#050B1A" opacity="0.55" />
      <circle cx="50" cy="48" r="1.3" fill="#050B1A" opacity="0.55" />
      <circle cx="68" cy="50" r="1.5" fill="#050B1A" opacity="0.55" />
      <circle cx="80" cy="52" r="1.2" fill="#050B1A" opacity="0.55" />
    </svg>
  );
}

// ─── Okapi — profil tête + cou (animal-licorne, signature graphique) ────────

export function OkapiSilhouette({
  size = 96,
  color = "currentColor",
  className,
  style,
}: SilhouetteProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <path d="M 38 12 L 32 4 L 44 10 Z" fill={color} />
      <path d="M 50 10 L 48 2 L 58 10 Z" fill={color} />
      <path
        d="M 30 16
           Q 28 22, 32 26
           L 38 28
           Q 42 28, 48 28
           L 62 28
           Q 72 30, 76 38
           L 80 50
           Q 80 56, 78 58
           L 74 56
           Q 72 50, 70 44
           L 64 40
           L 58 40
           L 52 42
           Q 46 44, 42 50
           L 36 56
           L 32 92
           L 26 92
           L 28 50
           Q 22 44, 22 36
           Q 22 24, 30 16 Z"
        fill={color}
      />
      <circle cx="35" cy="22" r="1.2" fill="#050B1A" />
    </svg>
  );
}

// ─── Torche — flambeau Authenticité (référence drapeau Zaïre 1971-97) ───────

export function TorchSilhouette({
  size = 96,
  color = "currentColor",
  className,
  style,
}: SilhouetteProps) {
  return (
    <svg
      viewBox="0 0 60 100"
      width={size * 0.6}
      height={size}
      aria-hidden
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <path
        d="M 30 8 Q 22 28, 22 42 Q 22 54, 30 60 Q 38 54, 38 42 Q 38 28, 30 8 Z
           M 22 64 L 38 64 L 36 72 L 24 72 Z
           M 26 76 L 34 76 L 34 92 L 26 92 Z"
        fill={color}
      />
    </svg>
  );
}
