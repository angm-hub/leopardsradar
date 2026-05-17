-- =============================================================================
-- Leopards Radar — Migrations infra data multi-source + lineups historiques
-- Appliquer via Supabase MCP : apply_migration
-- Date : 2026-05-17
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table 1 : player_stats_multi
-- Stats joueur par source, par saison, par competition.
-- Grille de confiance : is_canonical = source retenue pour le merge final.
-- Contrainte d'unicite : (player_id, source, season, competition).
-- NULL competition = donnee agregee toutes competitions confondues.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS player_stats_multi (
  id                 BIGSERIAL PRIMARY KEY,
  player_id          BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  source             TEXT   NOT NULL
                       CHECK (source IN ('fbref','transfermarkt','soccerway','sofascore','understat')),
  season             TEXT   NOT NULL,                     -- ex. '2025-2026'
  competition        TEXT,                                -- NULL = all comps aggregated
  competition_tier   INTEGER,                             -- 1=Big5+UCL 2=EU2 3=african_top 4=exotic
  matches_played     INTEGER,
  minutes_played     INTEGER,
  goals              INTEGER,
  assists            INTEGER,
  xg                 NUMERIC(6,2),
  xa                 NUMERIC(6,2),
  yellow_cards       INTEGER,
  red_cards          INTEGER,
  source_url         TEXT,
  scraped_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_canonical       BOOLEAN     NOT NULL DEFAULT false,  -- source authoritative pour ce slot
  confidence         TEXT        NOT NULL DEFAULT 'HIGH'
                       CHECK (confidence IN ('HIGH','MEDIUM','LOW')),
  UNIQUE (player_id, source, season, COALESCE(competition, '__all__'))
);

CREATE INDEX IF NOT EXISTS idx_psm_player_season
  ON player_stats_multi (player_id, season);

CREATE INDEX IF NOT EXISTS idx_psm_canonical
  ON player_stats_multi (player_id, season, is_canonical)
  WHERE is_canonical = true;

COMMENT ON TABLE player_stats_multi IS
  'Stats joueur multi-source par saison × competition. '
  'is_canonical=true = source retenue par aggregate_player_stats pour ecrire dans players.season_*. '
  'Cascade pipeline : sync_stats_multi (sources) -> aggregate_player_stats (players.*).';

COMMENT ON COLUMN player_stats_multi.source IS
  'fbref | transfermarkt | soccerway | sofascore | understat';
COMMENT ON COLUMN player_stats_multi.is_canonical IS
  'True si cette row est la source retenue pour le merge final vers players.season_*. '
  'Une seule row is_canonical=true par (player_id, season).';
COMMENT ON COLUMN player_stats_multi.confidence IS
  'HIGH = source primaire directe. MEDIUM = deduction partielle (ex TM sans xG). LOW = nom-match uniquement.';


-- -----------------------------------------------------------------------------
-- Table 2 : national_lineups
-- Historique des compositions de la selection RDC A sous tous les coaches.
-- Index GIN sur starting_xi (array de player_id) pour rechercher vite
-- "tous les matchs ou joueur X etait titulaire".
-- Contrainte d'unicite : (match_date, opponent).
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS national_lineups (
  id           BIGSERIAL PRIMARY KEY,
  match_date   DATE    NOT NULL,
  opponent     TEXT    NOT NULL,
  competition  TEXT,                    -- 'WCQ 2026', 'CAN 2024', 'Friendly', etc.
  result       TEXT,                    -- 'W 2-1', 'D 1-1', 'L 0-2'
  formation    TEXT,                    -- '4-3-3', '4-2-3-1', etc.
  starting_xi  BIGINT[] NOT NULL,       -- array of player.id (11 elements max)
  substitutes_in BIGINT[],             -- player_ids entres en cours de jeu
  coach        TEXT,                   -- 'Desabre' | 'Cuper' | 'Ibenge' | etc.
  is_official  BOOLEAN NOT NULL DEFAULT true,   -- false = amical non-federation
  source       TEXT,                   -- 'transfermarkt' | 'fifa' | 'caf' | 'wikipedia'
  source_url   TEXT,
  scraped_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_date, opponent)
);

CREATE INDEX IF NOT EXISTS idx_lineups_coach_date
  ON national_lineups (coach, match_date DESC);

CREATE INDEX IF NOT EXISTS idx_lineups_starting_xi
  ON national_lineups USING GIN (starting_xi);

CREATE INDEX IF NOT EXISTS idx_lineups_date
  ON national_lineups (match_date DESC);

COMMENT ON TABLE national_lineups IS
  'Historique des compositions RDC A (toutes epoques, priorite ere Desabre 2022-08-07+). '
  'starting_xi = array de player.id (player doit exister dans players). '
  'Alimente par scrape_rdc_lineups.py (TM + CAF). '
  'Consomme par compute_desabre_xi.py -> vue desabre_xi_stats.';

COMMENT ON COLUMN national_lineups.starting_xi IS
  'Array de 11 player.id. NULL = joueur non identifie dans la BDD (scrape incomplet).';
COMMENT ON COLUMN national_lineups.coach IS
  'Nom court du coach (Desabre | Cuper | Ibenge | etc.) pour le filtre compute_desabre_xi.';
COMMENT ON COLUMN national_lineups.is_official IS
  'false pour les amicaux hors FIFA date. Le compute_desabre_xi inclut les deux par defaut '
  'mais peut etre filtre sur is_official=true pour les stats officielles uniquement.';


-- -----------------------------------------------------------------------------
-- Vue materielle : desabre_xi_stats
-- Frequence de selection de chaque joueur en tant que titulaire sous Desabre.
-- Rafraichie par compute_desabre_xi.py apres chaque run scrape_rdc_lineups.
-- -----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW IF NOT EXISTS desabre_xi_stats AS
  SELECT
    p.id                          AS player_id,
    p.name                        AS player_name,
    p.position                    AS position,
    p.slug                        AS slug,
    COUNT(nl.id)                  AS appearances_total,
    COUNT(nl.id) FILTER (WHERE nl.is_official = true) AS appearances_official,
    ROUND(
      COUNT(nl.id)::NUMERIC /
      NULLIF((
        SELECT COUNT(*) FROM national_lineups
        WHERE coach = 'Desabre'
      ), 0) * 100,
      1
    )                             AS start_pct,
    MIN(nl.match_date)            AS first_start,
    MAX(nl.match_date)            AS last_start
  FROM players p
  JOIN national_lineups nl
    ON p.id = ANY(nl.starting_xi)
    AND nl.coach = 'Desabre'
  GROUP BY p.id, p.name, p.position, p.slug
  ORDER BY appearances_total DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_desabre_xi_stats_player
  ON desabre_xi_stats (player_id);

CREATE INDEX IF NOT EXISTS idx_desabre_xi_stats_position
  ON desabre_xi_stats (position, appearances_total DESC);

COMMENT ON MATERIALIZED VIEW desabre_xi_stats IS
  'Statistiques de titularisations sous Desabre. '
  'REFRESH MATERIALIZED VIEW desabre_xi_stats; apres chaque run compute_desabre_xi.py.';
