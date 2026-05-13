-- =====================================================================
-- Léopards Radar — Migration data : nationality_basis pour 477 joueurs
-- Migration : 05-data-nationality-basis.sql
-- Appliquée le 2026-05-14 sur projet pvpshyoaregroihwglye
--
-- Règles :
--   1. Nés en RDC → BIRTH HIGH (verified_by = 'migration_2026_05_14')
--   2. Tous les autres avec 'DR Congo' dans nationalities → UNKNOWN LOW
--      (la base existe mais n'est pas encore documentée → POTENTIALLY)
--
-- Le pacte éditorial est respecté : on ne ment pas avec une fausse base
-- HIGH/MEDIUM. Les profils non instruits restent POTENTIALLY tant que
-- l'enrichissement (Transfermarkt + manuel) n'a pas confirmé père/mère/
-- grand-parent.
-- =====================================================================

BEGIN;

-- 1. BIRTH pour les nés en RDC (~112 joueurs)
INSERT INTO public.nationality_basis (player_id, nationality_code, basis, evidence_quote, confidence, verified_by, verified_at)
SELECT
  id, 'COD', 'BIRTH',
  format('country_of_birth = %L (legacy data)', country_of_birth),
  'HIGH', 'migration_2026_05_14', NOW()
FROM public.players
WHERE country_of_birth ILIKE '%congo%' OR country_of_birth ILIKE '%zaire%'
ON CONFLICT (player_id, nationality_code, basis) DO NOTHING;

-- 2. UNKNOWN pour tous les autres avec DR Congo dans nationalities
--    Utilise NOT EXISTS plutôt que NOT IN avec NULL-safe pattern
INSERT INTO public.nationality_basis (player_id, nationality_code, basis, evidence_quote, confidence, verified_by, verified_at)
SELECT
  id, 'COD', 'UNKNOWN',
  'DR Congo listed in nationalities (legacy data, basis not yet investigated)',
  'LOW', 'migration_2026_05_14', NOW()
FROM public.players p
WHERE (nationalities ? 'DR Congo' OR nationalities ? 'Congo')
  AND NOT EXISTS (
    SELECT 1 FROM public.nationality_basis nb
    WHERE nb.player_id = p.id AND nb.nationality_code = 'COD'
  )
ON CONFLICT (player_id, nationality_code, basis) DO NOTHING;

COMMIT;

-- Vérification :
-- SELECT confidence, basis, COUNT(*) FROM public.nationality_basis
-- WHERE nationality_code = 'COD' GROUP BY confidence, basis ORDER BY confidence;
