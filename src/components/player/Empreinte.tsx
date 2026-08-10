import { useMemo } from "react";
import type { GradebarAxis } from "@/hooks/usePlayerGradebars";

/**
 * Empreinte — signature statistique du joueur en percentiles vs son poste,
 * rendue en « pizza » (chaque tranche = un axe, longueur = rang percentile).
 *
 * Remplace les barres/hexagones : une seule forme qui se lit d'un coup d'œil,
 * dans la DA Radar (cobalt + accent or sur les axes d'élite). Alimentée par la
 * même donnée que la fiche (RPC gradebars), donc auto-fraîche.
 *
 * Réutilisable partout : `variant="card"` (roster, compare, home) ou
 * `variant="full"` (fiche joueur, avec valeurs lisibles). N'affiche que les
 * axes calculables : jamais de tranche vide.
 */

const SHORT: Record<string, string> = {
  niveau: "Niveau",
  valeur: "Valeur",
  jeunesse: "Jeunesse",
  leopards: "Léopards",
  impact: "Impact",
};

// Palette DA site
const COBALT = "#4A8AD8";
const GOLD = "#F5C518";
const RING = "#1e3866";
const SPOKE = "#122858";
const BONE = "#ECE8DD";

function sliceColor(pct: number) {
  if (pct >= 75) return { fill: GOLD, op: 0.9, stroke: GOLD, elite: true };
  return { fill: COBALT, op: 0.32 + pct / 240, stroke: COBALT, elite: false };
}

interface EmpreinteProps {
  axes: GradebarAxis[];
  poolLabel?: string;
  variant?: "card" | "full";
  className?: string;
}

export function Empreinte({ axes, poolLabel, variant = "card", className }: EmpreinteProps) {
  const full = variant === "full";
  const geom = useMemo(() => {
    const CX = 220, CY = 220, R0 = full ? 40 : 34, R = full ? 168 : 150;
    const N = axes.length || 1;
    const step = 360 / N;
    const rad = (d: number) => ((d - 90) * Math.PI) / 180;
    const pt = (r: number, d: number): [number, number] => [
      CX + r * Math.cos(rad(d)),
      CY + r * Math.sin(rad(d)),
    ];
    const wedge = (a0: number, a1: number, r: number) => {
      const [x0, y0] = pt(R0, a0), [x1, y1] = pt(r, a0);
      const [x2, y2] = pt(r, a1), [x3, y3] = pt(R0, a1);
      const laf = a1 - a0 > 180 ? 1 : 0;
      return `M${x0} ${y0} L${x1} ${y1} A${r} ${r} 0 ${laf} 1 ${x2} ${y2} L${x3} ${y3} A${R0} ${R0} 0 ${laf} 0 ${x0} ${y0} Z`;
    };
    return { CX, CY, R0, R, N, step, pt, wedge };
  }, [axes.length, full]);

  if (!axes || axes.length === 0) return null;

  const { CX, CY, R0, R, N, step, pt, wedge } = geom;
  const labelR = R + (full ? 30 : 26);
  // marge horizontale pour ne pas couper les labels longs
  const vb = full ? "-58 -6 556 452" : "-40 -4 520 448";

  return (
    <div className={className}>
      <svg
        viewBox={vb}
        role="img"
        aria-label={`Empreinte statistique en percentiles${poolLabel ? ` vs ${poolLabel}` : ""}`}
        style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 8px 26px rgba(74,138,216,.18))" }}
      >
        {/* anneaux de repère */}
        {[100, 75, 50, 25].map((v) => (
          <circle key={v} cx={CX} cy={CY} r={R0 + ((R - R0) * v) / 100} fill="none"
            stroke={RING} strokeWidth={v === 100 ? 1.3 : 1} strokeDasharray={v === 100 ? undefined : "2 5"} />
        ))}
        {/* rayons */}
        {Array.from({ length: N }).map((_, i) => {
          const [x, y] = pt(R, i * step);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={SPOKE} strokeWidth={1} />;
        })}
        {/* tranches */}
        {axes.map((a, i) => {
          const pct = Math.max(a.percentile, 1.5);
          const a0 = i * step + 1.6, a1 = (i + 1) * step - 1.6;
          const r = R0 + ((R - R0) * pct) / 100;
          const c = sliceColor(a.percentile);
          return (
            <path key={a.axis} d={wedge(a0, a1, r)} fill={c.fill} fillOpacity={c.elite ? 0.9 : c.op}
              stroke={c.elite ? GOLD : c.stroke} strokeWidth={c.elite ? 2 : 1} strokeLinejoin="round" />
          );
        })}
        {/* labels */}
        {axes.map((a, i) => {
          const mid = i * step + step / 2;
          const [lx, ly] = pt(labelR, mid);
          const elite = a.percentile >= 75;
          return (
            <g key={`l-${a.axis}`} transform={`translate(${lx} ${ly})`} textAnchor="middle">
              <text y={full ? -2 : -1} fontFamily="Geist, sans-serif" fontWeight={500}
                fontSize={full ? 22 : 18} fill={elite ? GOLD : BONE} letterSpacing="-1">
                {Math.round(a.percentile)}
              </text>
              <text y={full ? 15 : 12} fontFamily="'Geist Mono', monospace" fontWeight={500}
                fontSize={full ? 9.5 : 8.5} fill="rgba(159,184,224,.72)" letterSpacing="1.1">
                {(SHORT[a.axis] ?? a.label).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default Empreinte;
