/**
 * usePlayerAttributes — Fetch + compute les 15 attributs /20 pour un joueur.
 *
 * 1. Fetche les rows player_stats_advanced du joueur (toutes compétitions)
 * 2. Fetche les rows de tous les joueurs du même poste (pour le percentile)
 * 3. Appelle computeAttributes() de la lib playerAttributes
 *
 * Le fetch des "all same position" est groupé par position pour éviter de
 * tirer 1000 rows inutiles. On ne prend que la dernière saison disponible
 * pour chaque joueur (saison la plus récente = 2025-2026 ou 2024-2025).
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DBPosition } from "@/types/dbPlayer";
import type { AttributeProfile, PlayerStatsRow } from "@/lib/playerAttributes";
import { computeAttributes, computeKeyInsights, computeTopStrengths } from "@/lib/playerAttributes";
import type { KeyInsight, TopStrength } from "@/lib/playerAttributes";

export interface UsePlayerAttributesResult {
  profile: AttributeProfile | null;
  insights: KeyInsight[];
  strengths: TopStrength[];
  rawStats: PlayerStatsRow[];
  loading: boolean;
  error: string | null;
}

export function usePlayerAttributes(
  playerId: number | undefined,
  position: DBPosition | null | undefined,
): UsePlayerAttributesResult {
  const [profile, setProfile] = useState<AttributeProfile | null>(null);
  const [insights, setInsights] = useState<KeyInsight[]>([]);
  const [strengths, setStrengths] = useState<TopStrength[]>([]);
  const [rawStats, setRawStats] = useState<PlayerStatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId || !position) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Stats du joueur (toutes compétitions — sans filtre saison pour
        //    max de données, le calcul agrège ensuite)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: playerData, error: playerErr } = await (supabase as any)
          .from("player_stats_advanced")
          .select("*")
          .eq("player_id", playerId)
          .order("season", { ascending: false });

        if (playerErr) throw playerErr;
        if (cancelled) return;

        const playerRows = (playerData as PlayerStatsRow[]) ?? [];

        // Garder seulement la dernière saison pour le calcul des attributs
        // (on expose toutes les rows en rawStats pour le tab Detailed Stats)
        const latestSeason = playerRows[0]?.season ?? null;
        const latestRows = latestSeason
          ? playerRows.filter((r) => r.season === latestSeason)
          : playerRows.slice(0, 1); // fallback si pas de saison

        setRawStats(playerRows);

        if (latestRows.length === 0) {
          setProfile(null);
          setInsights([]);
          setStrengths([]);
          setLoading(false);
          return;
        }

        // 2. Stats de TOUS les joueurs du même poste (pour le percentile)
        //    On join avec players pour filtrer sur la position.
        //    Si Supabase ne supporte pas le join filtré côté REST, on fetche
        //    tous les player_ids du même poste d'abord.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: positionPlayerIds, error: posErr } = await (supabase as any)
          .from("players")
          .select("id")
          .eq("position", position);

        if (posErr) throw posErr;
        if (cancelled) return;

        const ids: number[] = ((positionPlayerIds as { id: number }[]) ?? [])
          .map((p) => p.id)
          .filter((id) => id !== playerId); // exclure le joueur lui-même

        // Limiter à 200 joueurs pour éviter les requêtes trop lourdes
        const sampleIds = ids.slice(0, 200);

        let allPositionStats: PlayerStatsRow[] = [];
        if (sampleIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: posData, error: posStatsErr } = await (supabase as any)
            .from("player_stats_advanced")
            .select("*")
            .in("player_id", sampleIds)
            .eq("season", latestSeason ?? "2025-2026");

          if (posStatsErr) {
            // Non-bloquant : on calcule sans comparatives (percentile = 50 par défaut)
            console.warn("[usePlayerAttributes] position stats fetch failed:", posStatsErr);
          } else {
            allPositionStats = (posData as PlayerStatsRow[]) ?? [];
          }
        }

        if (cancelled) return;

        // 3. Calcul
        const computedProfile = computeAttributes(latestRows, allPositionStats, position);
        const computedInsights = computeKeyInsights(computedProfile);
        const computedStrengths = computeTopStrengths(computedProfile);

        setProfile(computedProfile);
        setInsights(computedInsights);
        setStrengths(computedStrengths);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[usePlayerAttributes]", msg);
        setError(msg);
        setProfile(null);
        setInsights([]);
        setStrengths([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playerId, position]);

  return { profile, insights, strengths, rawStats, loading, error };
}
