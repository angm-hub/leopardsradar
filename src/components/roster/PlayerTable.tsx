import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  POSITION_LABEL,
  POSITION_BADGE,
  POSITION_DOT,
  flagFor,
  formatMarketValue,
} from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

type SortCol = "value" | "age" | "caps" | "name";
type SortDir = "asc" | "desc";

interface PlayerTableProps {
  position: DBPosition;
  players: DBPlayer[];
}

const SECTION_META: Record<
  DBPosition,
  { kicker: string; title: string; tagline: string }
> = {
  Goalkeeper: { kicker: "Ligne 1", title: "Les gardiens.", tagline: "La dernière barrière" },
  Defender: { kicker: "Ligne 2", title: "Les défenseurs.", tagline: "L'arrière-garde" },
  Midfield: { kicker: "Ligne 3", title: "Les milieux.", tagline: "Le moteur" },
  Attack: { kicker: "Ligne 4", title: "Les attaquants.", tagline: "La pointe" },
};

const formatBirthShort = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
};

const formatFoot = (foot: string | null): string => {
  if (!foot) return "—";
  if (foot === "left") return "G";
  if (foot === "right") return "D";
  if (foot === "both") return "Amb";
  return "—";
};

const formatValueShort = (eur: number | null): string => {
  if (!eur || eur <= 0) return "—";
  if (eur >= 1_000_000) return `${(eur / 1_000_000).toFixed(eur >= 10_000_000 ? 0 : 1)} M€`;
  if (eur >= 1_000) return `${Math.round(eur / 1_000)} k€`;
  return `${eur} €`;
};

/**
 * PlayerTable — table dense Transfermarkt-style par poste.
 *
 * Desktop : layout grid 9-cols cliquable, headers triables avec icônes,
 * top-row de la section avec accent primary (border-left + halo jaune).
 * Footer aggregat : count + valeur cumulée + âge médian.
 *
 * Mobile : auto-bascule vers cards compactes (la table ne tient pas).
 *
 * Inspiration : Transfermarkt squad page, mais signature kAIra (mono
 * uppercase headers, serif noms, primary halo sur top-row, dark mode).
 */
