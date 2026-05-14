-- =====================================================================
-- Léopards Radar — Sprint 2 : Contrainte unique player_clubs + index
-- Migration : 2026_05_15_player_clubs_unique.sql
-- Date      : 2026-05-15
--
-- Objectif :
--   Ajouter un index nommé sur la contrainte UNIQUE (player_id, club_id,
--   date_from) déjà définie dans le schéma initial (01-eligibility-schema.sql)
--   pour pouvoir nommer explicitement la contrainte dans les ON CONFLICT
--   des UPSERTs Python, et ajouter des index de support pour les requêtes
--   front (JOIN player_clubs → clubs → leagues).
--
-- Pourquoi un DO block ?
--   CREATE UNIQUE INDEX n'a pas de "IF NOT EXISTS" sur toutes les versions
--   Postgres. On encapsule pour garantir l'idempotence totale — la migration
--   peut être rejouée sans erreur même si la contrainte existe déjà.
--
-- IDEMPOTENT : peut être rejoué sans casser l'existant.
-- =====================================================================

-- Contrainte unique nommée sur le triplet (player_id, club_id, date_from).
-- Permet les UPSERTs idempotents lors des re-runs de backfill_player_clubs.py.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'player_clubs'
      AND indexname  = 'player_clubs_unique_passage'
  ) THEN
    -- Note : la contrainte UNIQUE dans le CREATE TABLE a déjà créé un index
    -- implicite. On crée ici un alias nommé uniquement si l'index nommé n'existe
    -- pas encore. Si la table est récente et n'a pas l'index implicite non plus,
    -- ce bloc le crée directement.
    CREATE UNIQUE INDEX player_clubs_unique_passage
      ON public.player_clubs (player_id, club_id, date_from);
  END IF;
END $$;

COMMENT ON INDEX player_clubs_unique_passage IS
  'Garantit qu''un même passage joueur+club+date_from n''est pas dupliqué lors des re-syncs Transfermarkt. Référencé dans les ON CONFLICT du script backfill_player_clubs.py.';

-- Index sur player_id pour les lookups fiche joueur (JOIN rapide)
CREATE INDEX IF NOT EXISTS idx_player_clubs_player_id
  ON public.player_clubs (player_id);

-- Index combiné pour les requêtes front (tri par date descendant sur un joueur)
CREATE INDEX IF NOT EXISTS idx_player_clubs_player_date
  ON public.player_clubs (player_id, date_from DESC);

COMMENT ON TABLE public.player_clubs IS
  'Historique de carrière joueur → club avec dates, type de transfert, fee. Alimenté par backfill_player_clubs.py (Sprint 2) depuis Transfermarkt career history.';
