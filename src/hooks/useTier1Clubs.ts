import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTier1Clubs() {
  const [clubs, setClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("v_players_tier1")
          .select("current_club")
          .not("current_club", "is", null);
        if (error) throw error;
        const unique = Array.from(
          new Set(((data ?? []) as { current_club: string }[]).map((r) => r.current_club)),
        ).sort((a, b) => a.localeCompare(b));
        if (!cancelled) setClubs(unique);
      } catch (e) {
        console.error("[useTier1Clubs]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { clubs, loading };
}
