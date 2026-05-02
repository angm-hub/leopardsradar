import { useMemo } from "react";
import { GradientBackdrop } from "./GradientBackdrop";
import { PlayerPill } from "./PlayerPill";
import { InfoPanel } from "./InfoPanel";
import { AxisGuides } from "./AxisGuides";
import { QuadrantLabels } from "./QuadrantLabels";
import { RadarHeader } from "./RadarHeader";
import type { DBPlayer } from "@/types/dbPlayer";

interface RadarCanvasProps {
  players: DBPlayer[];
  totalRoster: number;
}

const MAX_PILLS = 80;
const SAFE_MARGIN = 12; // % — plus large pour aérer
const TOP_FEATURED = 3;

/**
 * RadarCanvas — vue "Carte" du Radar.
 *
 * Architecture en couches (du fond vers la surface) :
 *   1. GradientBackdrop  → aurora RDC discrète
 *   2. AxisGuides        → 2 labels d'axe en bord
 *   3. QuadrantLabels    → 4 mots aux coins
 *   4. InfoPanel         → metrics live top-left
 *   5. PlayerPills       → couche cliquable
 *
 * Tout le reste (constellation, drapeau, boussole, grille, vignette) a
 * été retiré : chaque ornement supplémentaire dégradait la lisibilité
 * des joueurs, qui sont la donnée centrale.
 *
 * Algo de positionnement :
 *   - X (gauche → droite) : valeur marchande croissante
 *   - Y (haut → bas)      : âge croissant (jeune en haut)
 *   - jitter pseudo-aléatoire pour éviter les empilements
 */
