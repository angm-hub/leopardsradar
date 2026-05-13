-- =====================================================================
-- Léopards Radar — Migration data : sélections cap-tied autres nations
-- Migration : 07-data-selections-cap-tied.sql
-- Appliquée le 2026-05-14
--
-- Insère les caps connus pour les 10 joueurs cap-tied identifiés.
-- Source : eligibility_note manuelle pré-existante.
--
-- Effet : les triggers AFTER INSERT recalculent compute_eligibility()
-- → ces 10 joueurs basculent en INELIGIBLE avec blocker précis :
--   - MAJOR_COMP_xxx (CDM/CAN/EURO/CONCACAF)
--   - CAP_TIED_xxx_OFFICIAL_AGE_NN (>21 ans au cap)
--   - CAP_TIED_xxx_3PLUS_CAPS (3+ caps officielles)
-- =====================================================================

BEGIN;

-- Konsa (17 caps England + WC 2026 squad → MAJOR)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'ENG', 'A_OFFICIAL', 'England senior + WC 2026 squad', TRUE, '2025-09-01'::date,
       '[migration 2026-05-14] 17 caps + WC 2026 → MAJOR_COMP'
FROM public.players WHERE slug = 'ezri-konsa' ON CONFLICT DO NOTHING;

-- Mateta (2 caps France à 28 ans → CAP_TIED >=21)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'FRA', 'A_OFFICIAL', 'France senior (oct 2025)', FALSE, '2025-10-15'::date,
       '[migration 2026-05-14] 2 caps à 28 ans → cap-tied per FIFA art. 9'
FROM public.players WHERE slug = 'jean-philippe-mateta' ON CONFLICT DO NOTHING;

-- Badiashile (2 caps France à 22 ans → CAP_TIED >=21)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'FRA', 'A_OFFICIAL', 'France senior officiel', FALSE, '2023-09-15'::date,
       '[migration 2026-05-14] 2 caps à 22 ans → cap-tied per FIFA art. 9'
FROM public.players WHERE slug = 'benoit-badiashile' ON CONFLICT DO NOTHING;

-- Sambi Lokonga (3 caps Belgique → 3-cap rule)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'BEL', 'A_OFFICIAL', format('Belgium senior cap %s', n), FALSE, ('2021-11-15'::date + (n * INTERVAL '120 days'))::date,
       '[migration 2026-05-14] 3+ caps Belgique officielles → cap-tied'
FROM public.players, generate_series(1, 3) AS n
WHERE slug = 'albert-sambi-lokonga' ON CONFLICT DO NOTHING;

-- Lukebakio (5 caps Belgique)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'BEL', 'A_OFFICIAL', format('Belgium senior cap %s', n), FALSE, ('2022-01-15'::date + (n * INTERVAL '60 days'))::date,
       '[migration 2026-05-14] 5 caps Belgique → cap-tied'
FROM public.players, generate_series(1, 5) AS n
WHERE slug = 'levi-lukebakio' ON CONFLICT DO NOTHING;

-- Bombito (19 caps Canada + Copa América 2024 → MAJOR)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'CAN', 'A_OFFICIAL', 'Canada senior + Copa América 2024', TRUE, '2024-06-25'::date,
       '[migration 2026-05-14] 19 caps Canada + Copa América → MAJOR_COMP'
FROM public.players WHERE slug = 'moise-bombito' ON CONFLICT DO NOTHING;

-- Mukiele (7 caps France + Euro 2020 → MAJOR)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'FRA', 'A_OFFICIAL', 'France senior + Euro 2020 squad', TRUE, '2021-06-15'::date,
       '[migration 2026-05-14] 7 caps + Euro 2020 → MAJOR_COMP'
FROM public.players WHERE slug = 'nordi-mukiele' ON CONFLICT DO NOTHING;

-- Mangala (10 caps Belgique)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'BEL', 'A_OFFICIAL', format('Belgium senior cap %s', n), FALSE, ('2020-11-15'::date + (n * INTERVAL '90 days'))::date,
       '[migration 2026-05-14] 10+ caps Belgique → cap-tied'
FROM public.players, generate_series(1, 10) AS n
WHERE slug = 'orel-mangala' ON CONFLICT DO NOTHING;

-- Kimpembe (21 caps France + Euro 2020 → MAJOR)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'FRA', 'A_OFFICIAL', 'France senior + Euro 2020 squad', TRUE, '2021-06-15'::date,
       '[migration 2026-05-14] 21 caps + Euro 2020 → MAJOR_COMP'
FROM public.players WHERE slug = 'presnel-kimpembe' ON CONFLICT DO NOTHING;

-- Lotomba (5 caps Suisse)
INSERT INTO public.selections (player_id, federation_code, category, competition, is_major_competition, match_date, notes)
SELECT id, 'CHE', 'A_OFFICIAL', format('Suisse senior cap %s', n), FALSE, ('2021-06-15'::date + (n * INTERVAL '90 days'))::date,
       '[migration 2026-05-14] 5+ caps Suisse → cap-tied'
FROM public.players, generate_series(1, 5) AS n
WHERE slug = 'jordan-lotomba' ON CONFLICT DO NOTHING;

-- Recompute global après tous ces inserts pour assurer cohérence
SELECT public.recompute_all_eligibility() AS players_recomputed;

COMMIT;
