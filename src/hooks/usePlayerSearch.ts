import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyPublicVisibilityFilter } from "@/lib/playerVisibility";
import type { DBPlayer } from "@/types/dbPlayer";

interface UsePlayerSearchOptions {
  query: string;
  /** longueur minimale avant de déclencher une recherche server-side */
  minLength?: number;
  /** debounce en ms */
  debounceMs?: number;
  /** nombre max de résultats */
  limit?: number;
}

/**
 * usePlayerSearch — recherche live de joueurs côté Supabase.
 *
 * Débloque la palette Cmd+K : sans ça, on cherche dans les 15 joueurs
 * pré-chargés, ce qui est inutilisable sur un dataset de 471 profils.
 *
 * - debounced (200ms par défaut) pour ne pas spammer le serveur
 * - ilike sur le name (insensible à la casse)
 * - retourne aussi `current_club` et `position` pour le rendu de la palette
 * - exclut les profils ineligible
 */
export function usePlayerSearch({
  query,
  minLength = 2,
  debounceMs = 200,
  limit = 8,
}: UsePlayerSearchOptions) {
  const [results, setResults] = useState<DBPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < minLength) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        // ilike sur name pour matcher "wis" → "Yoane Wissa"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baseQuery = (supabase as any)
          .from("players")
          .select("*")
          .ilike("name", `%${trimmed}%`)
          .neq("eligibility_status", "ineligible");
        const { data, error } = await applyPublicVisibilityFilter(baseQuery)
          .order("market_value_eur", { ascending: false, nullsFirst: false })
          .limit(limit);
        if (error) throw error;
        if (!cancelled) setResults((data ?? []) as DBPlayer[]);
      } catch (e) {
        console.error("[usePlayerSearch]", e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, minLength, debounceMs, limit]);

  return { results, loading };
}
