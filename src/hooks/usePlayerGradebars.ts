import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GradebarAxis {
  axis: string;
  label: string;
  /** Valeur brute lisible ("67 sélections", "7.0 M€"). */
  value: string;
  /** Percentile 0-100 vs le pool de comparaison. */
  percentile: number;
  /** Moyenne du pool, lisible ("3.2 sél."). */
  pool_avg: string;
  /** Taille du pool de comparaison pour cet axe. */
  pool_n: number;
}

export interface PlayerGradebars {
  pool_label: string;
  axes: GradebarAxis[];
}

/**
 * Radar de potentiel (Sprint 3, F2 de la thèse produit) : percentiles du
 * joueur vs les joueurs du même poste, calculés côté Postgres par la RPC
 * get_player_gradebars. Seuls les axes calculables sont retournés : le
 * composant n'affiche jamais de case vide.
 */
export function usePlayerGradebars(slug: string | undefined) {
  const [data, setData] = useState<PlayerGradebars | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: res, error } = await (supabase as any).rpc(
          "get_player_gradebars",
          { p_slug: slug },
        );
        if (error) throw error;
        if (!cancelled) setData((res as PlayerGradebars) ?? null);
      } catch (e) {
        console.error("[usePlayerGradebars]", e);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { gradebars: data, loading };
}
