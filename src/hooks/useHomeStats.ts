import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { HomeStats } from "@/types/dbPlayer";

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: err } = await (supabase as any)
          .from("v_home_stats")
          .select("*")
          .maybeSingle();
        if (err) throw err;
        if (!cancelled) setStats((data as HomeStats) ?? null);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[useHomeStats]", msg);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}
