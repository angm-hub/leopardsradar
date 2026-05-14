-- =====================================================================
-- Léopards Radar — Migration : ajout FK clubs sur players
-- Fichier  : 2026_05_15_players_current_club_fk.sql
-- Date     : 2026-05-15
-- Auteur   : Alexandre Ngomo (kAIra)
--
-- Contexte :
--   players.current_club_id est actuellement du TEXT qui stocke l'ID
--   Transfermarkt (ex: "27259"). On introduit current_club_fk (INT FK)
--   pour pointer vers clubs.id, sans toucher à l'existant pendant la
--   période de transition.
--
--   La migration est NON-DESTRUCTIVE : les deux colonnes coexistent
--   jusqu'à ce que le backfill complet soit validé par Alexandre.
--   Le renommage final (drop TEXT + rename INT→current_club_id) est
--   commenté ici et à exécuter manuellement après validation.
--
-- À appliquer via Supabase MCP apply_migration avant de lancer sync_clubs.py
-- IDEMPOTENT : peut être rejoué sans casser l'existant.
-- =====================================================================

-- Ajoute la vraie FK numérique vers clubs.id
-- IF NOT EXISTS protège contre un double-run
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS current_club_fk INTEGER REFERENCES public.clubs(id) ON DELETE SET NULL;

-- Index dédié pour les jointures players → clubs via la FK
CREATE INDEX IF NOT EXISTS idx_players_current_club_fk
  ON public.players(current_club_fk);

-- Documentation inline : le commentaire sera visible dans Supabase Studio
-- et dans tout outil qui lit pg_description
COMMENT ON COLUMN public.players.current_club_fk IS
  'FK INT vers clubs.id. Posée par sync_clubs.py lors du backfill Sprint 1. '
  'Remplacera players.current_club_id (TEXT Transfermarkt) après validation complète. '
  'Transition en 2 temps pour éviter de casser le frontend pendant le backfill.';

-- ─────────────────────────────────────────────────────────────────────
-- RENOMMAGE FINAL — À exécuter APRÈS que le backfill soit validé à 100%
-- (ne pas décommenter avant confirmation d'Alexandre)
--
-- Séquence :
--   1. Vérifier que tous les joueurs ont current_club_fk renseigné :
--        SELECT COUNT(*) FROM players WHERE current_club_fk IS NULL AND current_club IS NOT NULL;
--        → doit retourner 0 (ou un nombre acceptable de clubs non matchés)
--
--   2. Exécuter le renommage :
--        ALTER TABLE public.players DROP COLUMN current_club_id;
--        ALTER TABLE public.players RENAME COLUMN current_club_fk TO current_club_id;
--        ALTER INDEX idx_players_current_club_fk RENAME TO idx_players_current_club_id;
--
--   3. Mettre à jour les types TypeScript côté frontend :
--        src/types/dbPlayer.ts → current_club_id: number | null
--        src/integrations/supabase/types.ts → current_club_id: number | null
-- ─────────────────────────────────────────────────────────────────────
