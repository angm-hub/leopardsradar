-- =====================================================================
-- Léopards Radar — Schema refondu pour détecteur d'éligibilité FIFA
-- Migration : 01-eligibility-schema.sql
-- Date      : 2026-05-13
-- Auteur    : Alexandre Ngomo (kAIra)
--
-- À exécuter dans Supabase (project Lovable : dpykmhmdgvmqcehjuusn)
-- via le SQL Editor du dashboard.
--
-- IDEMPOTENT : peut être rejoué sans casser l'existant.
-- =====================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. FÉDÉRATIONS — référentiel des sélections nationales
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.federations (
  code TEXT PRIMARY KEY,                    -- ISO-3 : 'COD', 'FRA', 'BEL'
  name TEXT NOT NULL,
  confederation TEXT,                       -- 'CAF', 'UEFA', 'CONMEBOL', 'AFC', 'CONCACAF', 'OFC'
  flag_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.federations IS 'Référentiel statique des fédérations nationales pour suivi sélections / éligibilité.';

-- ─────────────────────────────────────────────────────────────────────
-- 2. LEAGUES — référentiel championnats (premières équipes + réserves + jeunes)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leagues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,               -- 'ENG', 'FRA', 'COD'...
  tier_uefa INTEGER,                        -- 100 = Top 5 EU, 70 = sous-élite, 45 = autres
  competition_type TEXT NOT NULL,           -- 'first_team' | 'reserve' | 'u23' | 'u19' | 'u18' | 'youth_league'
  parent_competition TEXT,                  -- 'UEFA' | 'CAF' | 'CONMEBOL' | 'NATIONAL'
  transfermarkt_competition_id TEXT,        -- ex: 'GB1' pour Premier League
  football_data_id TEXT,                    -- ex: 'PL' pour football-data.org
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (country_code, name, competition_type)
);

CREATE INDEX IF NOT EXISTS idx_leagues_tier ON public.leagues(tier_uefa);
CREATE INDEX IF NOT EXISTS idx_leagues_country ON public.leagues(country_code);
CREATE INDEX IF NOT EXISTS idx_leagues_type ON public.leagues(competition_type);

COMMENT ON TABLE public.leagues IS 'Référentiel championnats — premières équipes, réserves, U23, U19, U18, Youth League. Remplace le hardcoding tier dans playerScores.ts.';

-- ─────────────────────────────────────────────────────────────────────
-- 3. CLUBS — entités normalisées (matching pour current_club texte)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clubs (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES public.leagues(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,            -- lowercase, sans accents, pour matching
  short_code TEXT,                          -- ex: 'PSG', 'RBL', 'CHE'
  country_code TEXT,
  transfermarkt_id TEXT,
  logo_url TEXT,
  is_reserve BOOLEAN DEFAULT FALSE,         -- équipe B / U23 / Primavera
  parent_club_id INTEGER REFERENCES public.clubs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name_normalized, league_id)
);

CREATE INDEX IF NOT EXISTS idx_clubs_league ON public.clubs(league_id);
CREATE INDEX IF NOT EXISTS idx_clubs_name_normalized ON public.clubs(name_normalized);
CREATE INDEX IF NOT EXISTS idx_clubs_transfermarkt ON public.clubs(transfermarkt_id);

COMMENT ON TABLE public.clubs IS 'Référentiel clubs normalisés. Permet de relier player.current_club (texte) à un club identifié + sa league + son tier.';

-- ─────────────────────────────────────────────────────────────────────
-- 4. PLAYER_CLUBS — historique de carrière par joueur
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_clubs (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  transfer_type TEXT,                       -- 'signed' | 'loan' | 'free' | 'youth' | 'return'
  date_from DATE NOT NULL,
  date_to DATE,                             -- NULL = club actuel
  fee_eur BIGINT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (player_id, club_id, date_from)
);

CREATE INDEX IF NOT EXISTS idx_player_clubs_player ON public.player_clubs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_clubs_club ON public.player_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_player_clubs_current ON public.player_clubs(player_id) WHERE date_to IS NULL;

COMMENT ON TABLE public.player_clubs IS 'Historique de carrière joueur → club avec dates, type de transfert, fee.';

