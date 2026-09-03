import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyPublicVisibilityFilter } from "@/lib/playerVisibility";
import type { DBPlayer, DBCategory, DBPosition, DBTier } from "@/types/dbPlayer";

interface Filters {
  category?: DBCategory;
  categories?: DBCategory[];
  position?: DBPosition;
  tier?: DBTier;
  search?: string;
  limit?: number;
  orderBy?: { column: keyof DBPlayer; ascending?: boolean };
  excludeEligibilityStatus?: string;
  /**
   * Si true (défaut), masque toute découverte automatique non validée
   * non encore vérifiés par Alexandre. Mettre à false dans les écrans admin
   * où on veut voir tous les candidats pour les valider.
   */
  publicVisibilityOnly?: boolean;
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
  const {
    category,
    categories,
    position,
    tier,
    search,
    limit,
    orderBy,
    excludeEligibilityStatus,
    publicVisibilityOnly = true,
  } = filters;
  const [players, setPlayers] = useState<DBPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // stabilize array deps
  const categoriesKey = useMemo(() => (categories ?? []).join(","), [categories]);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Colonnes réellement consommées par les vues liste (Radar, Roster,
      // Ma Liste, CommandPalette). Le select("*") historique embarquait
      // aussi les gros champs texte (editorial_note, sources u17/u20/u23,
      // ids externes) sur ~2 200 lignes : payload multiplié pour rien.
      // Si une vue liste a besoin d'un nouveau champ, l'ajouter ICI.
      const LIST_COLUMNS = [
        "id", "transfermarkt_id", "name", "slug",
        "image_url", "image_url_alt",
        "date_of_birth", "age", "place_of_birth", "country_of_birth",
        "height_cm", "position", "foot",
        "current_club", "current_club_id", "contract_expires",
        "on_loan_from", "agent",
        "is_binational", "nationalities", "other_nationalities",
        "player_category", "tier", "caps_rdc",
        "eligibility_status", "eligibility_note",
        // Champ canonique du moteur d'éligibilité (le manuel `eligibility_status`
        // reste lu pour rétro-compat, mais les gates croisent désormais le
        // computed pour éviter toute désync liste/fiche — clean 03/09/2026).
        "computed_eligibility_status",
        "market_value_eur",
        "season_games", "season_goals", "season_assists",
        "season_minutes", "season_rating",
        "verified", "level_score", "level_band",
        "score_leopards", "score_band", "score_pool", "league_tier",
        "created_at", "updated_at",
      ].join(",");
      // PostgREST plafonne CHAQUE réponse à ~1000 lignes (db-max-rows) et
      // `.limit(5000)` est IGNORÉ côté serveur (leçon du moteur de stats, 26/07).
      // Le Radar perdait donc ~245 joueurs visibles au-delà de la 1000e ligne.
      // Fix : pagination par pages de 1000 via .range(), avec un tri stable
      // garanti par un tiebreak sur `id` (sinon les nombreux nulls du tri
      // principal ont un ordre indéfini entre pages → doublons/trous).
      const PAGE = 1000;
      const hardLimit = limit ?? Number.POSITIVE_INFINITY;
      const buildQuery = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (supabase as any).from("players").select(LIST_COLUMNS);
        if (category) q = q.eq("player_category", category);
        if (categoriesKey) q = q.in("player_category", categoriesKey.split(","));
        if (position) q = q.eq("position", position);
        if (tier) q = q.eq("tier", tier);
        if (search) q = q.ilike("name", `%${search}%`);
        if (excludeEligibilityStatus) q = q.neq("eligibility_status", excludeEligibilityStatus);
        if (publicVisibilityOnly) q = applyPublicVisibilityFilter(q);
        if (orderBy)
          q = q.order(orderBy.column as string, {
            ascending: orderBy.ascending ?? false,
            nullsFirst: false,
          });
        q = q.order("id", { ascending: true });
        return q;
      };

      const rows: Record<string, unknown>[] = [];
      for (let offset = 0; rows.length < hardLimit; offset += PAGE) {
        const { data, error: err } = await buildQuery().range(offset, offset + PAGE - 1);
        if (err) throw err;
        const batch = (data ?? []) as Record<string, unknown>[];
        rows.push(...batch);
        if (batch.length < PAGE) break;
      }
      const capped = Number.isFinite(hardLimit) ? rows.slice(0, hardLimit) : rows;
      setPlayers(capped.map(normalize));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      console.error("[usePlayers]", msg);
      setError(msg);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [category, categoriesKey, position, tier, search, limit, orderBy?.column, orderBy?.ascending, excludeEligibilityStatus, publicVisibilityOnly]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, loading, error, refetch: fetchPlayers };
}