export function PlayerTable({ position, players }: PlayerTableProps) {
  const [sortCol, setSortCol] = useState<SortCol>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const meta = SECTION_META[position];

  const sorted = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      let diff = 0;
      if (sortCol === "value") diff = (a.market_value_eur ?? -1) - (b.market_value_eur ?? -1);
      else if (sortCol === "age") diff = (a.age ?? 999) - (b.age ?? 999);
      else if (sortCol === "caps") diff = (a.caps_rdc ?? 0) - (b.caps_rdc ?? 0);
      else if (sortCol === "name") diff = a.name.localeCompare(b.name);
      return sortDir === "asc" ? diff : -diff;
    });
    return list;
  }, [players, sortCol, sortDir]);

  // Stats agrégées de la section
  const stats = useMemo(() => {
    const values = players.map((p) => p.market_value_eur ?? 0).filter((v) => v > 0);
    const ages = players.map((p) => p.age).filter((a): a is number => !!a);
    const totalValue = values.reduce((s, v) => s + v, 0);
    const avgAge = ages.length > 0 ? ages.reduce((s, a) => s + a, 0) / ages.length : null;
    return { totalValue, avgAge };
  }, [players]);

  // Top row : la valeur la plus haute de la section après le tri courant
  const topId = useMemo(() => {
    if (players.length === 0) return null;
    return [...players]
      .sort((a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0))[0].id;
  }, [players]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "name" ? "asc" : "desc");
    }
  };

  if (players.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Header section */}
      <div className="flex items-baseline justify-between flex-wrap gap-3 border-b border-border pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
            {meta.kicker} · {meta.tagline}
          </p>
          <h2 className="mt-2 font-serif text-2xl md:text-3xl text-foreground tracking-tight">
            {meta.title}
          </h2>
        </div>
        <p className="text-xs text-muted-light font-mono">
          {players.length} joueur{players.length > 1 ? "s" : ""}
          {stats.totalValue > 0 ? ` · ${formatValueShort(stats.totalValue)} cumulé` : ""}
          {stats.avgAge !== null ? ` · ${stats.avgAge.toFixed(1)} ans en moyenne` : ""}
        </p>
      </div>

      {/* DESKTOP : table dense (md+) */}
      <div className="hidden md:block rounded-card border border-border overflow-hidden">
        {/* Header row */}
        <div
          className="grid items-center gap-3 px-4 py-2.5 bg-card/60 border-b border-border text-[9px] uppercase tracking-[0.18em] font-mono text-muted"
          style={{ gridTemplateColumns: "32px minmax(0,2.6fr) 60px 90px 50px 40px minmax(0,1.4fr) 50px 80px" }}
        >
          <span>#</span>
          <SortHeader label="Joueur" col="name" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
          <span>Pos</span>
          <SortHeader label="Né le" col="age" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
          <span className="text-right">Taille</span>
          <span className="text-center">Pied</span>
          <span>Club</span>
          <SortHeader label="Caps" col="caps" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
          <SortHeader label="Valeur" col="value" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
        </div>

        {/* Rows */}
        <ul className="divide-y divide-border">
          {sorted.map((p, idx) => (
            <PlayerTableRow
              key={p.slug}
              player={p}
              rank={idx + 1}
              isTop={p.id === topId}
              animDelay={idx * 0.018}
            />
          ))}
        </ul>
      </div>

      {/* MOBILE : cards compactes (sub-md) */}
      <ul className="md:hidden divide-y divide-border rounded-card border border-border overflow-hidden">
        {sorted.map((p) => (
          <li key={p.slug}>
            <Link
              to={`/player/${p.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-card-hover transition-colors"
            >
              <PlayerAvatar
                name={p.name}
                src={p.image_url}
                className="h-10 w-10 rounded-full shrink-0 ring-1 ring-border"
                initialsClassName="text-xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-sm text-foreground truncate">{p.name}</span>
                  {p.other_nationalities[0] ? (
                    <span className="text-xs leading-none">{flagFor(p.other_nationalities[0])}</span>
                  ) : null}
                </div>
                <p className="text-[10px] text-muted truncate font-mono">
                  {p.current_club ?? "—"} · {p.age ? `${p.age} ans` : "—"}
                </p>
              </div>
              <span className="text-[11px] font-mono text-primary/90 shrink-0">
                {formatValueShort(p.market_value_eur)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface SortHeaderProps {
  label: string;
  col: SortCol;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: "left" | "right";
}

function SortHeader({ label, col, sortCol, sortDir, onSort, align = "left" }: SortHeaderProps) {
  const isActive = sortCol === col;
  const Icon = !isActive ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        isActive ? "text-primary" : "text-muted",
        align === "right" && "justify-end",
      )}
    >
      {label}
      <Icon className="h-2.5 w-2.5" />
    </button>
  );
}

interface RowProps {
  player: DBPlayer;
  rank: number;
  isTop: boolean;
  animDelay: number;
}

function PlayerTableRow({ player, rank, isTop, animDelay }: RowProps) {
  const flag = player.other_nationalities[0] ?? player.nationalities[0];
  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: animDelay, ease: "easeOut" }}
    >
      <Link
        to={`/player/${player.slug}`}
        className={cn(
          "grid items-center gap-3 px-4 py-2.5 group",
          "hover:bg-card-hover transition-colors",
          isTop && "border-l-2 border-primary bg-primary/5",
        )}
        style={{ gridTemplateColumns: "32px minmax(0,2.6fr) 60px 90px 50px 40px minmax(0,1.4fr) 50px 80px" }}
      >
        <span className="font-mono text-[11px] text-muted">{rank}</span>

        {/* Joueur (avatar + nom + flag) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            className="h-8 w-8 rounded-full shrink-0 ring-1 ring-border group-hover:ring-primary/40 transition-all"
            initialsClassName="text-[10px]"
          />
          <span className="font-serif text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {player.name}
          </span>
          {flag ? (
            <span className="text-xs leading-none shrink-0">{flagFor(flag)}</span>
          ) : null}
        </div>

        {/* Position badge */}
        <span>
          {player.position ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                POSITION_BADGE[player.position],
              )}
            >
              <span
                aria-hidden
                className={cn("inline-block h-1 w-1 rounded-full", POSITION_DOT[player.position])}
              />
              {POSITION_LABEL[player.position].slice(0, 3)}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </span>

        {/* Né le (avec âge en sub) */}
        <span className="font-mono text-[11px] text-muted-light">
          {formatBirthShort(player.date_of_birth)}
          {player.age ? <span className="text-muted ml-1">({player.age})</span> : null}
        </span>

        {/* Taille */}
        <span className="font-mono text-[11px] text-muted-light text-right">
          {player.height_cm ? `${player.height_cm}` : "—"}
        </span>

        {/* Pied */}
        <span className="font-mono text-[11px] text-muted-light text-center">
          {formatFoot(player.foot)}
        </span>

        {/* Club */}
        <span className="text-xs text-foreground/85 truncate">
          {player.current_club ?? "—"}
        </span>

        {/* Caps */}
        <span className="font-mono text-[11px] text-foreground/90 text-right">
          {player.caps_rdc ?? 0}
        </span>

        {/* Valeur */}
        <span
          className={cn(
            "font-mono text-[11px] text-right shrink-0",
            isTop ? "text-primary font-semibold" : "text-foreground/90",
          )}
        >
          {formatValueShort(player.market_value_eur)}
        </span>
      </Link>
    </motion.li>
  );
}
