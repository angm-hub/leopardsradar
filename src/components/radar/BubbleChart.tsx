/**
 * BubbleChart — vue "Carte" du Radar, refonte mai 2026.
 *
 * Remplace l'ancien RadarCanvas qui cappait à 80 pills sur 1166 joueurs.
 *
 * Architecture :
 *   Un SVG responsive qui groupe les joueurs par pays de naissance.
 *   Chaque bulle = un pays, taille = count de joueurs, couleur = tier dominant.
 *   Hover = tooltip avec liste des 5 premiers joueurs du pays.
 *   Click = filtre par nationalité dans le parent.
 *
 * Choix délibérés :
 *   - Pas de lib de layout externe (d3-force, etc.) — positionnement
 *     déterministe row-by-row, plus prévisible et plus rapide.
 *   - SVG pur + Framer Motion pour les entrées — pas de canvas 2D qui
 *     rendrait les tooltips complexes.
 *   - Tri par count desc pour que les grandes communautés diaspora
 *     (France, Belgique) soient visuellement dominantes.
 *   - Couleur = tier dominant du pays : vert (tier1), jaune (star value),
 *     bleu (heritage), gris (autre).
 */

import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { formatMarketValue, flagFor } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";
import { cn } from "@/lib/utils";

interface BubbleChartProps {
  players: DBPlayer[];
  totalRoster: number;
  onNationFilter?: (nation: string) => void;
}

interface CountryGroup {
  country: string;
  count: number;
  players: DBPlayer[];
  dominantTier: "S" | "A" | "B" | "C";
  hasTier1: boolean;
  totalValue: number;
}

// ── Couleur par tier dominant ─────────────────────────────────────────────────

function getBubbleColor(group: CountryGroup): {
  fill: string;
  stroke: string;
  text: string;
} {
  if (group.dominantTier === "S" || group.dominantTier === "A") {
    return {
      fill: "rgba(0,166,81,0.22)",
      stroke: "rgba(0,166,81,0.65)",
      text: "#86efac",
    };
  }
  if (group.hasTier1) {
    return {
      fill: "rgba(252,209,22,0.12)",
      stroke: "rgba(252,209,22,0.55)",
      text: "#fcd116",
    };
  }
  if (group.count > 20) {
    return {
      fill: "rgba(99,102,241,0.15)",
      stroke: "rgba(99,102,241,0.45)",
      text: "#a5b4fc",
    };
  }
  return {
    fill: "rgba(255,255,255,0.06)",
    stroke: "rgba(255,255,255,0.18)",
    text: "#71717a",
  };
}

// ── Taille bulle ──────────────────────────────────────────────────────────────

const MIN_R = 22;
const MAX_R = 80;

function getBubbleRadius(count: number, maxCount: number): number {
  if (maxCount === 0) return MIN_R;
  const ratio = Math.sqrt(count / maxCount);
  return MIN_R + (MAX_R - MIN_R) * ratio;
}

// ── Layout simple : packed rows ───────────────────────────────────────────────
// On divise le viewport en lignes et on place les bulles de gauche à droite
// en décalant les rangées paires de demi-bulle (honeycomb).

interface BubbleLayout {
  group: CountryGroup;
  cx: number;
  cy: number;
  r: number;
}