-- ─────────────────────────────────────────────────────────────────────
-- 5. NATIONALITY_BASIS — base juridique de chaque nationalité
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nationality_basis (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  nationality_code TEXT NOT NULL,           -- 'COD', 'FRA', 'BEL'...
  basis TEXT NOT NULL,                      -- voir CHECK ci-dessous
  evidence_url TEXT,
  evidence_quote TEXT,                      -- extrait sourcé
  confidence TEXT NOT NULL DEFAULT 'LOW',   -- 'HIGH' | 'MEDIUM' | 'LOW'
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_basis CHECK (basis IN (
    'BIRTH',
    'FATHER',
    'MOTHER',
    'GRANDPARENT_PATERNAL_GRANDFATHER',
    'GRANDPARENT_PATERNAL_GRANDMOTHER',
    'GRANDPARENT_MATERNAL_GRANDFATHER',
    'GRANDPARENT_MATERNAL_GRANDMOTHER',
    'RESIDENCE_5Y',
    'NATURALIZATION',
    'UNKNOWN'
  )),
  CONSTRAINT chk_confidence CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  UNIQUE (player_id, nationality_code, basis)
);

CREATE INDEX IF NOT EXISTS idx_nat_basis_player ON public.nationality_basis(player_id);
CREATE INDEX IF NOT EXISTS idx_nat_basis_country ON public.nationality_basis(nationality_code);
CREATE INDEX IF NOT EXISTS idx_nat_basis_confidence ON public.nationality_basis(confidence);

COMMENT ON TABLE public.nationality_basis IS 'Base juridique de chaque nationalité d''un joueur (naissance, parent, grand-parent, résidence). Sourcée et notée par confiance.';

-- ─────────────────────────────────────────────────────────────────────
-- 6. SELECTIONS — historique des sélections internationales
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.selections (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  federation_code TEXT NOT NULL REFERENCES public.federations(code),
  category TEXT NOT NULL,                   -- voir CHECK ci-dessous
  competition TEXT,                         -- 'CDM 2026', 'CAN 2025', 'EURO U21', 'Friendly'
  is_major_competition BOOLEAN DEFAULT FALSE, -- CDM, qualif CDM, CAN/EURO/CONCACAF/Asie/Conmebol senior
  opponent TEXT,
  match_date DATE NOT NULL,
  played_minutes INTEGER,                   -- 0 = banc, 1+ = entré
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_category CHECK (category IN (
    'A_OFFICIAL',
    'A_FRIENDLY',
    'U23',
    'U21',
    'U20',
    'U19',
    'U18',
    'U17'
  ))
);

CREATE INDEX IF NOT EXISTS idx_selections_player ON public.selections(player_id);
CREATE INDEX IF NOT EXISTS idx_selections_federation ON public.selections(federation_code);
CREATE INDEX IF NOT EXISTS idx_selections_category ON public.selections(category);
CREATE INDEX IF NOT EXISTS idx_selections_player_fed_cat ON public.selections(player_id, federation_code, category);
CREATE INDEX IF NOT EXISTS idx_selections_major ON public.selections(player_id) WHERE is_major_competition = TRUE;

COMMENT ON TABLE public.selections IS 'Historique des sélections internationales par joueur, fédération, catégorie. Source de vérité pour cap-tying FIFA.';

