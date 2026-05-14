-- ============================================================
-- Léopards Radar — Sprint 3 : Level Band public
-- Migration : 2026_05_15_player_level_band.sql
--
-- Ajoute level_score (0-100) et level_band (elite/high/mid/
-- developing/watch) sur la table players.
-- Score composite pondéré :
--   40% tier UEFA du club actuel
--   30% log(market_value)
--   20% caps A senior officiels (COD)
--   10% minutes saison en cours
--
-- Idempotent : toutes les DDL utilisent IF NOT EXISTS /
-- CREATE OR REPLACE / DROP TRIGGER IF EXISTS.
-- À appliquer via Supabase MCP `apply_migration`.
-- ============================================================

-- ── 1. Colonnes computed sur players ─────────────────────────────────────────

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS level_score smallint,
  ADD COLUMN IF NOT EXISTS level_band  text
    CHECK (level_band IN ('elite', 'high', 'mid', 'developing', 'watch'));

-- Index pour filtrer par bande (page Roster, filtre Radar)
CREATE INDEX IF NOT EXISTS idx_players_level_band
  ON public.players(level_band);

-- Index pour trier par score décroissant (classement "top Elite")
CREATE INDEX IF NOT EXISTS idx_players_level_score
  ON public.players(level_score DESC NULLS LAST);

COMMENT ON COLUMN public.players.level_score IS
  'Score composite 0-100. Formule : 40% tier UEFA club + 30% log(market_value) + 20% caps A senior COD + 10% minutes saison. Recompute via refresh_player_levels() appelée par trigger et cron quotidien. Documenté sur /methodologie.';

COMMENT ON COLUMN public.players.level_band IS
  'Bande de niveau public dérivée du score : elite (80-100), high (60-79), mid (40-59), developing (20-39), watch (0-19). Affiché sur fiche joueur, cards Roster/Radar, page /methodologie.';

-- ── 2. Vue qui calcule le score composite ─────────────────────────────────────

-- On utilise CREATE OR REPLACE pour que la vue soit recréable sans DROP.
-- La vue est une source de vérité lecture seule — la donnée persistée
-- vit dans players.level_score / level_band, mis à jour par la fonction
-- refresh_player_levels().

CREATE OR REPLACE VIEW public.v_player_levels AS
WITH club_uefa AS (
  -- Composante UEFA : tier de la ligue du club actuel du joueur.
  -- Si current_club_fk n'est pas encore renseigné (backfill en cours),
  -- on replie sur une heuristique de market_value pour ne pas laisser
  -- les grandes stars à 0 pendant la transition.
  SELECT
    p.id AS player_id,
    CASE
      WHEN l.tier_uefa = 1 THEN 40   -- Grandes ligues (PL, LaLiga, BL, SA, L1) + groupes CL
      WHEN l.tier_uefa = 2 THEN 25   -- Europa League / sous-élite (Pro League, Eredivisie…)
      WHEN l.tier_uefa = 3 THEN 18   -- Top 5 ligues nationales hors top-5 EU
      WHEN l.tier_uefa = 4 THEN 10   -- Top 10 européen élargi
      WHEN l.tier_uefa = 5 THEN 5    -- Linafoot / nationaux africains / autres
      -- FK renseignée mais tier_uefa NULL : club hors référentiel connu → 5 par défaut
      WHEN l.tier_uefa IS NULL AND p.current_club_fk IS NOT NULL THEN 5
      -- Pas de FK encore : heuristique valeur marchande pour les profils récents
      WHEN p.current_club_fk IS NULL AND p.market_value_eur >= 30000000 THEN 40
      WHEN p.current_club_fk IS NULL AND p.market_value_eur >= 10000000 THEN 25
      WHEN p.current_club_fk IS NULL AND p.market_value_eur >= 3000000  THEN 18
      WHEN p.current_club_fk IS NULL AND p.market_value_eur >= 500000   THEN 10
      ELSE 0
    END AS pts
  FROM public.players p
  LEFT JOIN public.clubs   c ON c.id      = p.current_club_fk
  LEFT JOIN public.leagues l ON l.id      = c.league_id
),
value_pts AS (
  -- Composante valeur marchande : log10 pour comprimer l'échelle.
  -- 100k € → 0 pt. 1M → 10 pts. 10M → 20 pts. 1Md → 30 pts (cap).
  -- LOG(GREATEST(..., 100000)) évite log(0) sur les joueurs à 0 €.
  SELECT
    id AS player_id,
    GREATEST(
      0,
      LEAST(
        30,
        ROUND(
          30.0 * LOG(GREATEST(market_value_eur, 100000) / 100000.0)
              / LOG(1000.0)
        )::int
      )
    ) AS pts
  FROM public.players
  WHERE market_value_eur IS NOT NULL
),
caps_pts AS (
  -- Composante caps : 2 pts par sélection A (officielle ou amicale) avec
  -- la fédération COD, capés à 20 pts (10 sélections = score max).
  -- LEFT JOIN + GROUP BY garantit que chaque joueur apparaît même sans sélection.
  SELECT
    p.id AS player_id,
    LEAST(20, COUNT(s.id) * 2)::int AS pts
  FROM public.players p
  LEFT JOIN public.selections s
    ON  s.player_id       = p.id
    AND s.federation_code = 'COD'
    AND s.category        IN ('A_OFFICIAL', 'A_FRIENDLY')
  GROUP BY p.id
),
minutes_pts AS (
  -- Composante minutes : capées à 1 500 min pour 10 pts max.
  -- 1 500 / 150 = 10 — un titulaire sur ≈17 matchs complets atteint le plafond.
  SELECT
    id AS player_id,
    LEAST(10, COALESCE(season_minutes, 0) / 150)::int AS pts
  FROM public.players
)
SELECT
  p.id,
  -- Score total (0–100) : somme des 4 composantes avec COALESCE pour les NULL
  (
    COALESCE(uefa.pts, 0) +
    COALESCE(val.pts,  0) +
    COALESCE(caps.pts, 0) +
    COALESCE(mins.pts, 0)
  )::smallint AS level_score,
  -- Bande dérivée du score total
  CASE
    WHEN COALESCE(uefa.pts,0)+COALESCE(val.pts,0)+COALESCE(caps.pts,0)+COALESCE(mins.pts,0) >= 80 THEN 'elite'
    WHEN COALESCE(uefa.pts,0)+COALESCE(val.pts,0)+COALESCE(caps.pts,0)+COALESCE(mins.pts,0) >= 60 THEN 'high'
    WHEN COALESCE(uefa.pts,0)+COALESCE(val.pts,0)+COALESCE(caps.pts,0)+COALESCE(mins.pts,0) >= 40 THEN 'mid'
    WHEN COALESCE(uefa.pts,0)+COALESCE(val.pts,0)+COALESCE(caps.pts,0)+COALESCE(mins.pts,0) >= 20 THEN 'developing'
    ELSE 'watch'
  END AS level_band
