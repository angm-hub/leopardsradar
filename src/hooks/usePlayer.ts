import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer, DBNationalityBasis, DBSelection } from "@/types/dbPlayer";

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

export interface PlayerWithEligibility {
  player: DBPlayer;
  bases: DBNationalityBasis[];
  selections: DBSelection[];
}

export function usePlayer(slug: string | undefined) {
  const [player, setPlayer] = useState<DBPlayer | null>(null);
  const [bases, setBases] = useState<DBNationalityBasis[]>([]);
  const [selections, setSelections] = useState<DBSelection[]>([]);
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
        // 1. Fetch player
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
          setBases([]);
          setSelections([]);
          return;
        }
        const row = data as Record<string, unknown>;
        const playerData: DBPlayer = {
          ...(row as unknown as DBPlayer),
          nationalities: normalizeJsonbArray(row.nationalities),
          other_nationalities: normalizeJsonbArray(row.other_nationalities),
        };
        setPlayer(playerData);

        // 2. Fetch nationality_basis + selections in parallel
        const [basisRes, selectionsRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from("nationality_basis")
            .select("*")
            .eq("player_id", playerData.id)
            .order("confidence", { ascending: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from("selections")
            .select("*")
            .eq("player_id", playerData.id)
            .order("match_date", { ascending: false }),
        ]);

        if (cancelled) return;

        if (basisRes.error) {
          console.warn("[usePlayer] basis fetch failed:", basisRes.error);
        } else {
          setBases((basisRes.data as DBNationalityBasis[]) ?? []);
        }
        if (selectionsRes.error) {
          console.warn("[usePlayer] selections fetch failed:", selectionsRes.error);
        } else {
          setSelections((selectionsRes.data as DBSelection[]) ?? []);
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[usePlayer]", msg);
        setError(msg);
        setPlayer(null);
        setBases([]);
        setSelections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { player, bases, selections, loading, error };
}
