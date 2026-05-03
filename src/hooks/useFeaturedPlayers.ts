import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer } from "@/types/dbPlayer";

/**
 * useFeaturedPlayers — top "À suivre" éditorial pour la home.
 *
 * Critères :
 *   - roster only (joueurs effectivement convoqués cette saison)
 *   - éligible (no cap-tied)
 *   - photo présente (sinon le bandeau visuel s'effondre)
 *   - tri : contribution offensive saison pondérée (3 × buts + 2 × passes décisives)
 *           puis valeur marché en départage. Les défenseurs et gardiens scorent
 *           rarement → ce tri force naturellement la mise en avant des
 *           éléments à plus fort impact week-end.
 *
 * On limite à 5 — assez pour un bandeau scrollable, assez court pour rester
 * dans la fold sur desktop.
 */
export function useFeaturedPlayers(limit: number = 5) {
  const [players, setPlayers] = useState<DBPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("players")
          .select("*")
          .eq("player_category", "roster")
          .neq("eligibility_status", "ineligible")
          .not("image_url", "is", null)
          .order("season_goals", { ascending: false, nullsFirst: false })
          .order("season_assists", { ascending: false, nullsFirst: false })
          .order("market_value_eur", { ascending: false, nullsFirst: false })
          .limit(limit);
        if (error) throw error;
        if (cancelled) return;
        setPlayers((data ?? []) as DBPlayer[]);
      } catch (e) {
        console.error("[useFeaturedPlayers]", e);
        if (!cancelled) setPlayers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { players, loading };
}