-- ─────────────────────────────────────────────────────────────────────
-- 7. ELIGIBILITY_LOG — journal des changements de statut
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eligibility_log (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status_before TEXT,
  status_after TEXT NOT NULL,
  reason TEXT,
  triggered_by TEXT,                        -- 'auto_recompute' | 'manual_admin' | 'new_selection' | 'new_basis'
  source_url TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elig_log_player ON public.eligibility_log(player_id);
CREATE INDEX IF NOT EXISTS idx_elig_log_changed_at ON public.eligibility_log(changed_at DESC);

COMMENT ON TABLE public.eligibility_log IS 'Journal append-only des changements de statut d''éligibilité avec raison et trigger.';

-- ─────────────────────────────────────────────────────────────────────
-- 8. PLAYER_SNAPSHOTS — capture hebdo pour vrais deltas
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_snapshots (
  player_id INTEGER NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  market_value_eur BIGINT,
  current_club_id INTEGER REFERENCES public.clubs(id) ON DELETE SET NULL,
  season_games INTEGER,
  season_goals INTEGER,
  season_assists INTEGER,
  season_minutes INTEGER,
  caps_rdc INTEGER,
  eligibility_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (player_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_date ON public.player_snapshots(snapshot_date DESC);

COMMENT ON TABLE public.player_snapshots IS 'Snapshot hebdo (chaque dimanche) pour calculer les vrais deltas semaine-N vs semaine-N-1.';

-- ─────────────────────────────────────────────────────────────────────
-- 9. SYNC_LOGS — traçabilité des jobs GitHub Actions
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,                   -- 'sync-transfermarkt-rdc' | 'discover-candidates' | 'sync-leagues-secondary'
  status TEXT NOT NULL,                     -- 'success' | 'partial' | 'failure'
  players_processed INTEGER DEFAULT 0,
  players_updated INTEGER DEFAULT 0,
  candidates_discovered INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  github_run_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_job ON public.sync_logs(job_name, started_at DESC);

COMMENT ON TABLE public.sync_logs IS 'Logs des jobs GitHub Actions de synchronisation Transfermarkt et autres sources.';

-- ─────────────────────────────────────────────────────────────────────
-- 10. ENRICHISSEMENT TABLE PLAYERS — colonnes calculées
-- ─────────────────────────────────────────────────────────────────────
-- Ajout des colonnes structurées pour le détecteur (sans casser l'existant)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS computed_eligibility_status TEXT,    -- résultat de compute_eligibility()
  ADD COLUMN IF NOT EXISTS computed_eligibility_bases TEXT[],   -- ex: ['FATHER', 'GRANDPARENT_MATERNAL_GRANDMOTHER']
  ADD COLUMN IF NOT EXISTS computed_eligibility_blockers TEXT[],
  ADD COLUMN IF NOT EXISTS switch_window TEXT,                  -- 'OPEN' | 'CONDITIONAL' | 'CLOSED' | NULL
  ADD COLUMN IF NOT EXISTS switch_deadline DATE,
  ADD COLUMN IF NOT EXISTS computed_confidence TEXT,            -- 'HIGH' | 'MEDIUM' | 'LOW'
  ADD COLUMN IF NOT EXISTS computed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_club_id INTEGER REFERENCES public.clubs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_players_computed_status ON public.players(computed_eligibility_status);
CREATE INDEX IF NOT EXISTS idx_players_switch_window ON public.players(switch_window) WHERE switch_window IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_current_club_id ON public.players(current_club_id);

-- ─────────────────────────────────────────────────────────────────────
-- 11. RLS — Row Level Security policies
-- ─────────────────────────────────────────────────────────────────────
-- Lecture publique pour les référentiels et tables de domaine
ALTER TABLE public.federations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nationality_basis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DO $$ BEGIN
  CREATE POLICY "Federations publicly readable" ON public.federations FOR SELECT TO anon, authenticated USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Leagues publicly readable" ON public.leagues FOR SELECT TO anon, authenticated USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Clubs publicly readable" ON public.clubs FOR SELECT TO anon, authenticated USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Player clubs publicly readable" ON public.player_clubs FOR SELECT TO anon, authenticated USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Nationality basis with HIGH/MEDIUM confidence publicly readable" ON public.nationality_basis
    FOR SELECT TO anon, authenticated USING (confidence IN ('HIGH', 'MEDIUM'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Selections publicly readable" ON public.selections FOR SELECT TO anon, authenticated USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Eligibility_log : lecture admin only
DO $$ BEGIN
  CREATE POLICY "Eligibility log admin readable" ON public.eligibility_log FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sync logs : lecture admin only
DO $$ BEGIN
  CREATE POLICY "Sync logs admin readable" ON public.sync_logs FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Snapshots : lecture publique (utilisé pour deltas)
DO $$ BEGIN
  CREATE POLICY "Snapshots publicly readable" ON public.player_snapshots FOR SELECT TO anon, authenticated USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Écritures : service_role uniquement (les scripts GitHub Actions utilisent service_role key)
-- Pas de policy d'écriture pour anon/authenticated → écriture refusée par défaut sous RLS

COMMIT;

-- =====================================================================
-- FIN DE 01-eligibility-schema.sql
-- Vérifier après exécution :
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--    AND table_name IN ('federations','leagues','clubs','player_clubs',
--                       'nationality_basis','selections','eligibility_log',
--                       'player_snapshots','sync_logs');
-- → doit retourner 9 lignes.
-- =====================================================================
