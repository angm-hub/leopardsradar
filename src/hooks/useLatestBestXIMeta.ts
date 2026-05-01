import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BestXIMeta {
  edition: number | null;
  publishedAt: string | null;
  formattedDate: string | null;
}

/**
 * Lightweight hook returning meta of the latest published Best XI.
 * Used for the freshness signal on the home hero.
 */
export function useLatestBestXIMeta() {
  const [meta, setMeta] = useState<BestXIMeta>({
    edition: null,
    publishedAt: null,
    formattedDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("best_xi")
          .select("title, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data || cancelled) return;

        // Extract edition number from title like "Édition #15 — ..."
        const match =
          typeof data.title === "string"
            ? data.title.match(/#(\d+)/)
            : null;
        const edition = match ? parseInt(match[1], 10) : null;

        let formatted: string | null = null;
        if (data.published_at) {
          try {
            const d = new Date(data.published_at);
            formatted = new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(d);
          } catch {
            formatted = null;
          }
        }

        setMeta({
          edition,
          publishedAt: data.published_at ?? null,
          formattedDate: formatted,
        });
      } catch (e) {
        console.error("[useLatestBestXIMeta]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...meta, loading };
}
