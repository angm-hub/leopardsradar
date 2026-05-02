import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PlayerScores, AxisKey } from "@/lib/playerScores";

interface PlayerHexagonProps {
  scores: PlayerScores;
  /** Side of the SVG square. Defaults to 320. */
  size?: number;
}

/**
 * PlayerHexagon — 6-axis radar rendered as a hand-built SVG.
 *
 * Why custom and not Recharts/d3 :
 *   - Total typographic and palette control (Fraunces serif on values,
 *     Space Mono on axes, kAIra yellow + green only — no chart-library
 *     defaults that scream "AI-generated dashboard").
 *   - Honest data — null axes collapse to centre and show "—" instead of
 *     a zero that lies.
 *   - Sweep entry animation drawn axis-by-axis instead of a fade-in pop.
 *
 * Layout :
 *   - 2 guide circles only (50 %, 100 %), very faint
 *   - 6 thin axis lines from centre, faint
 *   - Polygon stroke 1.5px LR yellow, fill yellow 12 %
 *   - Vertex dots on the polygon at each axis
 *   - Outer labels (mono uppercase) with the score next to each label
 */
export function PlayerHexagon({ scores, size = 320 }: PlayerHexagonProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<AxisKey | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  // The polygon stays well inside the canvas so the outer labels (which
  // sit beyond `radius`) have room to render. SVG overflow is set to
  // visible so labels that still poke past the bounds aren't clipped.
  const radius = size * 0.32;

  const order = scores.order;
  const points = useMemo(
    () =>
      order.map((key, i) => {
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / order.length;
        const score = scores.axes[key];
        // Null = collapse to centre (1 % radius so the dot is still visible).
        const r = score.value === null ? radius * 0.01 : (score.value / 100) * radius;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        // Outer label sits past the full radius along the axis. Adapts
        // to size so the label area scales with the hexagon.
        const labelR = radius + 32;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        // Axis tick at full radius (for the faint axis line).
        const ax = cx + Math.cos(angle) * radius;
        const ay = cy + Math.sin(angle) * radius;
        return { key, score, x, y, lx, ly, ax, ay, angle, i };
      }),
    [order, scores, cx, cy, radius],
  );

  const polygonPath = useMemo(
    () => points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z",
    [points],
  );

  // Average of non-null axes for the centre score. Only displayed when
  // we have at least 4 valid axes — averaging 1 or 2 axes would be
  // misleading (a 100 + 70 average reads as "85" but says nothing about
  // the 4 missing dimensions).
  const aggregate = useMemo(() => {
    const valid = order
      .map((k) => scores.axes[k].value)
      .filter((v): v is number => v !== null);
    if (valid.length < 4) return null;
    return Math.round(valid.reduce((s, v) => s + v, 0) / valid.length);
  }, [order, scores]);

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        scores.positionLabel
          ? `Profil statistique ${scores.positionLabel}`
          : "Profil statistique"
      }
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block"
        style={{ overflow: "visible" }}
      >
        {/* ----- Guide circles (50 % and 100 %) ----- */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.45}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius * 0.5}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.3}
        />

        {/* ----- Axis lines from centre to each vertex ----- */}
        {points.map((p) => (
          <line
            key={`axis-${p.key}`}
            x1={cx}
            y1={cy}
            x2={p.ax}
            y2={p.ay}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            opacity={hovered === p.key ? 0.7 : 0.25}
            style={{ transition: "opacity 200ms ease" }}
          />
        ))}

        {/* ----- Filled polygon (the silhouette) ----- */}
        <motion.path
          d={polygonPath}
          fill="hsl(var(--primary))"
          fillOpacity={0.12}
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: reduced ? 0 : 0.9, ease: [0.22, 0.8, 0.2, 1] },
            opacity: { duration: reduced ? 0 : 0.4 },
          }}
        />

        {/* ----- Vertex dots ----- */}
        {points.map((p, i) => (
          <motion.circle
            key={`dot-${p.key}`}
            cx={p.x}
            cy={p.y}
            r={hovered === p.key ? 4.5 : 3}
            fill="hsl(var(--primary))"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: p.score.value === null ? 0.35 : 1 }}
            transition={{ delay: reduced ? 0 : 0.6 + i * 0.05, duration: 0.3 }}
            style={{ transition: "r 200ms ease" }}
          />
        ))}

        {/* ----- Centre aggregate score ----- */}
        {aggregate !== null ? (
          <g>
            <text
              x={cx}
              y={cy + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-serif fill-foreground"
              style={{ fontSize: 30, fontWeight: 500 }}
            >
              {aggregate}
            </text>
            <text
              x={cx}
              y={cy + 24}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono fill-muted"
              style={{
                fontSize: 8,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Indice
            </text>
          </g>
        ) : null}

        {/* ----- Outer axis labels with score ----- */}
        {points.map((p) => {
          // Anchor heuristic so labels don't sit weirdly on the polygon edges.
          const dx = p.lx - cx;
          const dy = p.ly - cy;
          let anchor: "start" | "middle" | "end" = "middle";
          if (dx > 8) anchor = "start";
          else if (dx < -8) anchor = "end";
          const labelOffsetY = dy < -size * 0.2 ? -2 : dy > size * 0.2 ? 12 : 4;
          const valOffsetY = labelOffsetY + 12;

          return (
            <g
              key={`label-${p.key}`}
              onMouseEnter={() => setHovered(p.key)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              {/* Invisible hit target so hover works on label area */}
              <rect
                x={p.lx - 40}
                y={p.ly - 16}
                width={80}
                height={28}
                fill="transparent"
              />
              <text
                x={p.lx}
                y={p.ly + labelOffsetY}
                textAnchor={anchor}
                className="font-mono fill-muted-light"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {p.score.label}
              </text>
              <text
                x={p.lx}
                y={p.ly + valOffsetY}
                textAnchor={anchor}
                className="font-serif fill-foreground"
                style={{ fontSize: 14 }}
              >
                {p.score.value === null ? "—" : p.score.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default PlayerHexagon;
