-- ─────────────────────────────────────────────────────────────────────
-- Léopards Radar · 2026-07-08 · Branchement API-Football
-- DÉJÀ APPLIQUÉ en production via MCP le 2026-07-08 (migrations
-- add_match_scores_and_stage, matches_fixture_id_et_app_config).
-- Ce fichier documente l'état pour re-création éventuelle.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Colonnes résultat (le schéma live avait divergé de la migration d'avril)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS score_rdc integer,
  ADD COLUMN IF NOT EXISTS score_opponent integer,
  ADD COLUMN IF NOT EXISTS notes text;

-- 2. Clé d'upsert stable pour le sync API-Football
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS fixture_id bigint UNIQUE;

-- 3. Config privée : RLS activée SANS policy = service role uniquement.
--    Contient : apifootball_key (clé API-Football), matches_sync_token
--    (token exigé par l'edge function sync-matches-apifootball).
--    Les valeurs ne sont PAS dans ce fichier : les insérer à la main.
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 4. Cron quotidien (pg_cron + pg_net) : appelle l'edge function.
--    Le token est lu dynamiquement dans app_config, jamais en clair.
-- SELECT cron.schedule(
--   'sync-matches-apifootball',
--   '20 5 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://pvpshyoaregroihwglye.supabase.co/functions/v1/sync-matches-apifootball',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-sync-token', (SELECT value FROM public.app_config WHERE key = 'matches_sync_token')
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