FROM public.players p
LEFT JOIN club_uefa  uefa ON uefa.player_id = p.id
LEFT JOIN value_pts  val  ON val.player_id  = p.id
LEFT JOIN caps_pts   caps ON caps.player_id = p.id
LEFT JOIN minutes_pts mins ON mins.player_id = p.id;

COMMENT ON VIEW public.v_player_levels IS
  'Score composite 0-100 par joueur (lecture seule). Pondération : 40% tier UEFA club + 30% log(market_value) + 20% caps A COD + 10% minutes saison. Voir /methodologie pour la documentation publique. La donnée persistée vit dans players.level_score/level_band, mis à jour par refresh_player_levels().';

-- ── 3. Fonction de refresh ────────────────────────────────────────────────────

-- Appelée :
--   - Sans argument (NULL) : refresh global, depuis le cron quotidien GH Actions
--   - Avec target_player_id : refresh d'un seul joueur, depuis les triggers
--
-- SECURITY DEFINER pour que la fonction puisse écrire dans players
-- même si l'appelant RPC n'est que `anon` (depuis le script Python cron).
-- La fonction ne touche QUE level_score et level_band — pas d'effets de bord.

CREATE OR REPLACE FUNCTION public.refresh_player_levels(
  target_player_id bigint DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated integer;
BEGIN
  IF target_player_id IS NULL THEN
    -- Refresh global : recalcule uniquement les lignes dont le score ou la
    -- bande ont effectivement changé (IS DISTINCT FROM) pour minimiser les écritures.
    UPDATE public.players p
    SET
      level_score = v.level_score,
      level_band  = v.level_band
    FROM public.v_player_levels v
    WHERE p.id = v.id
      AND (
        p.level_score IS DISTINCT FROM v.level_score OR
        p.level_band  IS DISTINCT FROM v.level_band
      );
  ELSE
    -- Refresh ciblé : un seul joueur (appelé par le trigger INSERT/UPDATE)
    UPDATE public.players p
    SET
      level_score = v.level_score,
      level_band  = v.level_band
    FROM public.v_player_levels v
    WHERE p.id = v.id
      AND p.id = target_player_id;
  END IF;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END $$;

COMMENT ON FUNCTION public.refresh_player_levels IS
  'Recompute level_score / level_band. Sans argument → refresh global (cron quotidien). Avec target_player_id → refresh d''un seul joueur (trigger). Retourne le nombre de lignes modifiées.';

-- ── 4. Trigger ────────────────────────────────────────────────────────────────

-- Le trigger ne se déclenche que sur les 3 colonnes qui influencent le score :
--   market_value_eur, current_club_fk, season_minutes
-- Il ne réagit PAS à level_score / level_band pour éviter toute boucle infinie.
-- La condition DISTINCT FROM dans la fonction est une sécurité supplémentaire.

CREATE OR REPLACE FUNCTION public.trg_player_level_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Guard : ne refresh que si l'un des 3 inputs du score a vraiment changé.
  -- DISTINCT FROM gère correctement les NULL (NULL IS DISTINCT FROM 0 → true).
  IF (TG_OP = 'INSERT')
     OR (NEW.market_value_eur IS DISTINCT FROM OLD.market_value_eur)
     OR (NEW.current_club_fk  IS DISTINCT FROM OLD.current_club_fk)
     OR (NEW.season_minutes   IS DISTINCT FROM OLD.season_minutes)
  THEN
    PERFORM public.refresh_player_levels(NEW.id);
  END IF;
  RETURN NEW;
END $$;

-- DROP + CREATE pour garantir l'idempotence même si la colonne list change.
DROP TRIGGER IF EXISTS players_level_refresh_after ON public.players;

CREATE TRIGGER players_level_refresh_after
AFTER INSERT OR UPDATE OF market_value_eur, current_club_fk, season_minutes
ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.trg_player_level_refresh();

-- ── 5. Seed initial ───────────────────────────────────────────────────────────

-- Premier calcul global sur tous les joueurs déjà en base.
-- Le cron quotidien prend ensuite le relais pour les mises à jour incrémentales.
SELECT public.refresh_player_levels(NULL);
