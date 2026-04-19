import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNewsletterCount() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc("get_newsletter_count");
        if (error) throw error;
        if (!cancelled) setCount(typeof data === "number" ? data : 0);
      } catch (e) {
        console.error("[useNewsletterCount]", e);
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { count, loading };
}
