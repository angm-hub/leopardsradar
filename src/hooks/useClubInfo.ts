/**
 * useClubInfo — Récupère les informations d'un club depuis Supabase
 * en joignant clubs → leagues.
 *
 * Conçu pour être consommé par PlayerCard, RosterPlayer et RadarCanvas
 * après que sync_clubs.py a renseigné players.current_club_fk.
 *
 * Cache : React Query (staleTime 10 min) — les données club sont stables
 * entre deux runs de sync (hebdo). Pas besoin de refetch fréquent.
 *
 * Usage :
 *   const { clubInfo, loading, error } = useClubInfo(player.current_club_fk);
 *   // clubInfo?.name, clubInfo?.logo_url, clubInfo?.league_name, ...
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ClubInfo {
  /** ID Supabase du club (clubs.id) */
  id: number;
  /** Nom officiel du club (Transfermarkt) */
  name: string;
  /** Version normalisée du nom (lowercase, sans accents) */
  name_normalized: string;
  /** Code court de 2-3 lettres (ex: "PSG", "MCI") */
  short_code: string | null;
  /** Code pays ISO2 (ex: "FR", "GB") */
  country_code: string | null;
  /** URL du logo club (Transfermarkt CDN) */
  logo_url: string | null;
  /** Équipe réserve / U23 / U21 ? */
  is_reserve: boolean;
  /** Nom de la ligue du club (depuis leagues.name) */
  league_name: string | null;
  /** Niveau UEFA de la ligue (100 = Top 5 EU, 70 = sous-élite, etc.) */
  tier_uefa: number | null;
  /** Code pays de la ligue (depuis leagues.country_code) */
  league_country_code: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetcher
// ─────────────────────────────────────────────────────────────────────────────

async function fetchClubInfo(clubFk: number): Promise<ClubInfo | null> {
  // Join clubs → leagues via league_id pour récupérer les méta-ligue
  // en une seule requête Supabase (embedded select).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("clubs")
    .select(`
      id,
      name,
      name_normalized,
      short_code,
      country_code,
      logo_url,
      is_reserve,
      leagues (
        name,
        tier_uefa,
        country_code
      )
    `)
    .eq("id", clubFk)
    .maybeSingle();

  if (error) {
    throw new Error(`useClubInfo: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  // leagues peut être null si league_id IS NULL (club hors référentiel leagues)
  const league = data.leagues as {
    name: string;
    tier_uefa: number | null;
    country_code: string;
  } | null;

  return {
    id: data.id,
    name: data.name,
    name_normalized: data.name_normalized,
    short_code: data.short_code ?? null,
    country_code: data.country_code ?? null,
    logo_url: data.logo_url ?? null,
    is_reserve: data.is_reserve ?? false,
    league_name: league?.name ?? null,
    tier_uefa: league?.tier_uefa ?? null,
    league_country_code: league?.country_code ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

interface UseClubInfoResult {
  clubInfo: ClubInfo | null;
  loading: boolean;
  error: string | null;
}

/**
 * Retourne les informations enrichies d'un club à partir de sa FK numérique.
 *
 * @param currentClubFk - La valeur de players.current_club_fk (INT | null).
 *                        Si null, le hook retourne { clubInfo: null, loading: false, error: null }
 *                        immédiatement sans requête réseau.
 */
export function useClubInfo(currentClubFk: number | null | undefined): UseClubInfoResult {
  const { data, isLoading, error } = useQuery({
    // La clé inclut le clubFk pour que React Query cache par club
    queryKey: ["clubInfo", currentClubFk],
    queryFn: () => fetchClubInfo(currentClubFk as number),
    // Désactivé si pas de FK — évite une requête inutile / erreur SQL
    enabled: currentClubFk != null && currentClubFk > 0,
    // Les données club sont stables entre deux syncs hebdo
    staleTime: 10 * 60 * 1000,   // 10 minutes
    // Garder en cache 30 min après que le composant soit démonté
    gcTime: 30 * 60 * 1000,
    // Pas de retry sur 404 / no data — on affiche directement null
    retry: (failureCount, err) => {
      // On ne retente que les erreurs réseau, pas les erreurs applicatives
      if (err instanceof Error && err.message.includes("useClubInfo:")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    clubInfo: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
