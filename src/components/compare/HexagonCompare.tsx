import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PlayerScores } from "@/lib/playerScores";

interface HexagonCompareProps {
  scoresA: PlayerScores;
  scoresB: PlayerScores;
  /** Display name for the legend (player A). */
  nameA: string;
  /** Display name for the legend (player B). */
  nameB: string;
  /** Side of the SVG square. Defaults to 380. */
  size?: number;
}

// Player A keeps the LR primary yellow (=brand). Player B uses the
// "success" green which sits in the same RDC national palette : visually
// distinct, never reads as an alert, and stays inside our taste rules.
const COLOR_A = "#FCD116";
const COLOR_B = "#00A651";

/**
 * HexagonCompare — superposed 6-axis radar for two players.
 *
 * Why a fork from PlayerHexagon and not a "compare mode" prop : drawing two
 * polygons changes too many concerns (vertex ordering must agree across
 * positions, fill opacities have to drop because polygons stack, the
 * centre aggregate disappears in favour of a small legend). Forking keeps
 * the single-player hexagon untouched and lets each version evolve
 * separately.
 *
 * Axis ordering — both players' `order` arrays must be identical so the
 * vertices stack on the same angular positions. Given role-A/role-B can
 * differ between positions (Finition for an attacker, Création for a
 * midfielder…), we render both labels stacked at the same vertex when
 * they don't match. Cross-position comparisons are encouraged but the
 * user gets a small badge clarifying that the role axes mean different
 * things for each player.
 */
