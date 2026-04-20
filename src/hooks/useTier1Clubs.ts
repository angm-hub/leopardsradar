import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Filters out reserve / youth squads (B teams, U21, U23, II) and ineligible players,
// so the marquee on the home only showcases real first-team clubs.
function isFirstTeamClub(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  const upper = n.toUpperCase();
  if (/\bU\s?1[5-9]\b/.test(upper)) return false;
  if (/\bU\s?2[0-3]\b/.test(upper)) return false;
  if (/\bRESERVE(S)?\b/.test(upper)) return false;
  if (/\b(II|III)\b/.test(upper)) return false;
  if (/\sB$/.test(upper)) return false; // "EA Guingamp B"
  return true;
}

export function useTier1Clubs() {
  const [clubs, setClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("players")
          .select("current_club, eligibility_status, tier")
          .eq("tier", "tier1")
          .neq("eligibility_status", "ineligible")
          .not("current_club", "is", null);
        if (error) throw error;
        const unique = Array.from(
          new Set(
            ((data ?? []) as { current_club: string }[])
              .map((r) => r.current_club)
              .filter(isFirstTeamClub),
          ),
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
