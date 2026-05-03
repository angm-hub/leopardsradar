import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BestXISlot {
  position: string;
  player_id: number;
  label: string;
}

export interface BestXIPlayer {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  image_url_alt: string | null;
  current_club: string | null;
  position: string | null;
  age: number | null;
  market_value_eur: number | null;
  nationalities: string[];
  other_nationalities: string[];
  caps_rdc: number | null;
}

export interface BestXIComposition {
  id: string;
  title: string;
  formation: "4-3-3" | "4-2-3-1" | "3-5-2";
  editorial_note: string | null;
  published_at: string | null;
  slots: BestXISlot[];
  playersById: Record<number, BestXIPlayer>;
}

export function useBestXI() {
  const [data, setData] = useState<BestXIComposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. Latest published Best XI
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: comp, error: compErr } = await (supabase as any)
          .from("best_xi")
          .select("id, title, formation, players, editorial_note, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (compErr) throw compErr;
        if (!comp) {
          if (!cancelled) setData(null);
          return;
        }

        const slots: BestXISlot[] = Array.isArray(comp.players)
          ? (comp.players as BestXISlot[])
          : [];
        const playerIds = slots.map((s) => s.player_id).filter((n) => Number.isFinite(n));

        // 2. Fetch player details
        const { data: players, error: playersErr } = await supabase
          .from("players")
          .select(
            "id, name, slug, image_url, image_url_alt, current_club, position, age, market_value_eur, nationalities, other_nationalities, caps_rdc",
          )
          .in("id", playerIds)
          .neq("eligibility_status", "ineligible");

        if (playersErr) throw playersErr;

        const playersById: Record<number, BestXIPlayer> = {};
        (players ?? []).forEach((p) => {
          playersById[p.id] = p as BestXIPlayer;
        });

        if (!cancelled) {
          setData({
            id: comp.id,
            title: comp.title,
            formation: comp.formation,
            editorial_note: comp.editorial_note,
            published_at: comp.published_at,
            slots,
            playersById,
          });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[useBestXI]", msg);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
