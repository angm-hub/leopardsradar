/**
 * DesabreXI — 11 preferentiel Leopards · Composition algorithmique.
 *
 * Selection par algo proxy :
 *   1. Meilleur score composite `level_score` par poste (si disponible)
 *   2. Fallback : `market_value_eur` desc
 *   3. Contrainte formation 4-3-3 : 1 GK + 4 DEF + 3 MID + 3 ATT
 *
 * Terrain : SVG sobre, fond graphite, lignes blanches a 15% opacite.
 * Les joueurs sont places sur la moitie superieure (banc en bas).
 * Pas de terrain vert criant — DA premium Leopards Radar.
 *
 * DISCLAIMER OBLIGATOIRE : composition algorithmique basee sur le score
 * Leopards + caps RDC. Pas le 11 officiel du staff Desabre.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormationSlot = {
  pos: DBPosition;
  /** Position X en % du SVG (0=gauche, 100=droite) */
  x: number;
  /** Position Y en % du SVG (0=haut=attaque, 100=bas=GK) */
  y: number;
  label: string;
};

// Formation 4-3-3 — Y inversé : attaquants en haut (20%), GK en bas (90%)
// Le terrain est orienté "depuis le public" : attaque en haut, défense en bas.
const FORMATION_443: FormationSlot[] = [
  // Gardien
  { pos: "Goalkeeper", x: 50, y: 90, label: "GK" },
  // Défenseurs (4)
  { pos: "Defender", x: 15, y: 73, label: "RB" },
  { pos: "Defender", x: 35, y: 73, label: "CB" },
  { pos: "Defender", x: 65, y: 73, label: "CB" },
  { pos: "Defender", x: 85, y: 73, label: "LB" },
  // Milieux (3)
  { pos: "Midfield", x: 25, y: 52, label: "MF" },
  { pos: "Midfield", x: 50, y: 52, label: "MF" },
  { pos: "Midfield", x: 75, y: 52, label: "MF" },
  // Attaquants (3)
  { pos: "Attack", x: 20, y: 28, label: "RW" },
  { pos: "Attack", x: 50, y: 22, label: "ST" },
  { pos: "Attack", x: 80, y: 28, label: "LW" },
];

const POSITION_COUNT: Record<DBPosition, number> = {
  Goalkeeper: 1,
  Defender: 4,
  Midfield: 3,
  Attack: 3,
};

// ─── Algo de selection ────────────────────────────────────────────────────────

function selectXI(players: DBPlayer[]): Array<{ player: DBPlayer; slot: FormationSlot }> {
  const roster = players.filter(
    (p) => p.player_category === "roster" && p.eligibility_status !== "ineligible",
  );

  const selected: Array<{ player: DBPlayer; slot: FormationSlot }> = [];
  const usedIds = new Set<number>();

  // Traiter chaque position dans l'ordre de la formation
  const positionsOrdered: DBPosition[] = ["Goalkeeper", "Defender", "Midfield", "Attack"];

  for (const pos of positionsOrdered) {
    const count = POSITION_COUNT[pos];
    const pool = roster
      .filter((p) => p.position === pos && !usedIds.has(p.id))
      .sort((a, b) => {
        // Critere 1 : level_score desc (si les deux ont un score)
        const scoreA = a.level_score ?? null;
        const scoreB = b.level_score ?? null;
        if (scoreA !== null && scoreB !== null) {
          if (scoreB !== scoreA) return scoreB - scoreA;
        } else if (scoreA !== null) {
          return -1;
        } else if (scoreB !== null) {
          return 1;
        }
        // Critere 2 : market_value_eur desc
        const valA = a.market_value_eur ?? 0;
        const valB = b.market_value_eur ?? 0;
        if (valB !== valA) return valB - valA;
        // Critere 3 : caps_rdc desc
        return (b.caps_rdc ?? 0) - (a.caps_rdc ?? 0);
      });

    const slots = FORMATION_443.filter((s) => s.pos === pos);
    const picks = pool.slice(0, count);

    picks.forEach((player, idx) => {
      usedIds.add(player.id);
      const slot = slots[idx] ?? slots[0];
      selected.push({ player, slot });
    });
  }

  return selected;
}

// ─── Terrain SVG ─────────────────────────────────────────────────────────────