export function RadarCanvas({ players, totalRoster }: RadarCanvasProps) {
  const featuredIds = useMemo(() => {
    const sorted = [...players]
      .filter((p) => (p.market_value_eur ?? 0) > 0)
      .sort((a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0))
      .slice(0, TOP_FEATURED);
    return new Set(sorted.map((p) => p.id));
  }, [players]);

  const positioned = useMemo(() => {
    if (players.length === 0) return [];
    const subset = players.slice(0, MAX_PILLS);

    // Rank-based positioning : chaque joueur prend la position de son
    // percentile dans la distribution. Garantit une répartition uniforme
    // sur tout le canvas, indépendamment de la forme de la distribution
    // (l'âge se concentre autour de 25 ans, la valeur suit une power law
    // — le rank-based corrige les deux d'un coup).
    const byValue = [...subset].sort(
      (a, b) => (a.market_value_eur ?? 0) - (b.market_value_eur ?? 0),
    );
    const byAge = [...subset].sort((a, b) => (a.age ?? 99) - (b.age ?? 99));
    const valueRank = new Map(byValue.map((p, i) => [p.id, i]));
    const ageRank = new Map(byAge.map((p, i) => [p.id, i]));

    const denom = Math.max(subset.length - 1, 1);
    const usable = 100 - 2 * SAFE_MARGIN;

    return subset.map((p) => {
      const xRank = valueRank.get(p.id) ?? 0;
      const yRank = ageRank.get(p.id) ?? 0;

      // X : faible valeur à gauche (rank 0) → haute valeur à droite (rank N-1)
      const xRaw = (xRank / denom) * usable + SAFE_MARGIN;
      // Y : jeune en haut (rank 0) → confirmé en bas (rank N-1)
      const yRaw = (yRank / denom) * usable + SAFE_MARGIN;

      // Jitter déterministe — plus large pour mieux décongestionner
      const seed = (p.id * 9301 + 49297) % 233280;
      const jitterX = (seed / 233280 - 0.5) * 6;
      const jitterY = (((seed * 7) % 233280) / 233280 - 0.5) * 6;

      return {
        player: p,
        x: Math.max(SAFE_MARGIN, Math.min(100 - SAFE_MARGIN, xRaw + jitterX)),
        y: Math.max(SAFE_MARGIN, Math.min(100 - SAFE_MARGIN, yRaw + jitterY)),
      };
    });
  }, [players]);

  // 2-pass repulsion to break the worst overlaps. Cheap O(n²) on n ≤ 80
  // pills. We approximate each pill as a 7×4 rect in % coordinates and
  // nudge overlapping neighbours apart by a fraction of the overlap.
  const decongested = useMemo(() => {
    if (positioned.length === 0) return positioned;
    const PAD_X = 7; // % horizontal min separation
    const PAD_Y = 4; // % vertical min separation
    const PASSES = 2;
    const next = positioned.map((p) => ({ ...p }));
    for (let pass = 0; pass < PASSES; pass++) {
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const a = next[i];
          const b = next[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const ax = Math.abs(dx);
          const ay = Math.abs(dy);
          if (ax < PAD_X && ay < PAD_Y) {
            const overlapX = (PAD_X - ax) * 0.5;
            const overlapY = (PAD_Y - ay) * 0.5;
            const sx = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
            const sy = dy === 0 ? (j % 2 === 0 ? 1 : -1) : Math.sign(dy);
            // Bias the nudge along the smaller-overlap axis so we don't
            // spread the cloud unnecessarily.
            if (overlapX < overlapY) {
              a.x -= sx * overlapX;
              b.x += sx * overlapX;
            } else {
              a.y -= sy * overlapY;
              b.y += sy * overlapY;
            }
            a.x = Math.max(SAFE_MARGIN, Math.min(100 - SAFE_MARGIN, a.x));
            a.y = Math.max(SAFE_MARGIN, Math.min(100 - SAFE_MARGIN, a.y));
            b.x = Math.max(SAFE_MARGIN, Math.min(100 - SAFE_MARGIN, b.x));
            b.y = Math.max(SAFE_MARGIN, Math.min(100 - SAFE_MARGIN, b.y));
          }
        }
      }
    }
    return next;
  }, [positioned]);

  const positionsCount = useMemo(() => {
    const counts = { gk: 0, def: 0, mid: 0, att: 0 };
    players.forEach((p) => {
      if (p.position === "Goalkeeper") counts.gk++;
      else if (p.position === "Defender") counts.def++;
      else if (p.position === "Midfield") counts.mid++;
      else if (p.position === "Attack") counts.att++;
    });
    return counts;
  }, [players]);

  const avgAge = useMemo(() => {
    const ages = players.map((p) => p.age).filter((a): a is number => !!a);
    if (ages.length === 0) return null;
    return ages.reduce((s, a) => s + a, 0) / ages.length;
  }, [players]);

  const totalValue = useMemo(() => {
    return players.reduce((s, p) => s + (p.market_value_eur ?? 0), 0);
  }, [players]);

  const overflow = players.length > MAX_PILLS;

  return (
    <div className="relative w-full">
      <RadarHeader
        shown={players.length}
        total={totalRoster}
        totalValue={totalValue}
      />

      {/* Canvas — 4:3 mobile, carré desktop */}
      <div className="relative aspect-[4/3] md:aspect-square w-full rounded-card overflow-hidden border border-border/60 bg-background">
        <GradientBackdrop />
        <AxisGuides />
        <QuadrantLabels />

        <InfoPanel
          total={totalRoster}
          shown={players.length}
          positions={positionsCount}
          avgAge={avgAge}
        />

        {decongested.map(({ player, x, y }, i) => (
          <PlayerPill
            key={player.id}
            player={player}
            x={x}
            y={y}
            index={i}
            featured={featuredIds.has(player.id)}
          />
        ))}

        {/* État vide */}
        {players.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-[3]">
            <p className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-light">
              Aucun joueur ne correspond à ces filtres.
            </p>
          </div>
        ) : null}
      </div>

      {/* Légende compacte */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-light">
        <LegendDot color="bg-pos-gk" label="Gardien" />
        <LegendDot color="bg-pos-def" label="Défenseur" />
        <LegendDot color="bg-pos-mid" label="Milieu" />
        <LegendDot color="bg-pos-att" label="Attaquant" />
        <span className="text-muted/50">·</span>
        <span className="text-muted">
          Halo doré = top {TOP_FEATURED} valeur
        </span>
      </div>

      {overflow ? (
        <p className="mt-3 text-xs text-muted-light text-center">
          Affichage limité à {MAX_PILLS} joueurs sur {players.length}.
          Resserrez les filtres.
        </p>
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${color}`} aria-hidden />
      {label}
    </span>
  );
}
