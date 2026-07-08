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
  score_rdc: number | null;
  score_opponent: number | null;
}

/**
 * Prochain match RDC s'il y en a un de programmé, sinon le dernier résultat.
 *
 * Entre deux fenêtres internationales, la table matches n'a rien de
 * "scheduled" dans le futur : plutôt que d'afficher un "Calendrier à venir"
 * vide (le bug de la période Mondial 2026, où le site semblait ignorer la
 * compétition), on retombe sur le dernier match terminé avec son score.
 */
export function useNextMatch() {
  const [match, setMatch] = useState<NextMatch | null>(null);
  const [isResult, setIsResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: next, error } = await (supabase as any)
          .from("matches")
          .select("*")
          .eq("is_published", true)
          .in("status", ["scheduled", "live"])
          .gte("kickoff_at", new Date().toISOString())
          .order("kickoff_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (next) {
          if (!cancelled) {
            setMatch(next as NextMatch);
            setIsResult(false);
          }
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: last, error: lastError } = await (supabase as any)
          .from("matches")
          .select("*")
          .eq("is_published", true)
          .eq("status", "finished")
          .order("kickoff_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastError) throw lastError;
        if (!cancelled) {
          setMatch((last as NextMatch) ?? null);
          setIsResult(Boolean(last));
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[useNextMatch]", e);
          setMatch(null);
          setIsResult(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { match, isResult, loading };
}
