-- =====================================================================
-- Léopards Radar — Seed des fédérations nationales
-- Migration : 02-seed-federations.sql
-- À exécuter APRÈS 01-eligibility-schema.sql
-- =====================================================================

BEGIN;

INSERT INTO public.federations (code, name, confederation, flag_emoji) VALUES
  -- Afrique (CAF) — focus Afrique centrale + nations à diaspora congolaise
  ('COD', 'DR Congo',          'CAF', '🇨🇩'),
  ('COG', 'Congo',             'CAF', '🇨🇬'),
  ('AGO', 'Angola',            'CAF', '🇦🇴'),
  ('CMR', 'Cameroon',          'CAF', '🇨🇲'),
  ('CIV', 'Ivory Coast',       'CAF', '🇨🇮'),
  ('SEN', 'Senegal',           'CAF', '🇸🇳'),
  ('GHA', 'Ghana',             'CAF', '🇬🇭'),
  ('NGA', 'Nigeria',           'CAF', '🇳🇬'),
  ('MLI', 'Mali',              'CAF', '🇲🇱'),
  ('GIN', 'Guinea',            'CAF', '🇬🇳'),
  ('BFA', 'Burkina Faso',      'CAF', '🇧🇫'),
  ('GAB', 'Gabon',             'CAF', '🇬🇦'),
  ('ZAF', 'South Africa',      'CAF', '🇿🇦'),
  ('MAR', 'Morocco',           'CAF', '🇲🇦'),
  ('DZA', 'Algeria',           'CAF', '🇩🇿'),
  ('TUN', 'Tunisia',           'CAF', '🇹🇳'),
  ('EGY', 'Egypt',             'CAF', '🇪🇬'),
  ('ZMB', 'Zambia',            'CAF', '🇿🇲'),
  ('KEN', 'Kenya',             'CAF', '🇰🇪'),
  ('UGA', 'Uganda',            'CAF', '🇺🇬'),
  ('TZA', 'Tanzania',          'CAF', '🇹🇿'),
  -- Europe (UEFA) — focus pays accueil diaspora RDC
  ('FRA', 'France',            'UEFA', '🇫🇷'),
  ('BEL', 'Belgium',           'UEFA', '🇧🇪'),
  ('ENG', 'England',           'UEFA', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('SCO', 'Scotland',          'UEFA', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('WAL', 'Wales',             'UEFA', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'),
  ('IRL', 'Ireland',           'UEFA', '🇮🇪'),
  ('NLD', 'Netherlands',       'UEFA', '🇳🇱'),
  ('DEU', 'Germany',           'UEFA', '🇩🇪'),
  ('ITA', 'Italy',             'UEFA', '🇮🇹'),
  ('ESP', 'Spain',             'UEFA', '🇪🇸'),
  ('PRT', 'Portugal',          'UEFA', '🇵🇹'),
  ('CHE', 'Switzerland',       'UEFA', '🇨🇭'),
  ('AUT', 'Austria',           'UEFA', '🇦🇹'),
  ('LUX', 'Luxembourg',        'UEFA', '🇱🇺'),
  ('DNK', 'Denmark',           'UEFA', '🇩🇰'),
  ('SWE', 'Sweden',            'UEFA', '🇸🇪'),
  ('NOR', 'Norway',            'UEFA', '🇳🇴'),
  ('FIN', 'Finland',           'UEFA', '🇫🇮'),
  ('GRC', 'Greece',            'UEFA', '🇬🇷'),
  ('TUR', 'Turkey',            'UEFA', '🇹🇷'),
  ('RUS', 'Russia',            'UEFA', '🇷🇺'),
  ('POL', 'Poland',            'UEFA', '🇵🇱'),
  ('CZE', 'Czech Republic',    'UEFA', '🇨🇿'),
  ('HRV', 'Croatia',           'UEFA', '🇭🇷'),
  ('SRB', 'Serbia',            'UEFA', '🇷🇸'),
  ('CYP', 'Cyprus',            'UEFA', '🇨🇾'),
  -- Amériques
  ('USA', 'United States',     'CONCACAF', '🇺🇸'),
  ('CAN', 'Canada',            'CONCACAF', '🇨🇦'),
  ('MEX', 'Mexico',            'CONCACAF', '🇲🇽'),
  ('BRA', 'Brazil',            'CONMEBOL', '🇧🇷'),
  ('ARG', 'Argentina',         'CONMEBOL', '🇦🇷'),
  ('COL', 'Colombia',          'CONMEBOL', '🇨🇴'),
  -- Asie / Océanie
  ('AUS', 'Australia',         'AFC', '🇦🇺'),
  ('JPN', 'Japan',             'AFC', '🇯🇵'),
  ('KOR', 'South Korea',       'AFC', '🇰🇷'),
  ('SAU', 'Saudi Arabia',      'AFC', '🇸🇦'),
  ('QAT', 'Qatar',             'AFC', '🇶🇦'),
  ('ARE', 'United Arab Emirates', 'AFC', '🇦🇪'),
  ('ISR', 'Israel',            'UEFA', '🇮🇱')
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Vérification :
-- SELECT confederation, COUNT(*) FROM public.federations GROUP BY confederation ORDER BY confederation;
