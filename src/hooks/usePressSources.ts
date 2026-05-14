import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PressSource {
  handle: string;
  name: string;
  count: number;
}

/**
 * Fetches the distinct list of sources currently present in `press_items`,
 * with a count per source. Used to populate the source filter dropdown
 * on `/revue-de-presse`.
 *
 * Cheap : we paginate through all rows once on mount and aggregate
 * client-side. No `group by` RPC needed at this volume.
 */
export function usePressSources() {
  const [sources, setSources] = useState<PressSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("press_items")
          .select("source_handle, source_name")
          .limit(500);
        if (error) throw error;
        if (cancelled) return;
        const map = new Map<string, PressSource>();
        for (const row of (data as { source_handle: string; source_name: string }[]) ?? []) {
          const k = row.source_handle;
          const cur = map.get(k);
          if (cur) cur.count += 1;
          else map.set(k, { handle: k, name: row.source_name, count: 1 });
        }
        const arr = Array.from(map.values()).sort((a, b) => b.count - a.count);
        setSources(arr);
      } catch (e) {
        console.warn("[usePressSources]", e);
        if (!cancelled) setSources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { sources, loading };
}
