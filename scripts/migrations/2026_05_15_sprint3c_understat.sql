-- ============================================================================
-- Sprint 3C du brief Léopards Radar v3 (2026-05-15) — Understat integration
--
-- Migration appliquée via Supabase MCP apply_migration
-- (name: sprint3c_01_players_understat_id).
--
-- Source alternative à FBRef pour les xG/xA. Couvre les 6 ligues européennes
-- top : EPL, La Liga, Bundesliga, Serie A, Ligue 1, RFPL (~3200 joueurs
-- scannés). Endpoint AJAX direct, pas de Cloudflare. ~80 Léopards trouvés.
--
-- Bénéfices vs FBRef :
--   - Pas de Cloudflare (requests JSON simple, ~10 sec total)
--   - xG/xA très fiables (même source que les shot maps Understat)
--
-- Limitations vs FBRef :
--   - Couvre seulement 6 ligues (pas Pro League / Eredivisie / Championship)
--   - Pas de stats défensives ni de pressing (uniquement offensif)
--
-- Cross-validation possible : pour les Léopards qui ont les 2 sources,
-- comparer xG/xA → écart > 20% → row dans data_conflicts (Sprint 6).
-- ============================================================================

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS understat_id TEXT;

CREATE INDEX IF NOT EXISTS idx_players_understat
  ON public.players(understat_id) WHERE understat_id IS NOT NULL;

COMMENT ON COLUMN public.players.understat_id IS
  'Identifiant Understat (numerique). Source : matching par nom contre les listings 6 ligues. Permet de fetch xG/xA fiables via /main/getPlayersStats/.';
