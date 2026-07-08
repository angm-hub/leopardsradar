/**
 * SquadFIFA26Block — Bloc editorial Roster
 *
 * Affiche les 26 selectionnes FIFA annonces par la FECOFA pour la Coupe du
 * Monde, groupes par poste (GK · DEF · MIL · ATT), avec leur temps de jeu
 * saison 2025-2026 (minutes + matchs + buts + passes).
 *
 * Source des stats : hook useFifa26Stats qui cascade FBRef → Transfermarkt →
 * players.season_* → "n.d.". Le badge de source en haut signale la fraicheur :
 * vert = FBRef live, ambre = TM, gris = fallback.
 *
 * Tri intra-groupe : minutes desc (ceux qui jouent le plus en premier),
 * ties resolus par caps_rdc desc. Le tri par poste preserve l'ordre
 * canonique GK → DEF → MIL → ATT.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useFifa26Stats, type FIFA26PlayerStats, type StatsSource } from "@/hooks/useFifa26Stats";
import { FIFA26_SQUAD, GROUP_LABEL_FR, GROUP_ORDER } from "@/lib/fifa26Squad";
import type { DBPosition } from "@/types/dbPlayer";
import { RevealOnScroll, RevealOnScrollItem, TextRevealWords } from "@/components/motion";

// Resolution du groupe FECOFA (Mbuku/Cipenga annonces milieux mais DB Attack).
const FIFA26_GROUP_LOOKUP = new Map<number, DBPosition>(
  FIFA26_SQUAD.map((s) => [s.id, s.group]),
);

// ─── Helpers presentation ─────────────────────────────────────────────────────

function formatMinutes(min: number | null): string {
  if (min === null || min === undefined) return "n.d.";
  if (min === 0) return "0";
  return min.toLocaleString("fr-FR");
}

function formatStat(v: number | null): string {
  if (v === null || v === undefined) return "n.d.";
  return v.toLocaleString("fr-FR");
}

function sourceTone(source: StatsSource): { dot: string; label: string } {
  switch (source) {
    case "fbref":
      return { dot: "bg-emerald-400", label: "FBRef" };
    case "transfermarkt":
      return { dot: "bg-amber-300", label: "TM" };
    case "fallback":
      return { dot: "bg-slate-400", label: "DB" };
    case "none":
    default:
      return { dot: "bg-slate-700", label: "n.d." };
  }
}

// ─── Card joueur ──────────────────────────────────────────────────────────────

function SquadRow({ row }: { row: FIFA26PlayerStats }) {
  const { player, stats } = row;
  const tone = sourceTone(stats.source);
  const hasData = stats.source !== "none";
  const caps = player.caps_rdc ?? 0;
  const matches = stats.matches ?? null;
  const goals = stats.goals ?? null;
  const assists = stats.assists ?? null;
  const showGA = (goals !== null && goals > 0) || (assists !== null && assists > 0);

  return (
    <Link
      to={`/player/${player.slug}`}
      aria-label={`${player.name} · ${formatMinutes(stats.minutes)} minutes en ${formatStat(matches)} matchs saison 2025-2026, ${caps} sélections RDC`}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5",
        "border border-border/60 bg-card",
        "transition-colors duration-150 hover:border-border-hover hover:bg-card/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
    >
      <PlayerAvatar
        name={player.name}
        src={player.image_url}
        srcAlt={player.image_url_alt}
        className="h-9 w-9 rounded-full ring-1 ring-border shrink-0"
        initialsClassName="text-[10px]"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-serif text-[13px] font-semibold leading-tight text-foreground truncate group-hover:text-primary transition-colors">
            {player.name}
          </p>
          {caps > 0 && (
            <span
              title={`${caps} sélections RDC`}
              className="shrink-0 font-mono text-[9px] tabular-nums text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded leading-none"
            >
              {caps}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-light truncate mt-0.5">
          {player.current_club ?? "Sans club"}
        </p>
      </div>

      {/* Bloc stats : minutes en haut, matchs + G/A en bas */}
      <div className="flex flex-col items-end shrink-0 tabular-nums font-mono">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-base font-semibold leading-none",
              hasData ? "text-foreground" : "text-muted/50",
            )}
          >
            {formatMinutes(stats.minutes)}
          </span>
          <span className="text-[9px] uppercase tracking-[0.12em] text-muted">
            min
          </span>
        </div>
        <div className="mt-0.5 text-[9px] text-muted-light flex items-center gap-1.5 leading-none">
          <span title={`${formatStat(matches)} matchs`}>
            {formatStat(matches)}m
          </span>
          {showGA && (
            <>
              <span className="text-muted/40" aria-hidden>·</span>
              <span title={`${formatStat(goals)} buts ${formatStat(assists)} passes`} className="text-primary/70">
                {formatStat(goals)}G {formatStat(assists)}A
              </span>
            </>
          )}
        </div>
      </div>

      {/* Source indicator — discret */}
      <span
        aria-hidden
        title={`Source : ${tone.label}`}
        className={cn("h-1.5 w-1.5 rounded-full shrink-0", tone.dot)}
      />
    </Link>
  );
}

