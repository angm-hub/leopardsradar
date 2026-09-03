import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useContributorLeaderboard — classement public des contributeurs.
 *
 * Lit la vue `contributor_leaderboard` (agrégat non sensible : nom d'affichage,
 * nombre de contributions validées, badge vérifié). La vue n'expose aucun
 * email, contact ni message : la table `contributions` reste protégée par RLS.
 */

export interface ContributorRow {
  display_name: string;
  validated: number;
  is_verified: boolean;
}

export function useContributorLeaderboard() {
  const [rows, setRows] = useState<ContributorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: qErr } = await (supabase as any)
          .from("contributor_leaderboard")
          .select("display_name, validated, is_verified")
          .order("validated", { ascending: false })
          .limit(200);
        if (qErr) throw qErr;
        if (!cancelled) setRows((data ?? []) as ContributorRow[]);
      } catch (e) {
        console.error("[useContributorLeaderboard]", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, error };
}