function computeLayout(
  groups: CountryGroup[],
  width: number,
): { layout: BubbleLayout[]; height: number } {
  if (groups.length === 0) return { layout: [], height: 300 };

  const maxCount = groups[0].count;
  const PADDING = 10;
  const layout: BubbleLayout[] = [];

  let x = 0;
  let y = 0;
  let rowMaxR = 0;
  let isOddRow = false;

  groups.forEach((group, i) => {
    const r = getBubbleRadius(group.count, maxCount);
    const diameter = r * 2 + PADDING;

    if (x + diameter > width + PADDING && i > 0) {
      // Nouvelle ligne
      y += rowMaxR * 2 + PADDING;
      x = 0;
      rowMaxR = 0;
      isOddRow = !isOddRow;
    }

    const offsetY = isOddRow ? r * 0.6 : 0;
    layout.push({ group, cx: x + r, cy: y + r + offsetY, r });
    x += diameter;
    rowMaxR = Math.max(rowMaxR, r);
  });

  const height = y + rowMaxR * 2 + PADDING + 40;

  return { layout, height: Math.max(height, 300) };
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface BubbleTooltipProps {
  group: CountryGroup;
  x: number;
  y: number;
  onFilter?: (nation: string) => void;
  onClose: () => void;
}

function BubbleTooltip({ group, x, y, onFilter, onClose }: BubbleTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const topPlayers = group.players
    .sort((a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0))
    .slice(0, 5);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.15, ease: [0.22, 0.8, 0.2, 1] }}
      className="absolute z-40 w-64 rounded-card border border-border bg-card shadow-2xl"
      style={{
        left: Math.min(x, typeof window !== "undefined" ? window.innerWidth - 280 : x),
        top: y + 12,
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label={group.country}>
              {flagFor(group.country)}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">
                {group.country}
              </p>
              <p className="text-[10px] font-mono text-muted mt-0.5">
                {group.count} joueur{group.count > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-button p-1 hover:bg-card-hover transition-colors"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5 text-muted" />
          </button>
        </div>

        <div className="space-y-1.5">
          {topPlayers.map((p) => (
            <Link
              key={p.id}
              to={`/player/${p.slug}`}
              className="flex items-center justify-between gap-2 rounded-button px-2 py-1.5 hover:bg-card-hover transition-colors group"
            >
              <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors">
                {p.name}
              </span>
              {p.market_value_eur && p.market_value_eur > 0 ? (
                <span className="text-[10px] font-mono text-muted shrink-0">
                  {formatMarketValue(p.market_value_eur)}
                </span>
              ) : null}
            </Link>
          ))}
          {group.count > 5 ? (
            <p className="text-[10px] text-muted text-center pt-1">
              +{group.count - 5} autres
            </p>
          ) : null}
        </div>

        {onFilter ? (
          <button
            onClick={() => {
              onFilter(group.country);
              onClose();
            }}
            className="mt-3 w-full rounded-button border border-border bg-card-hover py-1.5 text-xs text-foreground hover:border-primary/50 transition-colors"
          >
            Filtrer sur {group.country}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function BubbleChart({ players, totalRoster, onNationFilter }: BubbleChartProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [selected, setSelected] = useState<{
    group: CountryGroup;
    x: number;
    y: number;
  } | null>(null);

  // ResizeObserver pour adapter le layout au viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Grouper les joueurs par pays de naissance ou nationalité secondaire
  const groups = useMemo((): CountryGroup[] => {
    const map = new Map<string, DBPlayer[]>();

    players.forEach((p) => {
      // Utiliser country_of_birth en priorité, sinon first other_nationality
      const country =
        p.country_of_birth ||
        p.other_nationalities.find((n) => n !== "DR Congo") ||
        "Autre";

      const existing = map.get(country) ?? [];
      existing.push(p);
      map.set(country, existing);
    });

    return Array.from(map.entries())
      .map(([country, ps]): CountryGroup => {
        const sorted = [...ps].sort(
          (a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0),
        );
        const topValue = sorted[0]?.market_value_eur ?? 0;
        let dominantTier: "S" | "A" | "B" | "C" = "C";
        if (topValue >= 30_000_000) dominantTier = "S";
        else if (topValue >= 10_000_000) dominantTier = "A";
        else if (topValue >= 3_000_000) dominantTier = "B";

        return {
          country,
          count: ps.length,
          players: sorted,
          dominantTier,
          hasTier1: ps.some((p) => p.tier === "tier1"),
          totalValue: ps.reduce((s, p) => s + (p.market_value_eur ?? 0), 0),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [players]);

  const totalValue = useMemo(
    () => players.reduce((s, p) => s + (p.market_value_eur ?? 0), 0),
    [players],
  );

  const formatValueShort = (eur: number) => {
    if (eur >= 1_000_000_000) return `${(eur / 1_000_000_000).toFixed(1)} Md€`;
    if (eur >= 1_000_000) return `${Math.round(eur / 1_000_000)} M€`;
    return `${Math.round(eur / 1_000)} k€`;
  };

  const { layout, height } = useMemo(
    () => computeLayout(groups, width),
    [groups, width],
  );

  function handleBubbleClick(
    group: CountryGroup,
    e: React.MouseEvent<SVGCircleElement>,
  ) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelected({ group, x, y });
  }

  return (
    <div className="relative w-full">
      {/* En-tête */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
            Vue · Carte
          </p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            La diaspora du foot congolais
          </h2>
          <p className="mt-2 text-sm text-muted-light max-w-xl">
            Chaque bulle = un pays. Taille proportionnelle au nombre de joueurs.
            Vert = présence en top 5 européen. Cliquer pour explorer.
          </p>
        </div>
        <div className="flex items-stretch gap-4 text-right">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
              Pays couverts
            </p>
            <p className="mt-1 font-serif text-2xl text-foreground leading-none">
              {groups.length}
            </p>
          </div>
          <div className="w-px bg-border/60" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
              Joueurs
            </p>
            <p className="mt-1 font-serif text-2xl text-foreground leading-none">
              {players.length}
              <span className="text-sm text-muted-light font-sans ml-1">
                / {totalRoster}
              </span>
            </p>
          </div>
          <div className="w-px bg-border/60" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
              Valeur cumulée
            </p>
            <p className="mt-1 font-serif text-2xl text-foreground leading-none">
              {formatValueShort(totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Canvas SVG */}
      <div
        ref={containerRef}
        className="relative w-full rounded-card border border-border/60 bg-background overflow-hidden"
        style={{ minHeight: 300 }}
      >
        {/* Fond aurora discret */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: [
              "radial-gradient(circle at 20% 30%, rgba(0,166,81,0.08) 0%, transparent 55%)",
              "radial-gradient(circle at 80% 70%, rgba(252,209,22,0.06) 0%, transparent 50%)",
              "radial-gradient(circle at 60% 20%, rgba(206,17,38,0.05) 0%, transparent 45%)",
            ].join(", "),
          }}
        />

        {players.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-light">
              Aucun joueur ne correspond à ces filtres.
            </p>
          </div>
        ) : (
          <svg
            width={width}
            height={height}
            className="block"
            role="img"
            aria-label={`Carte bulle — ${players.length} joueurs dans ${groups.length} pays`}
          >
            {layout.map(({ group, cx, cy, r }, i) => {
              const color = getBubbleColor(group);
              const delay = reduced ? 0 : Math.min(i * 0.025, 0.8);

              return (
                <motion.g
                  key={group.country}
                  initial={reduced ? {} : { opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay, ease: [0.22, 0.8, 0.2, 1] }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={1.5}
                    className="cursor-pointer transition-[filter,stroke-width] duration-200 hover:stroke-[2.5] hover:brightness-125"
                    onClick={(e) => handleBubbleClick(group, e)}
                    aria-label={`${group.country}: ${group.count} joueurs`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) setSelected({ group, x: cx, y: cy });
                      }
                    }}
                  />

                  {/* Flag + label */}
                  {r >= 28 ? (
                    <>
                      <text
                        x={cx}
                        y={cy - (r >= 40 ? 8 : 4)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={r >= 50 ? 22 : r >= 36 ? 18 : 14}
                        className="pointer-events-none select-none"
                      >
                        {flagFor(group.country)}
                      </text>
                      {r >= 36 ? (
                        <text
                          x={cx}
                          y={cy + (r >= 50 ? 16 : 12)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={r >= 50 ? 11 : 9}
                          fontFamily="'Geist Mono', ui-monospace, monospace"
                          fontWeight={600}
                          fill={color.text}
                          className="pointer-events-none select-none"
                        >
                          {group.count}
                        </text>
                      ) : null}
                    </>
                  ) : (
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fontFamily="'Geist Mono', ui-monospace, monospace"
                      fill={color.text}
                      className="pointer-events-none select-none"
                    >
                      {group.count}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>
        )}

        {/* Tooltip flottant */}
        <AnimatePresence>
          {selected ? (
            <BubbleTooltip
              group={selected.group}
              x={selected.x}
              y={selected.y}
              onFilter={onNationFilter}
              onClose={() => setSelected(null)}
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-light">
        <LegendItem color="rgba(0,166,81,0.55)" label="Présence top 5 européen" />
        <LegendItem color="rgba(252,209,22,0.55)" label="Joueur Tier 1" />
        <LegendItem color="rgba(99,102,241,0.45)" label="Forte diaspora (+20)" />
        <LegendItem color="rgba(255,255,255,0.2)" label="Autre" />
        <span className="text-muted/50">·</span>
        <span className="font-mono text-muted">
          Taille = nombre de joueurs · Cliquer pour explorer
        </span>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full border"
        style={{ backgroundColor: color, borderColor: color }}
      />
      {label}
    </span>
  );
}
