/**
 * useDesabreXI — Charge la composition reelle de Desabre depuis desabre_xi_stats.
 *
 * La vue materielle desabre_xi_stats est alimentee par compute_desabre_xi.py
 * (run hebdomadaire) qui consomme national_lineups (scrape_rdc_lineups.py).
 *
 * En fallback — si la vue est vide (pas encore de scrape) — le hook retourne
 * null et le composant DesabreXI affiche la version algo proxy comme avant.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DesabreSlot {
  player_id: number;
  player_name: string;
  slug: string;
  position: string;
  appearances_total: number;
  appearances_official: number;
  start_pct: number;
  first_start: string | null;
  last_start: string | null;
}

export interface DesabreXIData {
  /** Nombre de matchs au total sous Desabre en BDD */
  total_matches: number;
  /** Formation majoritaire utilisee (ex. '4-3-3') */
  formation: string;
  /** 11 titulaires selectionnes par poste (freq max) */
  xi: DesabreSlot[];
  /** Joueurs supplementaires par poste (banc / alternatifs) */
  bench: DesabreSlot[];
  /** Derniere fraicheur du scrape */
  last_refreshed: string | null;
}

export function useDesabreXI() {
  const [data, setData] = useState<DesabreXIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. Charge la vue materielle desabre_xi_stats
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: statsRows, error: statsErr } = await (supabase as any)
          .from("desabre_xi_stats")
          .select(
            "player_id, player_name, slug, position, appearances_total, appearances_official, start_pct, first_start, last_start",
          )
          .order("appearances_total", { ascending: false });

        if (statsErr) throw statsErr;
        if (!statsRows || statsRows.length === 0) {
          // Pas encore de scrape — le composant utilisera le fallback algo
          if (!cancelled) setData(null);
          return;
        }

        // 2. Compte le nombre total de matchs sous Desabre
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count, error: countErr } = await (supabase as any)
          .from("national_lineups")
          .select("id", { count: "exact", head: true })
          .eq("coach", "Desabre");

        if (countErr) throw countErr;

        const totalMatches = count ?? 0;

        // 3. Detection formation majoritaire
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: formations, error: fmtErr } = await (supabase as any)
          .from("national_lineups")
          .select("formation")
          .eq("coach", "Desabre")
          .not("formation", "is", null);

        if (fmtErr) throw fmtErr;

        const fmtCounts: Record<string, number> = {};
        for (const row of formations ?? []) {
          if (row.formation) {
            fmtCounts[row.formation] = (fmtCounts[row.formation] ?? 0) + 1;
          }
        }
        const majorityFormation =
          Object.entries(fmtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "4-3-3";

        // 4. Selection du 11 et banc par poste selon formation
        const formationSlots: Record<string, number> = {
          Goalkeeper: 1,
          Defender: 4,
          Midfield: 3,
          Attack: 3,
        };
        const benchPerPos: Record<string, number> = {
          Goalkeeper: 2,
          Defender: 2,
          Midfield: 2,
          Attack: 2,
        };

        const byPosition: Record<string, DesabreSlot[]> = {};
        for (const row of statsRows as DesabreSlot[]) {
          const pos = row.position ?? "Unknown";
          if (!byPosition[pos]) byPosition[pos] = [];
          byPosition[pos].push(row);
        }

        const xi: DesabreSlot[] = [];
        const bench: DesabreSlot[] = [];

        for (const [pos, nStarters] of Object.entries(formationSlots)) {
          const pool = byPosition[pos] ?? [];
          xi.push(...pool.slice(0, nStarters));
          bench.push(...pool.slice(nStarters, nStarters + (benchPerPos[pos] ?? 2)));
        }

        if (!cancelled) {
          setData({
            total_matches:   totalMatches,
            formation:       majorityFormation,
            xi,
            bench,
            last_refreshed:  xi[0]?.last_start ?? null,
          });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[useDesabreXI]", msg);
        setError(msg);
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
