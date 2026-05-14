import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Weekly deltas for the home hero strip.
 *
 *   * lastSundayAt        — anchor of the editorial week, Europe/Paris
 *   * newSinceSunday      — players added since last Sunday 00:00 Paris
 *   * enrichedSinceSunday — players already in the base whose updated_at
 *                            moved since Sunday (data work, not raw growth)
 *   * eligibilityChanges7d — count of FIFA detector recomputations in 7d
 *
 * Backed by the `v_home_stats_weekly` Postgres view (read-only).
 */
export interface HomeStatsWeekly {
  lastSundayAt: string | null;
  newSinceSunday: number;
  enrichedSinceSunday: number;
  eligibilityChanges7d: number;
}

interface RawWeeklyRow {
  last_sunday_at: string | null;
  new_since_sunday: number | null;
  enriched_since_sunday: number | null;
  eligibility_changes_7d: number | null;
}

export function useHomeStatsWeekly() {
  const [stats, setStats] = useState<HomeStatsWeekly | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("v_home_stats_weekly")
          .select("*")
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        const row = data as RawWeeklyRow | null;
        if (!row) {
          setStats(null);
          return;
        }
        setStats({
          lastSundayAt: row.last_sunday_at,
          newSinceSunday: row.new_since_sunday ?? 0,
          enrichedSinceSunday: row.enriched_since_sunday ?? 0,
          eligibilityChanges7d: row.eligibility_changes_7d ?? 0,
        });
      } catch (e) {
        // Silent fallback : weekly deltas are a "nice to have" — if the view
        // is unreachable, we just don't show the +N badge. No error UI.
        if (!cancelled) {
          console.warn("[useHomeStatsWeekly]", e);
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading };
}
