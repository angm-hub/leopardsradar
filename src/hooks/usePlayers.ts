import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer, DBCategory, DBPosition, DBTier } from "@/types/dbPlayer";

interface Filters {
  category?: DBCategory;
  categories?: DBCategory[];
  position?: DBPosition;
  tier?: DBTier;
  search?: string;
  limit?: number;
  orderBy?: { column: keyof DBPlayer; ascending?: boolean };
}

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

function normalize(row: Record<string, unknown>): DBPlayer {
  return {
    ...(row as unknown as DBPlayer),
    nationalities: normalizeJsonbArray(row.nationalities),
    other_nationalities: normalizeJsonbArray(row.other_nationalities),
  };
}

export function usePlayers(filters: Filters = {}) {
  const { category, categories, position, tier, search, limit, orderBy } = filters;
  const [players, setPlayers] = useState<DBPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // stabilize array deps
  const categoriesKey = useMemo(() => (categories ?? []).join(","), [categories]);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (supabase as any).from("players").select("*");

      if (category) query = query.eq("player_category", category);
      if (categoriesKey) query = query.in("player_category", categoriesKey.split(","));
      if (position) query = query.eq("position", position);
      if (tier) query = query.eq("tier", tier);
      if (search) query = query.ilike("name", `%${search}%`);
      if (orderBy)
        query = query.order(orderBy.column as string, {
          ascending: orderBy.ascending ?? false,
          nullsFirst: false,
        });
      if (limit) query = query.limit(limit);

      const { data, error: err } = await query;
      if (err) throw err;
      setPlayers(((data ?? []) as Record<string, unknown>[]).map(normalize));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      console.error("[usePlayers]", msg);
      setError(msg);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [category, categoriesKey, position, tier, search, limit, orderBy?.column, orderBy?.ascending]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, loading, error, refetch: fetchPlayers };
}
