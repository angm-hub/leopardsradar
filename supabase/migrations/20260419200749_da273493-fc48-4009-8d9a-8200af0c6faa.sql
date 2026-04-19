
-- Extensions first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
-- TABLE: players
-- =========================================================
CREATE TABLE public.players (
  id BIGSERIAL PRIMARY KEY,
  transfermarkt_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  date_of_birth DATE,
  age INTEGER,
  place_of_birth TEXT,
  country_of_birth TEXT,
  height_cm INTEGER,
  position TEXT CHECK (position IN ('Goalkeeper','Defender','Midfield','Attack')),
  foot TEXT CHECK (foot IN ('left','right','both')),
  current_club TEXT,
  current_club_id TEXT,
  contract_expires DATE,
  on_loan_from TEXT,
  agent TEXT,
  is_binational BOOLEAN DEFAULT false,
  nationalities JSONB DEFAULT '[]'::jsonb,
  other_nationalities JSONB DEFAULT '[]'::jsonb,
  player_category TEXT CHECK (player_category IN ('roster','radar','heritage')),
  tier TEXT CHECK (tier IN ('tier1','tier2')),
  caps_rdc INTEGER DEFAULT 0,
  eligibility_status TEXT,
  eligibility_note TEXT,
  market_value_eur INTEGER,
  season_games INTEGER DEFAULT 0,
  season_goals INTEGER DEFAULT 0,
  season_assists INTEGER DEFAULT 0,
  season_minutes INTEGER DEFAULT 0,
  season_rating NUMERIC(3,2),
  source_urls TEXT[],
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_slug ON public.players(slug);
CREATE INDEX idx_players_category ON public.players(player_category);
CREATE INDEX idx_players_tier ON public.players(tier);
CREATE INDEX idx_players_position ON public.players(position);
CREATE INDEX idx_players_current_club ON public.players(current_club);
CREATE INDEX idx_players_name_trgm ON public.players USING GIN (name gin_trgm_ops);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are publicly viewable"
  ON public.players FOR SELECT
  USING (true);

-- timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VIEWS
-- =========================================================
CREATE OR REPLACE VIEW public.v_players_tier1
WITH (security_invoker = on) AS
SELECT * FROM public.players WHERE tier = 'tier1';

CREATE OR REPLACE VIEW public.v_home_stats
WITH (security_invoker = on) AS
SELECT
  COUNT(*)::int AS total_players,
  COUNT(*) FILTER (WHERE player_category = 'roster')::int AS total_roster,
  COUNT(*) FILTER (WHERE player_category = 'radar')::int AS total_radar,
  COUNT(*) FILTER (WHERE player_category = 'heritage')::int AS total_heritage,
  COUNT(DISTINCT current_club)::int AS total_clubs,
  COUNT(DISTINCT country_of_birth)::int AS total_countries,
  ROUND(AVG(age)::numeric, 1) AS avg_age,
  SUM(market_value_eur)::bigint AS total_market_value
FROM public.players;

-- =========================================================
-- TABLE: newsletter_subscribers (double opt-in)
-- =========================================================
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'website',
  confirmation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_token ON public.newsletter_subscribers(confirmation_token);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "No direct read of subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (false);

CREATE TRIGGER update_newsletter_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public-safe view exposing only the active subscriber count
CREATE OR REPLACE VIEW public.v_newsletter_count AS
SELECT COUNT(*)::int AS active_count
FROM public.newsletter_subscribers
WHERE is_active = true;

GRANT SELECT ON public.v_newsletter_count TO anon, authenticated;

-- =========================================================
-- STORAGE: player-photos bucket
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Player photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-photos');
