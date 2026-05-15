-- ============================================================================
-- Sprint 5 du brief Léopards Radar v3 (2026-05-15) — vues matérialisées
-- pour la page /insights (analyses auto-générées).
--
-- Migration appliquée le 15 mai 2026 via Supabase MCP apply_migration
-- (name: sprint5_insights_materialized_views + sprint5_harden_refresh_function).
-- Ce fichier est la copie de référence dans le repo pour traçabilité.
--
-- 3 vues sur 4 du brief sont créées (la 4ème — generation_overview —
-- nécessite les colonnes u17_caps / u20_caps / u23_caps du Sprint 2).
--
-- Toutes les vues sont READ-ONLY et accessibles en lecture publique
-- (anon GRANT SELECT). La fonction de refresh est verrouillée pour anon —
-- seul le SERVICE_ROLE_KEY peut l'invoquer (cron GH Actions
-- refresh-insights.yml dimanche 14h UTC).
-- ============================================================================

-- ── 1. mv_eligibility_pipeline ──────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS public.mv_eligibility_pipeline CASCADE;
CREATE MATERIALIZED VIEW public.mv_eligibility_pipeline AS
SELECT
  COALESCE(computed_eligibility_status, 'UNKNOWN') AS status,
  COUNT(*)::int AS player_count,
  ROUND(AVG(market_value_eur))::int AS avg_market_value_eur,
  SUM(market_value_eur)::bigint AS total_market_value_eur,
  STRING_AGG(name, ' · ' ORDER BY market_value_eur DESC NULLS LAST)
    FILTER (WHERE market_value_eur IS NOT NULL) AS top_players_by_value
FROM public.players
WHERE name IS NOT NULL
GROUP BY COALESCE(computed_eligibility_status, 'UNKNOWN');

CREATE UNIQUE INDEX idx_mv_eligibility_status ON public.mv_eligibility_pipeline(status);

COMMENT ON MATERIALIZED VIEW public.mv_eligibility_pipeline IS
  'Sprint 5 brief v3 : répartition vivier par statut éligibilité FIFA. Refresh hebdo.';

-- ── 2. mv_club_concentration ────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS public.mv_club_concentration CASCADE;
CREATE MATERIALIZED VIEW public.mv_club_concentration AS
SELECT
  current_club AS club_name,
  COUNT(*)::int AS leopards_count,
  ROUND(AVG(market_value_eur))::bigint AS avg_value_eur,
  STRING_AGG(name, ' · ' ORDER BY market_value_eur DESC NULLS LAST) AS players,
  MIN(
    CASE level_band
      WHEN 'elite' THEN 1
      WHEN 'high' THEN 2
      WHEN 'mid' THEN 3
      WHEN 'developing' THEN 4
      WHEN 'watch' THEN 5
      ELSE 9
    END
  ) AS top_band_rank
FROM public.players
WHERE current_club IS NOT NULL
  AND COALESCE(computed_eligibility_status, '') IN ('SELECTED', 'ELIGIBLE', 'POTENTIALLY_ELIGIBLE')
GROUP BY current_club
HAVING COUNT(*) >= 2;

CREATE INDEX idx_mv_club_concentration_count ON public.mv_club_concentration(leopards_count DESC);
CREATE UNIQUE INDEX idx_mv_club_concentration_name ON public.mv_club_concentration(club_name);

COMMENT ON MATERIALIZED VIEW public.mv_club_concentration IS
  'Sprint 5 brief v3 : clubs hébergeant >=2 Léopards éligibles. Refresh hebdo.';

-- ── 3. mv_profile_insights ──────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS public.mv_profile_insights CASCADE;
CREATE MATERIALIZED VIEW public.mv_profile_insights AS
SELECT
  CASE
    WHEN country_of_birth IS NULL THEN 'unknown'
    WHEN country_of_birth ILIKE '%congo%' OR country_of_birth ILIKE '%RDC%' THEN 'local'
    ELSE 'diaspora'
  END AS player_origin,
  COUNT(*)::int AS total_players,
  ROUND(AVG(age), 1) AS avg_age,
  ROUND(AVG(market_value_eur))::bigint AS avg_market_value_eur,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY market_value_eur) AS median_market_value_eur,
  ROUND(AVG(CASE WHEN COALESCE(caps_rdc, 0) > 0 THEN 100.0 ELSE 0.0 END), 1) AS pct_with_caps_rdc,
  MODE() WITHIN GROUP (ORDER BY position) AS most_common_position,
  MODE() WITHIN GROUP (ORDER BY level_band) AS dominant_band,
  ROUND(AVG(season_minutes), 0)::int AS avg_season_minutes
FROM public.players
WHERE name IS NOT NULL
GROUP BY 1;

CREATE UNIQUE INDEX idx_mv_profile_origin ON public.mv_profile_insights(player_origin);

COMMENT ON MATERIALIZED VIEW public.mv_profile_insights IS
  'Sprint 5 brief v3 : profil type local (né en RDC) vs diaspora vs unknown. Proxy via country_of_birth en attendant formation_country (Sprint 2). Refresh hebdo.';

-- ── RLS lecture publique ────────────────────────────────────────────────────
GRANT SELECT ON public.mv_eligibility_pipeline TO anon, authenticated;
GRANT SELECT ON public.mv_club_concentration TO anon, authenticated;
GRANT SELECT ON public.mv_profile_insights TO anon, authenticated;

-- ── Fonction de refresh (hardened) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_sprint5_insights()
RETURNS TABLE(view_name text, status text, refreshed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_eligibility_pipeline;
  RETURN QUERY SELECT 'mv_eligibility_pipeline'::text, 'ok'::text, now();

  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_club_concentration;
  RETURN QUERY SELECT 'mv_club_concentration'::text, 'ok'::text, now();

  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_profile_insights;
  RETURN QUERY SELECT 'mv_profile_insights'::text, 'ok'::text, now();
END $$;

COMMENT ON FUNCTION public.refresh_sprint5_insights IS
  'Sprint 5 brief v3 : refresh des 3 vues matérialisées /insights. Cron dimanche 14h UTC via refresh-insights.yml.';

-- Lock down : seul service_role peut invoquer (cron GH Actions)
REVOKE EXECUTE ON FUNCTION public.refresh_sprint5_insights() FROM anon, authenticated, public;
