-- Garde-fou crédibilité serveur sur get_weekly_movers.
-- Un delta hebdo = curr - prev (snapshots dimanche adjacents). Un refresh
-- batch des stats saison entre deux snapshots fait remonter ce delta au
-- niveau de la correction data (ex. Kabongo delta_games=44, +16 buts), pas
-- du football. La gate `delta_games BETWEEN 1 AND 3` (un joueur ne joue
-- que 1 a 3 matchs par semaine) + plafonds G/A distinguent un vrai mouvement
-- hebdo d'un artefact. Quand ce n'est pas credible -> narration saison
-- honnete, has_weekly_delta=false. La logique s'auto-repare au snapshot
-- suivant (les totaux corriges sont deja dans curr).
CREATE OR REPLACE FUNCTION public.get_weekly_movers(top_n integer DEFAULT 5)
 RETURNS TABLE(player_id bigint, name text, slug text, player_position text, image_url text, image_url_alt text, current_club text, season_goals integer, season_assists integer, season_games integer, delta_goals integer, delta_assists integer, delta_value_eur bigint, has_weekly_delta boolean, signal text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH scored AS (
    SELECT
      m.player_id, m.name, m.slug, m.pos, m.image_url, p.image_url_alt,
      m.current_club, m.season_goals, m.season_assists, m.season_games,
      m.delta_goals, m.delta_assists, m.delta_games, m.delta_value_eur,
      (
        m.has_weekly_delta
        AND m.delta_games BETWEEN 1 AND 3
        AND COALESCE(m.delta_goals, 0) >= 0
        AND COALESCE(m.delta_assists, 0) >= 0
        AND (COALESCE(m.delta_goals, 0) > 0 OR COALESCE(m.delta_assists, 0) > 0)
        AND COALESCE(m.delta_goals, 0) <= 3
        AND COALESCE(m.delta_assists, 0) <= 3
        AND COALESCE(m.delta_goals, 0) + COALESCE(m.delta_assists, 0) <= 4
      ) AS eff_weekly
    FROM public.v_weekly_movers m
    LEFT JOIN public.players p ON p.id = m.player_id
    WHERE m.image_url IS NOT NULL
      AND m.season_games > 0
      AND (m.season_goals + m.season_assists) > 0
  )
  SELECT
    s.player_id,
    s.name,
    s.slug,
    s.pos::text AS player_position,
    s.image_url,
    s.image_url_alt,
    s.current_club,
    s.season_goals,
    s.season_assists,
    s.season_games,
    s.delta_goals,
    s.delta_assists,
    s.delta_value_eur,
    s.eff_weekly AS has_weekly_delta,
    CASE
      WHEN s.eff_weekly THEN
        TRIM(
          CASE WHEN s.delta_goals > 0
            THEN '+' || s.delta_goals || ' but' || (CASE WHEN s.delta_goals > 1 THEN 's' ELSE '' END)
            ELSE '' END
          || CASE WHEN s.delta_goals > 0 AND s.delta_assists > 0 THEN ', ' ELSE '' END
          || CASE WHEN s.delta_assists > 0
            THEN '+' || s.delta_assists || ' PD'
            ELSE '' END
          || ' cette semaine'
        )
      WHEN s.season_goals > 0 OR s.season_assists > 0 THEN
        s.season_goals || 'B · ' || s.season_assists || 'PD sur ' || s.season_games || ' matchs'
      ELSE
        s.season_games || ' matchs joués'
    END AS signal
  FROM scored s
  ORDER BY
    s.eff_weekly DESC,
    (CASE WHEN s.eff_weekly THEN COALESCE(s.delta_goals, 0) * 3 + COALESCE(s.delta_assists, 0) * 2 ELSE 0 END) DESC,
    (s.season_goals * 3 + s.season_assists * 2) DESC
  LIMIT top_n;
$function$;
