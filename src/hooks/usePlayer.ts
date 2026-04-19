import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/types/player";
import { mapRowToPlayer, type PlayerRow } from "./mapPlayer";

export function usePlayer(slug: string | undefined) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await (supabase as any)
          .from("players")
          .select("*, clubs(*), season_stats(*), selections_rdc(*)")
          .eq("slug", slug)
          .maybeSingle();
        if (err) throw err;
        if (cancelled) return;
        setPlayer(data ? mapRowToPlayer(data as PlayerRow) : null);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[usePlayer]", msg);
        setError(msg);
        setPlayer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { player, loading, error };
}
