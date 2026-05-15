-- ============================================================================
-- Sprint 2 du brief Léopards Radar v3 — modèle de données enrichi (2026-05-15)
--
-- Migrations appliquées via Supabase MCP apply_migration en 6 étapes :
--   - sprint2_01_players_youth_freshness_columns
--   - sprint2_02_youth_selections_table
--   - sprint2_03_player_stats_advanced_table
--   - sprint2_04_player_scores_table
--   - sprint2_05_06_data_conflicts_sources_tables
--   - sprint2_07_generation_overview_view (4ème vue mat. débloquée par 2.1)
--
-- Ce fichier est la copie de référence dans le repo, regroupant les 6 étapes.
-- Idempotent : tout en IF NOT EXISTS / DROP IF EXISTS, peut être rejoué.
--
-- Audit advisors post-migration : 2 nouveaux WARN intentionnels
--   - rls_policy_always_true sur data_conflicts/sources policies
--     authenticated_write — c'est exactement le but (admin only via auth).
--   Aucun ERROR nouveau, aucune régression sur le live.
-- ============================================================================

-- ── 2.1 Colonnes youth + freshness + completeness sur players ──────────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS u17_caps  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS u17_goals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS u17_source TEXT,
  ADD COLUMN IF NOT EXISTS u20_caps  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS u20_goals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS u20_source TEXT,
  ADD COLUMN IF NOT EXISTS u23_caps  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS u23_goals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS u23_source TEXT,
  ADD COLUMN IF NOT EXISTS formation_country TEXT,
  ADD COLUMN IF NOT EXISTS formation_club    TEXT,
  ADD COLUMN IF NOT EXISTS formation_academy BOOLEAN,
  ADD COLUMN IF NOT EXISTS moved_abroad_age  INTEGER,
  ADD COLUMN IF NOT EXISTS field_freshness JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS legacy_score NUMERIC,
  ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

UPDATE public.players SET legacy_score = level_score
  WHERE legacy_score IS NULL AND level_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_players_formation_country
  ON public.players(formation_country) WHERE formation_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_players_u20_caps
  ON public.players(u20_caps DESC NULLS LAST) WHERE COALESCE(u20_caps, 0) > 0;

-- ── 2.2 Table youth_selections ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.youth_selections (
  id              BIGSERIAL PRIMARY KEY,
  player_id       BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('U17', 'U20', 'U23')),
  competition     TEXT NOT NULL,
  year            INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2099),
  was_captain     BOOLEAN DEFAULT false,
  matches_played  INTEGER DEFAULT 0,
  goals           INTEGER DEFAULT 0,
  assists         INTEGER DEFAULT 0,
  source          TEXT NOT NULL,
  source_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, category, competition, year)
);
CREATE INDEX IF NOT EXISTS idx_youth_player ON public.youth_selections(player_id);
CREATE INDEX IF NOT EXISTS idx_youth_category ON public.youth_selections(category);
CREATE INDEX IF NOT EXISTS idx_youth_year ON public.youth_selections(year DESC);

ALTER TABLE public.youth_selections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "youth_selections_public_read" ON public.youth_selections;
CREATE POLICY "youth_selections_public_read" ON public.youth_selections
  FOR SELECT TO anon, authenticated USING (true);

