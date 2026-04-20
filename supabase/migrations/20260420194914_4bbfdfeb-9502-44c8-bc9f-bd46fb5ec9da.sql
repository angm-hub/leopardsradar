UPDATE players
SET eligibility_status = 'ineligible',
    eligibility_note = CASE name
WHEN 'Ezri Konsa' THEN '17 caps England A senior + squad WC 2026. Cap-tied.'
WHEN 'Moïse Bombito' THEN '19 caps Canada A senior + Copa América 2024. Cap-tied.'
WHEN 'Jean-Philippe Mateta' THEN '2 caps France A (oct 2025). Avait 28 ans au 1er cap → règle FIFA <21 ans non remplie. Cap-tied.'
WHEN 'Presnel Kimpembe' THEN '21 caps France A + Euro 2020 squad. Cap-tied France.'
WHEN 'Orel Mangala' THEN '10+ caps Belgique A. Cap-tied Belgique.'
WHEN 'Nordi Mukiele' THEN '7 caps France A + Euro 2020 squad. Cap-tied France.'
WHEN 'Albert Sambi Lokonga' THEN '3+ caps Belgique A en compétition officielle. Cap-tied Belgique.'
WHEN 'Benoît Badiashile' THEN '2 caps France A en compétition officielle, senior à 22 ans. Cap-tied France (règle FIFA art. 9 non remplie : >21 ans au moment du cap officiel).'
WHEN 'Levi Lukebakio' THEN '5 caps Belgique A. Cap-tied Belgique.'
WHEN 'Jordan Lotomba' THEN '5+ caps Suisse A. Cap-tied Suisse.'
ELSE eligibility_note
END,
    updated_at = now()
WHERE name IN (
'Ezri Konsa','Moïse Bombito','Jean-Philippe Mateta','Presnel Kimpembe','Orel Mangala',
'Nordi Mukiele','Albert Sambi Lokonga','Benoît Badiashile','Levi Lukebakio','Jordan Lotomba'
);

UPDATE players
SET current_club = regexp_replace(current_club, '\s+(U19|U21|U23|B|II|2)$', '', 'i'),
    updated_at = now()
WHERE current_club ~* '(\s+U19$|\s+U21$|\s+U23$|\s+B$|\s+II$|\s+2$)';

UPDATE players
SET image_url = NULL,
    updated_at = now()
WHERE image_url LIKE '%transfermarkt%' OR image_url = '';

DROP VIEW IF EXISTS v_home_stats;
CREATE VIEW v_home_stats AS
SELECT
COUNT(*) FILTER (WHERE eligibility_status != 'ineligible') AS total_players,
COUNT(DISTINCT country_of_birth) FILTER (WHERE country_of_birth IS NOT NULL) AS total_countries,
COUNT(DISTINCT current_club) FILTER (WHERE current_club IS NOT NULL AND eligibility_status != 'ineligible') AS total_clubs,
ROUND(AVG(age) FILTER (WHERE eligibility_status != 'ineligible'))::int AS avg_age,
SUM(market_value_eur) FILTER (WHERE eligibility_status != 'ineligible') AS total_market_value,
COUNT(*) FILTER (WHERE tier = 'tier1' AND eligibility_status != 'ineligible') AS tier1_count,
COUNT(*) FILTER (WHERE player_category = 'roster' AND eligibility_status != 'ineligible') AS roster_count,
COUNT(*) FILTER (WHERE player_category = 'radar' AND eligibility_status != 'ineligible') AS radar_count,
COUNT(*) FILTER (WHERE player_category = 'heritage' AND eligibility_status != 'ineligible') AS heritage_count,
COUNT(*) FILTER (WHERE eligibility_status = 'ineligible') AS ineligible_count
FROM players;