function PitchSVG() {
  const stroke = "rgba(255,255,255,0.14)";
  const sw = 1;

  return (
    <svg
      viewBox="0 0 100 120"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className="absolute inset-0 w-full h-full"
    >
      {/* Fond */}
      <rect width="100" height="120" fill="transparent" />

      {/* Contour terrain */}
      <rect x="3" y="3" width="94" height="114" rx="1" fill="none" stroke={stroke} strokeWidth={sw} />

      {/* Ligne médiane */}
      <line x1="3" y1="60" x2="97" y2="60" stroke={stroke} strokeWidth={sw} />

      {/* Cercle central */}
      <circle cx="50" cy="60" r="12" fill="none" stroke={stroke} strokeWidth={sw} />
      <circle cx="50" cy="60" r="1.2" fill={stroke} />

      {/* Surface de réparation haute (attaque) */}
      <rect x="23" y="3" width="54" height="18" fill="none" stroke={stroke} strokeWidth={sw} />
      {/* Petite surface haute */}
      <rect x="34" y="3" width="32" height="7" fill="none" stroke={stroke} strokeWidth={sw} />
      {/* Arc de cercle surface haute */}
      <path d="M 30 21 A 12 12 0 0 1 70 21" fill="none" stroke={stroke} strokeWidth={sw} />

      {/* Surface de réparation basse (défense) */}
      <rect x="23" y="99" width="54" height="18" fill="none" stroke={stroke} strokeWidth={sw} />
      {/* Petite surface basse */}
      <rect x="34" y="110" width="32" height="7" fill="none" stroke={stroke} strokeWidth={sw} />
      {/* Arc de cercle surface basse */}
      <path d="M 30 99 A 12 12 0 0 0 70 99" fill="none" stroke={stroke} strokeWidth={sw} />

      {/* Points de penalty */}
      <circle cx="50" cy="13" r="1" fill={stroke} />
      <circle cx="50" cy="107" r="1" fill={stroke} />

      {/* Coins */}
      <path d="M 3 3 A 3 3 0 0 1 6 6" fill="none" stroke={stroke} strokeWidth={sw} />
      <path d="M 97 3 A 3 3 0 0 0 94 6" fill="none" stroke={stroke} strokeWidth={sw} />
      <path d="M 3 117 A 3 3 0 0 0 6 114" fill="none" stroke={stroke} strokeWidth={sw} />
      <path d="M 97 117 A 3 3 0 0 1 94 114" fill="none" stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

// ─── Joueur sur le terrain ────────────────────────────────────────────────────

function PlayerPin({
  player,
  slot,
}: {
  player: DBPlayer;
  slot: FormationSlot;
}) {
  return (
    <Link
      to={`/player/${player.slug}`}
      className={cn(
        "absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2",
        "group focus-visible:outline-none",
      )}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      aria-label={`${player.name} — ${POSITION_LABEL[slot.pos] ?? slot.label}`}
    >
      {/* Avatar */}
      <div className="relative">
        <PlayerAvatar
          name={player.name}
          src={player.image_url}
          srcAlt={player.image_url_alt}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-primary/40 group-hover:ring-primary transition-all duration-200 shadow-md shadow-black/60"
          initialsClassName="text-xs"
        />
        {/* Badge position */}
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/90 border border-border px-1.5 py-px text-[8px] font-mono uppercase tracking-wider text-muted-light shadow-sm">
          {slot.label}
        </span>
      </div>
      {/* Nom */}
      <p className="text-center font-serif text-[9px] sm:text-[10px] font-semibold text-foreground leading-tight max-w-[60px] sm:max-w-[72px] group-hover:text-primary transition-colors drop-shadow-md line-clamp-2">
        {player.name.split(" ").at(-1)}
      </p>
    </Link>
  );
}

// ─── Vue grille (toggle) ──────────────────────────────────────────────────────

function GridView({ xi }: { xi: Array<{ player: DBPlayer; slot: FormationSlot }> }) {
  const byPos: Partial<Record<DBPosition, Array<{ player: DBPlayer; slot: FormationSlot }>>> = {};
  xi.forEach((item) => {
    if (!byPos[item.slot.pos]) byPos[item.slot.pos] = [];
    byPos[item.slot.pos]!.push(item);
  });

  const order: DBPosition[] = ["Goalkeeper", "Defender", "Midfield", "Attack"];
  return (
    <div className="space-y-4">
      {order.map((pos) => {
        const items = byPos[pos] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={pos}>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {POSITION_LABEL[pos]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {items.map(({ player }) => (
                <Link
                  key={player.id}
                  to={`/player/${player.slug}`}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-card border border-border bg-card",
                    "hover:border-border-hover transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  )}
                >
                  <PlayerAvatar
                    name={player.name}
                    src={player.image_url}
                    srcAlt={player.image_url_alt}
                    className="h-8 w-8 rounded-full ring-1 ring-border shrink-0"
                    initialsClassName="text-[10px]"
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-xs font-semibold text-foreground truncate leading-tight">
                      {player.name}
                    </p>
                    <p className="font-mono text-[9px] text-muted-light truncate">
                      {player.current_club ?? "—"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section principale ───────────────────────────────────────────────────────

type ViewMode = "terrain" | "grille";

interface DesabreXIProps {
  players: DBPlayer[];
}

export function DesabreXI({ players }: DesabreXIProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("terrain");

  const xi = useMemo(() => selectXI(players), [players]);

  // Pas assez de joueurs par poste — on attend plus de data
  if (xi.length < 11) return null;

  return (
    <section aria-labelledby="desabre-xi-heading" className="mb-10">
      {/* En-tête + toggle */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Composition · 4-3-3
          </p>
          <h2
            id="desabre-xi-heading"
            className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground"
          >
            11 preferentiel Desabre
          </h2>
          <p className="mt-1 max-w-lg text-xs text-muted-light leading-snug">
            Composition algorithmique basee sur le score Leopards + caps RDC.
            Pas le 11 officiel du staff Desabre.
          </p>
        </div>

        {/* Toggle terrain / grille */}
        <div
          role="group"
          aria-label="Mode d'affichage"
          className="flex rounded-full border border-border bg-card p-0.5 gap-0.5 shrink-0"
        >
          {(["terrain", "grille"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewMode(v)}
              aria-pressed={viewMode === v}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                viewMode === v
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted hover:text-muted-light",
              )}
            >
              {v === "terrain" ? "Terrain" : "Grille"}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "terrain" ? (
        /* Vue terrain SVG */
        <div
          className="relative w-full overflow-hidden rounded-card border border-border bg-[#0d1117]"
          style={{ paddingBottom: "min(120%, 520px)" }}
          aria-label="Terrain de football avec le 11 algorithmique Desabre"
        >
          <div className="absolute inset-0">
            <PitchSVG />
            {xi.map(({ player, slot }) => (
              <PlayerPin key={player.id} player={player} slot={slot} />
            ))}
          </div>
        </div>
      ) : (
        /* Vue grille */
        <GridView xi={xi} />
      )}

      {/* Legende algo */}
      <p className="mt-3 font-mono text-[10px] text-muted">
        Algo : score Leopards (level_score) puis valeur marchande Transfermarkt, par poste.
      </p>
    </section>
  );
}

export default DesabreXI;
