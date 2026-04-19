import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer } from "@/types/dbPlayer";

function normalizeJsonbArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function usePlayer(slug: string | undefined) {
  const [player, setPlayer] = useState<DBPlayer | null>(null);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: err } = await (supabase as any)
          .from("players")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (err) throw err;
        if (cancelled) return;
        if (!data) {
          setPlayer(null);
        } else {
          const row = data as Record<string, unknown>;
          setPlayer({
            ...(row as unknown as DBPlayer),
            nationalities: normalizeJsonbArray(row.nationalities),
            other_nationalities: normalizeJsonbArray(row.other_nationalities),
          });
        }
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
