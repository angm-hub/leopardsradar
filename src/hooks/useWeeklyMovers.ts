import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Une ligne de "Le 5 du dimanche" — alimentée par la RPC get_weekly_movers,
 * elle-même bâtie sur player_stats_weekly (snapshot dimanche soir).
 *
 * `signal` : narration courte déjà composée côté SQL.
 *   - Si delta hebdo dispo : "+2 buts, +1 PD cette semaine"
 *   - Sinon (premier snapshot ou aucune action) : "5B · 2PD sur 28 matchs"
 *
 * `has_weekly_delta` permet à l'UI d'afficher un indicateur "live" quand
 * c'est une vraie progression hebdo vs un fallback saison.
 */
export interface WeeklyMover {
  player_id: number;
  name: string;
  slug: string;
  player_position: string | null;
  image_url: string | null;
  image_url_alt: string | null;
  current_club: string | null;
  season_goals: number;
  season_assists: number;
  season_games: number;
  delta_goals: number | null;
  delta_assists: number | null;
  delta_value_eur: number | null;
  has_weekly_delta: boolean;
  signal: string;
}

export function useWeeklyMovers(topN: number = 5) {
  const [movers, setMovers] = useState<WeeklyMover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc("get_weekly_movers", {
          top_n: topN,
        });
        if (error) throw error;
        if (cancelled) return;
        setMovers((data ?? []) as WeeklyMover[]);
      } catch (e) {
        console.error("[useWeeklyMovers]", e);
        if (!cancelled) setMovers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topN]);

  return { movers, loading };
}
