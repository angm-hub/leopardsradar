CREATE TABLE IF NOT EXISTS public.staging_players_import (
  transfermarkt_id text,
  name text,
  slug text PRIMARY KEY,
  image_url text,
  date_of_birth date,
  age integer,
  place_of_birth text,
  country_of_birth text,
  height_cm integer,
  "position" text,
  foot text,
  current_club text,
  current_club_id text,
  contract_expires date,
  on_loan_from text,
  agent text,
  is_binational boolean,
  nationalities jsonb,
  other_nationalities jsonb,
  player_category text,
  tier text,
  caps_rdc integer,
  eligibility_status text,
  eligibility_note text,
  market_value_eur bigint,
  season_games integer,
  season_goals integer,
  season_assists integer,
  season_minutes integer,
  season_rating numeric,
  verified boolean
);

ALTER TABLE public.staging_players_import ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staging open all" ON public.staging_players_import FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.staging_players_import TO postgres, anon, authenticated, service_role;