/**
 * useFifa26Stats — Charge les stats agregees saison 2025-2026 pour les 26
 * selectionnes FIFA RDC.
 *
 * Cascade des sources, du plus fiable au plus tolerant :
 *   1. player_stats_advanced (FBRef, frais 17/05/2026, Big5 + UCL/UEL/UECL)
 *   2. player_stats_multi (TM /leistungsdaten/, couverture monde entier)
 *   3. players.season_*  (fallback historique players table)
 *   4. null = pas de data → affichage "—"
 *
 * Une seule source par joueur : on ne mixe pas pour eviter les double-comptes.
 * Si FBRef a 2 competitions (L1 + UCL), on SOMME ces deux competitions FBRef.
 * Si on bascule sur TM, on SOMME toutes les competitions TM.
 *
 * On expose aussi la "source effective" par joueur pour pouvoir signaler
 * la fiabilite cote UI (badge "FBRef" vs "Transfermarkt" vs "Players DB").
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FIFA26_PLAYER_IDS } from "@/lib/fifa26Squad";

export type StatsSource = "fbref" | "transfermarkt" | "fallback" | "none";

export interface AggregatedStats {
  minutes: number | null;
  matches: number | null;
  goals: number | null;
  assists: number | null;
  /** Plus haut tier de competition consolide (1=Big5/UCL, 4=exotic) */
  best_tier: number | null;
  source: StatsSource;
}

interface PlayerRow {
  id: number;
  name: string;
  slug: string;
  position: string | null;
  current_club: string | null;
  image_url: string | null;
  image_url_alt: string | null;
  age: number | null;
  caps_rdc: number | null;
  market_value_eur: number | null;
  season_minutes: number | null;
  season_games: number | null;
  season_goals: number | null;
  season_assists: number | null;
}

interface PsaRow {
  player_id: number;
  minutes_played: number | null;
  matches_played: number | null;
  goals: number | null;
  assists: number | null;
  competition: string | null;
}

interface PsmRow {
  player_id: number;
  source: string;
  minutes_played: number | null;
  matches_played: number | null;
  goals: number | null;
  assists: number | null;
  competition: string | null;
  competition_tier: number | null;
}

export interface FIFA26PlayerStats {
  player: PlayerRow;
  stats: AggregatedStats;
}

const SEASON = "2025-2026";

function sumNullable(values: Array<number | null | undefined>): number | null {
  const numeric = values.filter((v): v is number => typeof v === "number");
  if (numeric.length === 0) return null;
  return numeric.reduce((acc, n) => acc + n, 0);
}

function aggregatePsa(rows: PsaRow[]): AggregatedStats | null {
  if (rows.length === 0) return null;
  return {
    minutes: sumNullable(rows.map((r) => r.minutes_played)),
    matches: sumNullable(rows.map((r) => r.matches_played)),
    goals:   sumNullable(rows.map((r) => r.goals)),
    assists: sumNullable(rows.map((r) => r.assists)),
    best_tier: 1, // FBRef = Big5/UCL = tier 1 par definition
    source: "fbref",
  };
}

function aggregatePsmTransfermarkt(rows: PsmRow[]): AggregatedStats | null {
  // On filtre uniquement source=transfermarkt pour eviter melanger sofascore/etc.
  const tmRows = rows.filter((r) => r.source === "transfermarkt");
  if (tmRows.length === 0) return null;
  const tiers = tmRows
    .map((r) => r.competition_tier)
    .filter((t): t is number => typeof t === "number");
  return {
    minutes: sumNullable(tmRows.map((r) => r.minutes_played)),
    matches: sumNullable(tmRows.map((r) => r.matches_played)),
    goals:   sumNullable(tmRows.map((r) => r.goals)),
    assists: sumNullable(tmRows.map((r) => r.assists)),
    best_tier: tiers.length > 0 ? Math.min(...tiers) : null,
    source: "transfermarkt",
  };
}

function fallbackToPlayersTable(p: PlayerRow): AggregatedStats | null {
  // On garde le fallback uniquement si au moins une donnee est non-zero
  // pour eviter d'afficher "0 min · 0 matchs" comme une vraie info.
  const minutes = p.season_minutes ?? 0;
  const matches = p.season_games ?? 0;
  const goals   = p.season_goals ?? 0;
  const assists = p.season_assists ?? 0;
  if (minutes === 0 && matches === 0 && goals === 0 && assists === 0) return null;
  return {
    minutes: minutes || null,
    matches: matches || null,
    goals:   goals,
    assists: assists,
    best_tier: null,
    source: "fallback",
  };
}

export function useFifa26Stats() {
  const [data, setData] = useState<FIFA26PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const ids = FIFA26_PLAYER_IDS;

        // Fetch parallel : players + PSA + PSM (tous restreints aux 26)
        const [playersRes, psaRes, psmRes] = await Promise.all([
          (supabase as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                in: (c: string, v: number[]) => Promise<{ data: PlayerRow[] | null; error: unknown }>;
              };
            };
          })
            .from("players")
            .select(
              "id, name, slug, position, current_club, image_url, image_url_alt, age, caps_rdc, market_value_eur, season_minutes, season_games, season_goals, season_assists",
            )
            .in("id", ids),

          (supabase as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                in: (c: string, v: number[]) => {
                  eq: (c: string, v: string) => Promise<{ data: PsaRow[] | null; error: unknown }>;
                };
              };
            };
          })
            .from("player_stats_advanced")
            .select("player_id, minutes_played, matches_played, goals, assists, competition")
            .in("player_id", ids)
            .eq("season", SEASON),

          (supabase as unknown as {
            from: (t: string) => {
              select: (s: string) => {
                in: (c: string, v: number[]) => {
                  eq: (c: string, v: string) => Promise<{ data: PsmRow[] | null; error: unknown }>;
                };
              };
            };
          })
            .from("player_stats_multi")
            .select("player_id, source, minutes_played, matches_played, goals, assists, competition, competition_tier")
            .in("player_id", ids)
            .eq("season", SEASON),
        ]);

        if (cancelled) return;

        if (playersRes.error) throw playersRes.error;
        if (psaRes.error)     throw psaRes.error;
        if (psmRes.error)     throw psmRes.error;

        const players = playersRes.data ?? [];
        const psaByPlayer = new Map<number, PsaRow[]>();
        for (const r of psaRes.data ?? []) {
          const arr = psaByPlayer.get(r.player_id) ?? [];
          arr.push(r);
          psaByPlayer.set(r.player_id, arr);
        }
        const psmByPlayer = new Map<number, PsmRow[]>();
        for (const r of psmRes.data ?? []) {
          const arr = psmByPlayer.get(r.player_id) ?? [];
          arr.push(r);
          psmByPlayer.set(r.player_id, arr);
        }

        const result: FIFA26PlayerStats[] = players.map((p) => {
          const psa = aggregatePsa(psaByPlayer.get(p.id) ?? []);
          if (psa) return { player: p, stats: psa };

          const tm = aggregatePsmTransfermarkt(psmByPlayer.get(p.id) ?? []);
          if (tm) return { player: p, stats: tm };

          const fb = fallbackToPlayersTable(p);
          if (fb) return { player: p, stats: fb };

          return {
            player: p,
            stats: {
              minutes: null, matches: null, goals: null, assists: null,
              best_tier: null, source: "none",
            },
          };
        });

        setData(result);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        setError(msg);
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
