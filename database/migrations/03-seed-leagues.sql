-- =====================================================================
-- Léopards Radar — Seed des championnats (premières équipes + réserves + jeunes)
-- Migration : 03-seed-leagues.sql
-- À exécuter APRÈS 02-seed-federations.sql
--
-- Couverture :
--   - 12 ligues majeures déjà couvertes par football-data.org (tier 100)
--   - 12 ligues secondaires à scraper (tier 70)
--   - 8 championnats réserves / U23 / U21
--   - 5 championnats Primavera / U19 / U18
--   - 1 championnat Linafoot (RDC)
--   - 1 UEFA Youth League
-- =====================================================================

BEGIN;

-- ─── TIER 100 — Top 5 EU + grandes coupes (football-data.org free) ───
INSERT INTO public.leagues (name, country_code, tier_uefa, competition_type, parent_competition, transfermarkt_competition_id, football_data_id) VALUES
  ('Premier League',        'ENG', 100, 'first_team', 'NATIONAL', 'GB1', 'PL'),
  ('La Liga',               'ESP', 100, 'first_team', 'NATIONAL', 'ES1', 'PD'),
  ('Bundesliga',            'DEU', 100, 'first_team', 'NATIONAL', 'L1',  'BL1'),
  ('Serie A',               'ITA', 100, 'first_team', 'NATIONAL', 'IT1', 'SA'),
  ('Ligue 1',               'FRA', 100, 'first_team', 'NATIONAL', 'FR1', 'FL1'),
  ('UEFA Champions League', 'EUR', 100, 'first_team', 'UEFA',     'CL',  'CL'),
  ('UEFA Europa League',    'EUR',  90, 'first_team', 'UEFA',     'EL',  'EL'),
  ('UEFA Conference League','EUR',  80, 'first_team', 'UEFA',     'UCOL', NULL)
ON CONFLICT (country_code, name, competition_type) DO NOTHING;

-- ─── TIER 70 — sous-élite européenne (à scraper Transfermarkt) ───
INSERT INTO public.leagues (name, country_code, tier_uefa, competition_type, parent_competition, transfermarkt_competition_id, football_data_id) VALUES
  ('Eredivisie',            'NLD', 70, 'first_team', 'NATIONAL', 'NL1', 'DED'),
  ('Primeira Liga',         'PRT', 70, 'first_team', 'NATIONAL', 'PO1', 'PPL'),
  ('Pro League (D1A)',      'BEL', 70, 'first_team', 'NATIONAL', 'BE1', NULL),
  ('Süper Lig',             'TUR', 70, 'first_team', 'NATIONAL', 'TR1', NULL),
  ('Championship',          'ENG', 70, 'first_team', 'NATIONAL', 'GB2', 'ELC'),
  ('Bundesliga 2',          'DEU', 70, 'first_team', 'NATIONAL', 'L2',  NULL),
  ('Serie B',               'ITA', 70, 'first_team', 'NATIONAL', 'IT2', NULL),
  ('La Liga 2 (Hypermotion)','ESP',70, 'first_team', 'NATIONAL', 'ES2', NULL),
  ('Ligue 2',               'FRA', 70, 'first_team', 'NATIONAL', 'FR2', NULL),
  ('Super League',          'CHE', 65, 'first_team', 'NATIONAL', 'C1',  NULL),
  ('Allsvenskan',           'SWE', 60, 'first_team', 'NATIONAL', 'SE1', NULL),
  ('Eliteserien',           'NOR', 60, 'first_team', 'NATIONAL', 'NO1', NULL),
  ('Eerste Divisie',        'NLD', 55, 'first_team', 'NATIONAL', 'NL2', NULL),
  ('Liga Portugal 2',       'PRT', 55, 'first_team', 'NATIONAL', 'PO2', NULL),
  ('Scottish Premiership',  'SCO', 55, 'first_team', 'NATIONAL', 'SC1', 'SC'),
  ('MLS',                   'USA', 60, 'first_team', 'NATIONAL', 'MLS1', NULL),
  ('Brasileirão Série A',   'BRA', 65, 'first_team', 'NATIONAL', 'BRA1', 'BSA')
ON CONFLICT (country_code, name, competition_type) DO NOTHING;

-- ─── TIER 50 — autres championnats reconnus + Africains
INSERT INTO public.leagues (name, country_code, tier_uefa, competition_type, parent_competition, transfermarkt_competition_id) VALUES
  ('Saudi Pro League',      'SAU', 55, 'first_team', 'NATIONAL', 'SA1'),
  ('Linafoot',              'COD', 35, 'first_team', 'NATIONAL', 'COD1'),
  ('Botola Pro',            'MAR', 45, 'first_team', 'NATIONAL', 'MAR1'),
  ('Ligue Professionnelle 1','TUN',45, 'first_team', 'NATIONAL', 'TUN1'),
  ('Ligue 1 (Algérie)',     'DZA', 45, 'first_team', 'NATIONAL', 'DZA1'),
  ('Egyptian Premier League','EGY',45, 'first_team', 'NATIONAL', 'EGY1'),
  ('Premier Soccer League', 'ZAF', 45, 'first_team', 'NATIONAL', 'ZAF1'),
  ('Girabola',              'AGO', 35, 'first_team', 'NATIONAL', 'AGO1')
ON CONFLICT (country_code, name, competition_type) DO NOTHING;

-- ─── RÉSERVES & U23 — vivier critique pour binationaux jeunes ───
INSERT INTO public.leagues (name, country_code, tier_uefa, competition_type, parent_competition) VALUES
  ('Premier League 2',          'ENG', 50, 'u23',     'NATIONAL'),
  ('LaLiga RFEF (équipes B)',   'ESP', 45, 'reserve', 'NATIONAL'),
  ('3. Liga',                   'DEU', 50, 'reserve', 'NATIONAL'),
  ('Regionalliga',              'DEU', 40, 'reserve', 'NATIONAL'),
  ('Serie C',                   'ITA', 45, 'first_team', 'NATIONAL'),
  ('National 1',                'FRA', 45, 'first_team', 'NATIONAL'),
  ('National 2',                'FRA', 35, 'first_team', 'NATIONAL'),
  ('Championship U21',          'ENG', 40, 'u21',     'NATIONAL'),
  ('Eerste Divisie (Jong)',     'NLD', 40, 'reserve', 'NATIONAL')
ON CONFLICT (country_code, name, competition_type) DO NOTHING;

-- ─── PRIMAVERA / YOUTH ───
INSERT INTO public.leagues (name, country_code, tier_uefa, competition_type, parent_competition) VALUES
  ('Campionato Primavera 1',    'ITA', 60, 'u19',         'NATIONAL'),
  ('Premier League U18',        'ENG', 50, 'u18',         'NATIONAL'),
  ('A-Junioren Bundesliga',     'DEU', 50, 'u19',         'NATIONAL'),
  ('LaLiga Juvenil DH',         'ESP', 50, 'u19',         'NATIONAL'),
  ('Championnat National U19',  'FRA', 50, 'u19',         'NATIONAL'),
  ('UEFA Youth League',         'EUR', 65, 'youth_league','UEFA')
ON CONFLICT (country_code, name, competition_type) DO NOTHING;

COMMIT;

-- Vérification :
-- SELECT competition_type, COUNT(*), AVG(tier_uefa)::int AS avg_tier
-- FROM public.leagues GROUP BY competition_type ORDER BY avg_tier DESC;
