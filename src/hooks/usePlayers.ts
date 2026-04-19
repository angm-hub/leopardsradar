import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Player, PlayerCategory, PositionCode } from "@/types/player";
import { mapRowToPlayer, type PlayerRow } from "./mapPlayer";

interface Filters {
  category?: PlayerCategory;
  position?: PositionCode;
  league?: string;
  search?: string;
  limit?: number;
  orderBy?: { column: string; ascending?: boolean };
}

export function usePlayers(filters: Filters = {}) {
  const { category, position, league, search, limit, orderBy } = filters;
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (supabase as any)
        .from("players")
        .select("*, clubs(*)");

      if (category) query = query.eq("category", category);
      if (position) query = query.eq("position", position);
      if (league) query = query.eq("league", league);
      if (search) query = query.ilike("name", `%${search}%`);
      if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      if (limit) query = query.limit(limit);

      const { data, error: err } = await query;
      if (err) throw err;
      setPlayers(((data ?? []) as PlayerRow[]).map(mapRowToPlayer));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      console.error("[usePlayers]", msg);
      setError(msg);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [category, position, league, search, limit, orderBy?.column, orderBy?.ascending]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, loading, error, refetch: fetchPlayers };
}
