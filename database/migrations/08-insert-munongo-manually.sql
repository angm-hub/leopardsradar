-- =====================================================================
-- Léopards Radar — Insertion manuelle Believe Munongo (TM 1297673)
-- À exécuter dans Supabase SQL Editor (project pvpshyoaregroihwglye)
-- OU via le script Python : python scripts/insert_munongo.py
-- Idempotent : ON CONFLICT (transfermarkt_id) DO NOTHING
-- Date : 2026-05-15 | Source : méthode E (squad scan multi-nats)
-- =====================================================================

INSERT INTO public.players (
  name,
  slug,
  transfermarkt_id,
  current_club,
  current_club_id,
  date_of_birth,
  place_of_birth,
  country_of_birth,
  height_cm,
  position,
  nationalities,
  other_nationalities,
  is_binational,
  player_category,
  eligibility_status,
  eligibility_note,
  market_value_eur,
  source_urls,
  verified
)
VALUES (
  'Believe Munongo',
  'believe-munongo',
  '1297673',
  'FC Metz',
  '347',
  '2009-11-23',
  'Metz',
  'France',
  191,
  'Midfield',
  '["France", "DR Congo"]'::jsonb,
  '["DR Congo"]'::jsonb,
  true,
  'radar',
  'potentially_eligible',
  'Découvert via méthode E (squad scan multi-nats, 2026-05-15). Nationalité France (primary) + DR Congo (secondary) sur Transfermarkt. Né à Metz le 23/11/2009. Valeur marchande 10M€ (mars 2026). Potentiellement éligible RDC si aucune sélection A France. À instruire : base juridique congolaise (père/mère ?) + caps France U-jeunes.',
  10000000,
  ARRAY['https://www.transfermarkt.com/believe-munongo/profil/spieler/1297673'],
  false
)
ON CONFLICT (transfermarkt_id) DO NOTHING;

-- Vérification
SELECT
  id,
  name,
  transfermarkt_id,
  current_club,
  nationalities,
  other_nationalities,
  is_binational,
  eligibility_status,
  market_value_eur
FROM public.players
WHERE transfermarkt_id = '1297673';
