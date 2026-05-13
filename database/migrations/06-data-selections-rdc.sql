-- =====================================================================
-- Léopards Radar — Migration data : sélections RDC depuis caps_rdc legacy
-- Migration : 06-data-selections-rdc.sql
-- Appliquée le 2026-05-14
--
-- 1 ligne A_OFFICIAL COD par joueur avec caps_rdc > 0.
-- Date placeholder 2024-01-15 — à enrichir manuellement par sélection.
-- Le compteur cumulé est mentionné dans `notes` pour traçabilité.
-- =====================================================================

BEGIN;

INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT
  id,
  'COD',
  'A_OFFICIAL',
  format('RDC senior (legacy counter caps_rdc=%s)', caps_rdc),
  FALSE,
  '2024-01-15'::date,
  format('[migration 2026-05-14] Imported from caps_rdc=%s legacy counter. Date placeholder.', caps_rdc)
FROM public.players
WHERE caps_rdc > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.selections
    WHERE player_id = public.players.id
      AND federation_code = 'COD'
      AND notes LIKE '[migration%'
  );

COMMIT;
