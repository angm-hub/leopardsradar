/**
 * useInsights — fetch les 3 vues matérialisées Sprint 5 du brief v3.
 *
 * Lit en parallèle :
 *   - mv_eligibility_pipeline : répartition par statut FIFA
 *   - mv_club_concentration : clubs avec ≥2 Léopards éligibles
 *   - mv_profile_insights : profil type local vs diaspora vs unknown
 *
 * Les 3 vues sont read-only, accessibles à anon (GRANT SELECT). Refresh
 * hebdo via le cron refresh-insights.yml dimanche 14h UTC. La data est
 * stable sur la journée — staleTime React Query 1h pour minimiser les
 * round-trips sans risque de servir du périmé.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────

export interface EligibilityRow {
  status: string;                  // 'SELECTED' | 'ELIGIBLE' | 'POTENTIALLY_ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN'
  player_count: number;
  avg_market_value_eur: number | null;
  total_market_value_eur: number | null;
  top_players_by_value: string | null;
}

export interface ClubConcentrationRow {
  club_name: string;
  leopards_count: number;
  avg_value_eur: number | null;
  players: string;
  top_band_rank: number;           // 1 = elite, 5 = watch, 9 = unknown
}

export interface ProfileInsightRow {
  player_origin: "local" | "diaspora" | "unknown";
  total_players: number;
  avg_age: number | null;
  avg_market_value_eur: number | null;
  median_market_value_eur: number | null;
  pct_with_caps_rdc: number | null;
  most_common_position: string | null;
  dominant_band: string | null;
  avg_season_minutes: number | null;
}

export interface InsightsBundle {
  eligibility: EligibilityRow[];
  clubs: ClubConcentrationRow[];
  profiles: ProfileInsightRow[];
}

// ─── Fetcher ──────────────────────────────────────────────────────────

async function fetchInsights(): Promise<InsightsBundle> {
  const [elig, clubs, profiles] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("mv_eligibility_pipeline")
      .select("*")
      .order("player_count", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("mv_club_concentration")
      .select("*")
      .order("leopards_count", { ascending: false })
      .limit(20),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("mv_profile_insights")
      .select("*")
      .order("player_origin"),
  ]);

  if (elig.error) throw elig.error;
  if (clubs.error) throw clubs.error;
  if (profiles.error) throw profiles.error;

  return {
    eligibility: (elig.data ?? []) as EligibilityRow[],
    clubs: (clubs.data ?? []) as ClubConcentrationRow[],
    profiles: (profiles.data ?? []) as ProfileInsightRow[],
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useInsights() {
  return useQuery({
    queryKey: ["insights-bundle"],
    queryFn: fetchInsights,
    staleTime: 60 * 60 * 1000,     // 1h — refresh hebdo de la BDD
    gcTime: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