export function HexagonCompare({
  scoresA,
  scoresB,
  nameA,
  nameB,
  size = 380,
}: HexagonCompareProps) {
  const reduced = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.3;

  // We trust scoresA.order — both PlayerScores share the same universal
  // axes in identical order, only role_a/role_b labels can differ.
  const order = scoresA.order;

  const pointsA = useMemo(
    () =>
      order.map((key, i) => {
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / order.length;
        const score = scoresA.axes[key];
        const r = score.value === null ? radius * 0.01 : (score.value / 100) * radius;
        return {
          key,
          score,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          ax: cx + Math.cos(angle) * radius,
          ay: cy + Math.sin(angle) * radius,
          angle,
        };
      }),
    [order, scoresA, cx, cy, radius],
  );

  const pointsB = useMemo(
    () =>
      order.map((key, i) => {
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / order.length;
        const score = scoresB.axes[key];
        const r = score.value === null ? radius * 0.01 : (score.value / 100) * radius;
        return {
          key,
          score,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          angle,
        };
      }),
    [order, scoresB, cx, cy, radius],
  );

  const pathA = useMemo(
    () =>
      pointsA
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ") + " Z",
    [pointsA],
  );

  const pathB = useMemo(
    () =>
      pointsB
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ") + " Z",
    [pointsB],
  );

  // Outer label info — stacked when role labels diverge between players.
  const labels = useMemo(() => {
    return order.map((key, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / order.length;
      const labelR = radius + 36;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      const a = scoresA.axes[key];
      const b = scoresB.axes[key];
      const sameLabel = a.label === b.label;
      const dx = lx - cx;
      let anchor: "start" | "middle" | "end" = "middle";
      if (dx > 8) anchor = "start";
      else if (dx < -8) anchor = "end";
      return { key, lx, ly, sameLabel, a, b, anchor };
    });
  }, [order, scoresA, scoresB, cx, cy, radius]);

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Comparaison ${nameA} vs ${nameB}`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block"
        style={{ overflow: "visible" }}
      >
        {/* Guide circles */}
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

        {/* Axis lines */}
        {pointsA.map((p) => (
          <line
            key={`axis-${p.key}`}
            x1={cx}
            y1={cy}
            x2={p.ax}
            y2={p.ay}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            opacity={0.25}
          />
        ))}

        {/* Polygon B (drawn first so A sits on top — A is the "anchor" player). */}
        <motion.path
          d={pathB}
          fill={COLOR_B}
          fillOpacity={0.14}
          stroke={COLOR_B}
          strokeWidth={1.5}
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: reduced ? 0 : 1.0, ease: [0.22, 0.8, 0.2, 1] },
            opacity: { duration: reduced ? 0 : 0.4 },
          }}
        />

        {/* Polygon A — drawn on top with slightly higher fill so it reads as the primary silhouette. */}
        <motion.path
          d={pathA}
          fill={COLOR_A}
          fillOpacity={0.18}
          stroke={COLOR_A}
          strokeWidth={1.5}
          strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: reduced ? 0 : 0.9, ease: [0.22, 0.8, 0.2, 1] },
            opacity: { duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.1 },
          }}
        />

        {/* Vertex dots — both colours, side by side at each axis */}
        {pointsA.map((p, i) => (
          <motion.circle
            key={`dotA-${p.key}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={COLOR_A}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: p.score.value === null ? 0.35 : 1 }}
            transition={{ delay: reduced ? 0 : 0.7 + i * 0.04, duration: 0.3 }}
          />
        ))}
        {pointsB.map((p, i) => (
          <motion.circle
            key={`dotB-${p.key}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={COLOR_B}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: p.score.value === null ? 0.35 : 1 }}
            transition={{ delay: reduced ? 0 : 0.8 + i * 0.04, duration: 0.3 }}
          />
        ))}

        {/* Outer labels — when both axes share the label, render once with both
            values side by side. When labels diverge (role axes across positions),
            stack the two label/value pairs so the user sees who reads what. */}
        {labels.map((l) => (
          <g key={`label-${l.key}`}>
            {l.sameLabel ? (
              <>
                <text
                  x={l.lx}
                  y={l.ly}
                  textAnchor={l.anchor}
                  className="font-mono fill-muted-light"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {l.a.label}
                </text>
                <text
                  x={l.lx}
                  y={l.ly + 14}
                  textAnchor={l.anchor}
                  className="font-serif"
                  style={{ fontSize: 13, fill: COLOR_A }}
                >
                  {l.a.value === null ? "—" : l.a.value}
                </text>
                <text
                  x={l.lx}
                  y={l.ly + 28}
                  textAnchor={l.anchor}
                  className="font-serif"
                  style={{ fontSize: 13, fill: COLOR_B }}
                >
                  {l.b.value === null ? "—" : l.b.value}
                </text>
              </>
            ) : (
              <>
                <text
                  x={l.lx}
                  y={l.ly}
                  textAnchor={l.anchor}
                  className="font-mono"
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fill: COLOR_A,
                  }}
                >
                  {l.a.label}
                </text>
                <text
                  x={l.lx}
                  y={l.ly + 11}
                  textAnchor={l.anchor}
                  className="font-serif"
                  style={{ fontSize: 12, fill: COLOR_A }}
                >
                  {l.a.value === null ? "—" : l.a.value}
                </text>
                <text
                  x={l.lx}
                  y={l.ly + 24}
                  textAnchor={l.anchor}
                  className="font-mono"
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fill: COLOR_B,
                  }}
                >
                  {l.b.label}
                </text>
                <text
                  x={l.lx}
                  y={l.ly + 35}
                  textAnchor={l.anchor}
                  className="font-serif"
                  style={{ fontSize: 12, fill: COLOR_B }}
                >
                  {l.b.value === null ? "—" : l.b.value}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Inline legend chip — used under the hexagon and around the deltas. */
export function CompareLegend({
  nameA,
  nameB,
  className = "",
}: {
  nameA: string;
  nameB: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] ${className}`}
    >
      <span className="inline-flex items-center gap-2 text-foreground/80">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: COLOR_A }}
        />
        {nameA}
      </span>
      <span className="inline-flex items-center gap-2 text-foreground/80">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: COLOR_B }}
        />
        {nameB}
      </span>
    </div>
  );
}

export const COMPARE_COLORS = { A: COLOR_A, B: COLOR_B } as const;

export default HexagonCompare;
