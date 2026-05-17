import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

interface UseRelatedPlayersInput {
  position: DBPosition | null;
  excludeSlug: string | undefined;
  limit?: number;
}

/**
 * useRelatedPlayers — récupère N joueurs du même poste, hors le profil
 * en cours. Sert de "Plus de Léopards" en bas de fiche, pour éviter le
 * cul-de-sac et approfondir la session.
 */
export function useRelatedPlayers({
  position,
  excludeSlug,
  limit = 4,
}: UseRelatedPlayersInput) {
  const [players, setPlayers] = useState<DBPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!position) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from("players")
          .select("*")
          .eq("position", position)
          .eq("player_category", "roster")
          .neq("eligibility_status", "ineligible")
          .neq("archived", true)
          .order("market_value_eur", { ascending: false, nullsFirst: false })
          .limit(limit + 1); // +1 pour pouvoir retirer le current

        if (excludeSlug) query = query.neq("slug", excludeSlug);

        const { data, error } = await query;
        if (error) throw error;
        if (cancelled) return;
        const rows = (data ?? []) as DBPlayer[];
        setPlayers(rows.slice(0, limit));
      } catch (e) {
        console.error("[useRelatedPlayers]", e);
        if (!cancelled) setPlayers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [position, excludeSlug, limit]);

  return { players, loading };
}