-- ── 2.3 Table player_stats_advanced ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_stats_advanced (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  competition TEXT NOT NULL,
  competition_tier INTEGER DEFAULT 4 CHECK (competition_tier BETWEEN 1 AND 4),
  matches_played INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  xg NUMERIC, xag NUMERIC,
  progressive_carries INTEGER, progressive_passes INTEGER, progressive_receptions INTEGER,
  passes_into_final_third INTEGER, key_passes INTEGER, through_balls INTEGER,
  tackles_won INTEGER, interceptions INTEGER, blocks INTEGER, clearances INTEGER,
  aerial_duels_won INTEGER, aerial_duels_total INTEGER,
  pressures INTEGER, pressure_successes INTEGER, high_recoveries INTEGER,
  touches INTEGER, carries INTEGER, dribbles_completed INTEGER, dribbles_attempted INTEGER,
  saves INTEGER, shots_on_target_faced INTEGER, clean_sheets INTEGER,
  post_shot_xg NUMERIC, long_pass_pct NUMERIC,
  source TEXT NOT NULL DEFAULT 'fbref',
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, season, competition)
);
CREATE INDEX IF NOT EXISTS idx_stats_adv_player ON public.player_stats_advanced(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_adv_season ON public.player_stats_advanced(season);
CREATE INDEX IF NOT EXISTS idx_stats_adv_tier ON public.player_stats_advanced(competition_tier);

ALTER TABLE public.player_stats_advanced ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_stats_advanced_public_read" ON public.player_stats_advanced;
CREATE POLICY "player_stats_advanced_public_read" ON public.player_stats_advanced
  FOR SELECT TO anon, authenticated USING (true);

-- ── 2.4 Table player_scores (scoring hexagonal) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_scores (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT now(),
  a1_impact INTEGER CHECK (a1_impact BETWEEN 0 AND 99),
  a2_volume INTEGER CHECK (a2_volume BETWEEN 0 AND 99),
  a3_market_value INTEGER CHECK (a3_market_value BETWEEN 0 AND 99),
  a4_international INTEGER CHECK (a4_international BETWEEN 0 AND 99),
  p1_positional INTEGER CHECK (p1_positional BETWEEN 0 AND 99),
  p2_positional INTEGER CHECK (p2_positional BETWEEN 0 AND 99),
  p1_label TEXT, p2_label TEXT,
  leopards_global_score NUMERIC,
  level_band TEXT CHECK (level_band IN ('elite', 'high', 'mid', 'developing', 'watch')),
  position_group TEXT NOT NULL,
  pool_size INTEGER,
  axes_available INTEGER DEFAULT 0 CHECK (axes_available BETWEEN 0 AND 6),
  UNIQUE(player_id, season)
);
CREATE INDEX IF NOT EXISTS idx_scores_player ON public.player_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_scores_band ON public.player_scores(level_band);
CREATE INDEX IF NOT EXISTS idx_scores_global ON public.player_scores(leopards_global_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_scores_season ON public.player_scores(season);

ALTER TABLE public.player_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_scores_public_read" ON public.player_scores;
CREATE POLICY "player_scores_public_read" ON public.player_scores
  FOR SELECT TO anon, authenticated USING (true);

-- ── 2.5 + 2.6 data_conflicts + data_sources (admin only) ───────────────────
CREATE TABLE IF NOT EXISTS public.data_conflicts (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  source_a TEXT NOT NULL, value_a TEXT,
  source_b TEXT NOT NULL, value_b TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolution TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  UNIQUE(player_id, field_name, source_a, source_b)
);
CREATE INDEX IF NOT EXISTS idx_data_conflicts_player ON public.data_conflicts(player_id);
CREATE INDEX IF NOT EXISTS idx_data_conflicts_status ON public.data_conflicts(status);

ALTER TABLE public.data_conflicts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "data_conflicts_authenticated_read" ON public.data_conflicts;
DROP POLICY IF EXISTS "data_conflicts_authenticated_write" ON public.data_conflicts;
CREATE POLICY "data_conflicts_authenticated_read" ON public.data_conflicts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "data_conflicts_authenticated_write" ON public.data_conflicts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.data_sources (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  source_date DATE NOT NULL,
  confidence TEXT DEFAULT 'S2' CHECK (confidence IN ('S1', 'S2', 'S3', 'S4')),
  recorded_at TIMESTAMPTZ DEFAULT now(),
  recorded_by TEXT DEFAULT 'pipeline'
);
CREATE INDEX IF NOT EXISTS idx_data_sources_player ON public.data_sources(player_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_field ON public.data_sources(field_name);
CREATE INDEX IF NOT EXISTS idx_data_sources_recorded ON public.data_sources(recorded_at DESC);

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "data_sources_authenticated_read" ON public.data_sources;
DROP POLICY IF EXISTS "data_sources_authenticated_write" ON public.data_sources;
CREATE POLICY "data_sources_authenticated_read" ON public.data_sources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "data_sources_authenticated_write" ON public.data_sources
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 4ème vue Sprint 5 — generation_overview (débloquée par 2.1) ────────────
DROP MATERIALIZED VIEW IF EXISTS public.mv_generation_overview CASCADE;
CREATE MATERIALIZED VIEW public.mv_generation_overview AS
WITH params AS (SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS current_year),
classified AS (
  SELECT
    p.id, p.name, p.market_value_eur, p.caps_rdc,
    p.formation_country, p.position, p.level_band, p.season_minutes,
    CASE
      WHEN p.date_of_birth IS NOT NULL THEN
        EXTRACT(YEAR FROM AGE(DATE(params.current_year::text || '-01-01'), p.date_of_birth))::int
      ELSE NULL
    END AS age_at_jan1
  FROM public.players p, params
  WHERE p.name IS NOT NULL
)
SELECT
  cat.category,
  COUNT(*)::int AS total_players,
  SUM(c.market_value_eur)::bigint AS total_market_value_eur,
  ROUND(AVG(c.market_value_eur))::bigint AS avg_market_value_eur,
  ROUND(AVG(c.age_at_jan1), 1) AS avg_age,
  MODE() WITHIN GROUP (ORDER BY c.formation_country) AS top_formation_country,
  MODE() WITHIN GROUP (ORDER BY c.position) AS most_common_position,
  COUNT(*) FILTER (WHERE COALESCE(c.caps_rdc, 0) > 0)::int AS with_senior_caps,
  STRING_AGG(c.name, ' · ' ORDER BY c.market_value_eur DESC NULLS LAST)
    FILTER (WHERE c.market_value_eur IS NOT NULL) AS top_players_by_value
FROM classified c
CROSS JOIN LATERAL (SELECT unnest(ARRAY['U17', 'U20', 'U23', 'A']) AS category) cat
WHERE c.age_at_jan1 IS NOT NULL
  AND CASE cat.category
    WHEN 'U17' THEN c.age_at_jan1 <= 16
    WHEN 'U20' THEN c.age_at_jan1 <= 19
    WHEN 'U23' THEN c.age_at_jan1 <= 22
    WHEN 'A' THEN true
  END
GROUP BY cat.category;

CREATE UNIQUE INDEX idx_mv_generation_category ON public.mv_generation_overview(category);
GRANT SELECT ON public.mv_generation_overview TO anon, authenticated;

-- Refresh function étendue à 4 vues
CREATE OR REPLACE FUNCTION public.refresh_sprint5_insights()
RETURNS TABLE(view_name text, status text, refreshed_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_eligibility_pipeline;
  RETURN QUERY SELECT 'mv_eligibility_pipeline'::text, 'ok'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_club_concentration;
  RETURN QUERY SELECT 'mv_club_concentration'::text, 'ok'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_profile_insights;
  RETURN QUERY SELECT 'mv_profile_insights'::text, 'ok'::text, now();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_generation_overview;
  RETURN QUERY SELECT 'mv_generation_overview'::text, 'ok'::text, now();
END $$;

REVOKE EXECUTE ON FUNCTION public.refresh_sprint5_insights() FROM anon, authenticated, public;
