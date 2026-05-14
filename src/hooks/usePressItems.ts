import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBPressItem, PressCategory } from "@/types/pressItem";

interface UsePressItemsOpts {
  /** Limit row count. Defaults to 30. */
  limit?: number;
  /** Optional filter by category. */
  category?: PressCategory | null;
  /** Optional max age window in days (e.g. 7 = last week). */
  windowDays?: number | null;
  /** Filter to is_featured=true (used by the home preview row). */
  featuredOnly?: boolean;
  /** Optional filter by source handle (e.g. "@FECOFA_Officiel"). */
  source?: string | null;
}

/**
 * Fetches Revue de presse items, sorted by published_at DESC.
 *
 * Read-only — backed by `press_items` (RLS public read). The row count is
 * intentionally capped : the page lists at most 30 per page (with
 * pagination later if volume grows), the home preview shows 5.
 *
 * No realtime subscription : this list refreshes on full page load. That
 * matches the curation cadence (manual / weekly RSS batch) and avoids
 * subscription noise for a read-mostly view.
 */
export function usePressItems({
  limit = 30,
  category = null,
  windowDays = null,
  featuredOnly = false,
  source = null,
}: UsePressItemsOpts = {}) {
  const [items, setItems] = useState<DBPressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (supabase as any)
          .from("press_items")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(limit);
        if (category) q = q.eq("category", category);
        if (featuredOnly) q = q.eq("is_featured", true);
        if (source) q = q.eq("source_handle", source);
        if (windowDays && windowDays > 0) {
          const since = new Date();
          since.setDate(since.getDate() - windowDays);
          q = q.gte("published_at", since.toISOString());
        }
        const { data, error: err } = await q;
        if (err) throw err;
        if (!cancelled) setItems((data as DBPressItem[]) ?? []);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[usePressItems]", msg);
        setError(msg);
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit, category, windowDays, featuredOnly, source]);

  return { items, loading, error };
}
