import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NextMatch {
  id: string;
  kickoff_at: string;
  opponent_name: string;
  opponent_code: string | null;
  opponent_flag: string | null;
  competition: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  home_or_away: "home" | "away" | "neutral";
  status: string;
}

export function useNextMatch() {
  const [match, setMatch] = useState<NextMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("matches")
          .select("*")
          .eq("is_published", true)
          .in("status", ["scheduled", "live"])
          .gte("kickoff_at", new Date().toISOString())
          .order("kickoff_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setMatch((data as NextMatch) ?? null);
      } catch (e) {
        if (!cancelled) {
          console.error("[useNextMatch]", e);
          setMatch(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { match, loading };
}
