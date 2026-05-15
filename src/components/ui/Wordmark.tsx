/**
 * Wordmark — Logo Léopards Radar (Premium DA Cobalt, 2026-05-15)
 *
 * Issu du brand book "Premium v2" handoff Anthropic Design.
 * - LRMark : "L" géométrique terminé par une pointe radar (équivalent du
 *   K de Kinect mais lisible comme une lettre + un geste de détection).
 * - LRWordmark : lockup horizontal avec "Léopards" en pleine opacité et
 *   "Radar" en opacité 45 % — la marque respire, le R devient un index
 *   discret. Tracking serré -4.5 % calibré pour Geist.
 *
 * Aucune ornementation, aucun ballon. Scalable de 16 px (favicon) à
 * 96 px (lockup hero) sans repenser la composition.
 */

interface LRMarkProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function LRMark({
  size = 60,
  color = "currentColor",
  className,
  style,
  ariaLabel,
}: LRMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <path
        d="M 18 14 L 38 14 L 38 60 L 74 60 L 90 72 L 74 84 L 18 84 Z"
        fill={color}
      />
    </svg>
  );
}

interface LRWordmarkProps {
  size?: number;
  color?: string;
  /** "Radar" peut s'afficher en plein, en initiale "R" (compact) ou caché. */
  rVariant?: "full" | "compact" | "hidden";
  className?: string;
  style?: React.CSSProperties;
  /** Si true, une seule ligne ; si false, mark + wordmark peuvent wrap. */
  inline?: boolean;
}

export function LRWordmark({
  size = 28,
  color = "currentColor",
  rVariant = "full",
  className,
  style,
  inline = true,
}: LRWordmarkProps) {
  const showR = rVariant !== "hidden";
  const compact = rVariant === "compact";

  return (
    <span
      className={className}
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: size * 0.4,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <LRMark size={size} color={color} />
      <span
        style={{
          fontFamily: '"Geist", "Inter Tight", system-ui, sans-serif',
          fontSize: size,
          fontWeight: 500,
          color,
          lineHeight: 1,
          letterSpacing: "-0.045em",
        }}
      >
        Léopards
        {showR && (
          <span style={{ opacity: 0.45, marginLeft: size * 0.18 }}>
            {compact ? "R" : "Radar"}
          </span>
        )}
      </span>
    </span>
  );
}

export default LRWordmark;