// ─── Group column ─────────────────────────────────────────────────────────────

function GroupColumn({
  group,
  rows,
}: {
  group: DBPosition;
  rows: FIFA26PlayerStats[];
}) {
  // Tri : minutes desc, ties → caps_rdc desc, ties → nom
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aMin = a.stats.minutes ?? -1;
      const bMin = b.stats.minutes ?? -1;
      if (aMin !== bMin) return bMin - aMin;
      const aCaps = a.player.caps_rdc ?? 0;
      const bCaps = b.player.caps_rdc ?? 0;
      if (aCaps !== bCaps) return bCaps - aCaps;
      return a.player.name.localeCompare(b.player.name, "fr");
    });
  }, [rows]);

  const totalMinutes = useMemo(
    () => sorted.reduce((acc, r) => acc + (r.stats.minutes ?? 0), 0),
    [sorted],
  );

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-border pb-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
          {GROUP_LABEL_FR[group]}
          <span className="ml-1.5 text-muted">· {rows.length}</span>
        </h3>
        <span className="font-mono text-[10px] text-muted tabular-nums">
          {totalMinutes.toLocaleString("fr-FR")} min cumulées
        </span>
      </div>

      <div role="list" className="flex flex-col gap-1.5">
        {sorted.map((r) => (
          <div key={r.player.id} role="listitem">
            <SquadRow row={r} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function SquadSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {GROUP_ORDER.map((g) => (
        <div key={g}>
          <div className="mb-3 h-3 w-20 rounded bg-card animate-pulse" />
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-card animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function SquadFIFA26Block() {
  const { data, loading, error } = useFifa26Stats();

  const grouped = useMemo(() => {
    const map = new Map<DBPosition, FIFA26PlayerStats[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const row of data) {
      const pos = (row.player.position as DBPosition) ?? "Midfield";
      // Force le groupe au poste annonce par la FECOFA, pas la position DB
      // (cas Mbuku/Cipenga annonces Milieu mais DB Attack).
      // On utilise un override via la liste hardcoded.
      const fromList = FIFA26_GROUP_LOOKUP.get(row.player.id) ?? pos;
      const arr = map.get(fromList) ?? [];
      arr.push(row);
      map.set(fromList, arr);
    }
    return map;
  }, [data]);

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Compte les sources pour le tag fraicheur global
  const sourceCounts = useMemo(() => {
    const counts = { fbref: 0, transfermarkt: 0, fallback: 0, none: 0 };
    for (const r of data) counts[r.stats.source] += 1;
    return counts;
  }, [data]);

  return (
    <section aria-labelledby="liste-fifa26-heading" className="mb-10">
      <RevealOnScroll className="mb-5 flex flex-wrap items-end justify-between gap-3" y={20}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
            La Liste FIFA · 26 sélectionnés
          </p>
          <h2
            id="liste-fifa26-heading"
            className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground"
          >
            <TextRevealWords as="span" stagger={0.05} startOnView blur>
              Temps de jeu saison 2025-26
            </TextRevealWords>
          </h2>
        </div>

        {!loading && (
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              FBRef {sourceCounts.fbref}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
              TM {sourceCounts.transfermarkt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
              DB {sourceCounts.fallback}
            </span>
            {sourceCounts.none > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" aria-hidden />
                · {sourceCounts.none}
              </span>
            )}
          </div>
        )}
      </RevealOnScroll>

      {error && (
        <p className="mb-3 text-xs text-blood">Erreur de chargement : {error}</p>
      )}

      {loading ? (
        <SquadSkeleton />
      ) : (
        <RevealOnScroll
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          staggerChildren={0.12}
          y={28}
        >
          {GROUP_ORDER.map((g) => {
            const rows = grouped.get(g) ?? [];
            if (rows.length === 0) return null;
            return (
              <RevealOnScrollItem key={g}>
                <GroupColumn group={g} rows={rows} />
              </RevealOnScrollItem>
            );
          })}
        </RevealOnScroll>
      )}

      <p className="mt-4 text-[10px] font-mono text-muted" aria-live="polite">
        Mise a jour le {today} · FBRef (Big5 + UEFA) · Transfermarkt (autres ligues) · fallback DB
      </p>
    </section>
  );
}

export default SquadFIFA26Block;
