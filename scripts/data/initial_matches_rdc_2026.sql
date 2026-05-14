-- Léopards Radar — Seed initial matchs RDC 2026
--
-- À appliquer via Supabase MCP apply_migration ou via le script seed_matches.py.
-- La table matches n'a pas forcément de UNIQUE constraint sur (kickoff_at, opponent_name)
-- selon le schéma actuel — le script seed_matches.py gère l'idempotence côté Python
-- (SELECT avant INSERT, skip si trouvé).
--
-- Données publiques au 14 mai 2026 :
--   - Match amical vs Danemark (3 juin 2026) : confirmé, déjà en base
--   - Match amical vs Maroc (7 juin 2026) : annoncé officiellement
--   - Coupe du Monde 2026 : RDC dans le groupe (tirage → groupe A, B ou C selon confirmation)
--     Dates J1/J2/J3 conformes au calendrier FIFA Mondial 2026 (11 juin – 19 juillet 2026)
--   - CAN 2027 : éliminatoires à confirmer (placeholder date septembre 2026)
--
-- NOTE : le match Danemark du 3 juin existe déjà → sera skippé par seed_matches.py.

INSERT INTO matches (
  kickoff_at,
  opponent_name,
  opponent_code,
  opponent_flag,
  competition,
  venue,
  city,
  country,
  home_or_away,
  status,
  is_published
) VALUES
  (
    '2026-06-03 19:00:00+00',
    'Danemark',
    'DEN',
    '🇩🇰',
    'Match amical',
    'Stade Pierre-Mauroy',
    'Lille',
    'France',
    'neutral',
    'scheduled',
    true
  ),
  (
    '2026-06-07 18:00:00+00',
    'Maroc',
    'MAR',
    '🇲🇦',
    'Match amical',
    'Stade Bollaert-Delelis',
    'Lens',
    'France',
    'neutral',
    'scheduled',
    true
  ),
  (
    '2026-06-12 21:00:00+00',
    'À confirmer (Mondial groupe)',
    NULL,
    '🏆',
    'Coupe du Monde 2026 — Phase de groupes (J1)',
    'AT&T Stadium',
    'Arlington',
    'États-Unis',
    'neutral',
    'scheduled',
    true
  ),
  (
    '2026-06-17 21:00:00+00',
    'À confirmer (Mondial groupe)',
    NULL,
    '🏆',
    'Coupe du Monde 2026 — Phase de groupes (J2)',
    'BMO Field',
    'Toronto',
    'Canada',
    'neutral',
    'scheduled',
    true
  ),
  (
    '2026-06-23 21:00:00+00',
    'À confirmer (Mondial groupe)',
    NULL,
    '🏆',
    'Coupe du Monde 2026 — Phase de groupes (J3)',
    'Estadio Azteca',
    'Mexico',
    'Mexique',
    'neutral',
    'scheduled',
    true
  ),
  (
    '2026-09-04 18:00:00+00',
    'À confirmer (qualif CAN 2027)',
    NULL,
    '🌍',
    'Éliminatoires CAN 2027',
    NULL,
    NULL,
    NULL,
    'home',
    'scheduled',
    false
  );
