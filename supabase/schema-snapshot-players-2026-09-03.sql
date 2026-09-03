-- =====================================================================
-- SNAPSHOT DE REFERENCE — table public.players
-- Projet PROD : pvpshyoaregroihwglye  (source de verite du frontend)
-- Genere le 2026-09-03 par introspection catalogue (SCHEMA-1, audit 03/09).
--
-- CE N'EST PAS UNE MIGRATION A REJOUER. C'est un instantane fidele de
-- l'etat reel de la table en prod, capture parce que le dossier
-- supabase/migrations/ du repo est PERIME (voir supabase/SCHEMA-STATE.md).
-- Sert de reference lisible tant que la reconciliation CLI (`supabase db
-- pull`) n'a pas ete faite. Ne pas `db push` ce fichier.
-- =====================================================================

create table if not exists public.players (
  id bigint not null default nextval('players_id_seq'::regclass),
  transfermarkt_id text,
  name text not null,
  slug text,
  image_url text,
  date_of_birth date,
  age integer,
  place_of_birth text,
  country_of_birth text,
  height_cm integer,
  position text,
  foot text,
  current_club text,
  current_club_id text,
  contract_expires date,
  on_loan_from text,
  agent text,
  is_binational boolean default false,
  nationalities jsonb default '[]'::jsonb,
  other_nationalities jsonb default '[]'::jsonb,
  player_category text default 'radar'::text,
  tier text default 'tier2'::text,
  caps_rdc integer default 0,
  caps_other_country text,
  caps_other_count integer default 0,
  eligibility_status text default 'unknown'::text,
  eligibility_note text,
  market_value_eur integer,
  market_value_updated_at timestamptz,
  season_games integer default 0,
  season_goals integer default 0,
  season_assists integer default 0,
  season_minutes integer default 0,
  season_rating numeric(3,1),
  stats_updated_at timestamptz,
  source_urls text[],
  verified boolean default false,
  verified_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  image_url_alt text,
  computed_eligibility_status text,
  computed_eligibility_bases text[],
  computed_eligibility_blockers text[],
  switch_window text,
  switch_deadline date,
  computed_confidence text,
  computed_at timestamptz,
  current_club_fk integer,
  level_score smallint,
  level_band text,
  u17_caps integer default 0,
  u17_goals integer default 0,
  u17_source text,
  u20_caps integer default 0,
  u20_goals integer default 0,
  u20_source text,
  u23_caps integer default 0,
  u23_goals integer default 0,
  u23_source text,
  formation_country text,
  formation_club text,
  formation_academy boolean,
  moved_abroad_age integer,
  field_freshness jsonb default '{}'::jsonb,
  legacy_score numeric,
  profile_completeness integer default 0,
  fbref_id text,
  wikidata_id text,
  understat_id text,
  discovery_method text,
  archived boolean not null default false,
  editorial_note text,
  position_detail text,
  position_code text,
  prev_season_rating numeric,
  prev_season_games integer,
  prev_season_minutes integer,
  prev_season_label text,
  wikidata_checked_at timestamptz,
  apif_identity_checked_at timestamptz,
  season_tackles integer,
  season_interceptions integer,
  season_duels_won integer,
  season_duels_total integer,
  score_leopards numeric,
  score_pool text,
  score_band text,
  score_updated_at timestamptz,
  data_reliability text,
  fifa_country text,
  fifa_caps integer,
  fifa_id text,
  fifa_checked_at timestamptz,
  apf_player_id integer,
  apf_player_checked_at timestamptz,
  season_league text,
  season_league_country text,
  league_tier smallint,
  league_checked_at timestamptz,
  fotmob_checked_at timestamptz,
  sofascore_id text,
  sofascore_checked_at timestamptz,
  available_from date,
  first_other_cap_date date,
  first_other_cap_type text,
  wikidata_qid text,
  wikidata_citizenships text,
  wikidata_national_teams text,
  sofascore_stats jsonb,
  oms smallint,
  res smallint,
  radar_tier text,
  score_breakdown jsonb,
  scored_at timestamptz,
  scouting_priority smallint,
  scouting_breakdown jsonb,
  onomastic_score numeric,
  onomastic_verdict text,
  onomastic_token text,
  onomastic_computed_at timestamptz,
  lignee_transmission text,
  prenom_token text,
  prenom_providence boolean,
  constraint players_pkey primary key (id),
  constraint players_transfermarkt_id_key unique (transfermarkt_id),
  constraint players_current_club_fk_fkey foreign key (current_club_fk) references clubs(id) on delete set null,
  constraint players_eligibility_status_check check ((eligibility_status = any (array['selected'::text, 'eligible'::text, 'potentially_eligible'::text, 'ineligible'::text, 'unknown'::text]))),
  constraint players_foot_check check ((foot = any (array['left'::text, 'right'::text, 'both'::text, ''::text]))),
  constraint players_level_band_check check ((level_band = any (array['elite'::text, 'high'::text, 'mid'::text, 'developing'::text, 'watch'::text]))),
  constraint players_player_category_check check ((player_category = any (array['roster'::text, 'radar'::text, 'heritage'::text]))),
  constraint players_position_check check (("position" = any (array['Goalkeeper'::text, 'Defender'::text, 'Midfield'::text, 'Attack'::text]))),
  constraint players_tier_check check ((tier = any (array['tier1'::text, 'tier2'::text])))
);

-- --- Index ---
create index if not exists idx_players_archived on public.players using btree (archived) where (archived = true);
create index if not exists idx_players_binational on public.players using btree (is_binational);
create index if not exists idx_players_category on public.players using btree (player_category);
create index if not exists idx_players_club on public.players using btree (current_club);
create index if not exists idx_players_computed_status on public.players using btree (computed_eligibility_status);
create index if not exists idx_players_current_club_fk on public.players using btree (current_club_fk);
create index if not exists idx_players_current_club_id on public.players using btree (current_club_id);
create index if not exists idx_players_eligibility on public.players using btree (eligibility_status);
create index if not exists idx_players_fbref on public.players using btree (fbref_id) where (fbref_id is not null);
create index if not exists idx_players_formation_country on public.players using btree (formation_country) where (formation_country is not null);
create index if not exists idx_players_level_band on public.players using btree (level_band);
create index if not exists idx_players_level_score on public.players using btree (level_score desc nulls last);
create index if not exists idx_players_position on public.players using btree ("position");
create index if not exists idx_players_switch_window on public.players using btree (switch_window) where (switch_window is not null);
create index if not exists idx_players_tier on public.players using btree (tier);
create index if not exists idx_players_u20_caps on public.players using btree (u20_caps desc nulls last) where (coalesce(u20_caps, 0) > 0);
create index if not exists idx_players_understat on public.players using btree (understat_id) where (understat_id is not null);
create index if not exists idx_players_unverified_academy_scan on public.players using btree (discovery_method, verified) where ((discovery_method ~~ 'academy_scan%'::text) and (verified = false));
create index if not exists idx_players_wikidata on public.players using btree (wikidata_id) where (wikidata_id is not null);

-- --- RLS ---
alter table public.players enable row level security;
-- "Players are viewable by everyone" : SELECT, roles=public, using (true)
-- "Players are editable by authenticated users only" : ALL, roles=public, using (auth.role() = 'authenticated')

-- --- Triggers (fonctions definies dans leurs migrations respectives) ---
-- trigger_players_updated_at        BEFORE UPDATE            -> update_updated_at()
-- players_level_refresh_after       AFTER INSERT/UPDATE OF market_value_eur, current_club_fk, season_minutes -> trg_player_level_refresh()
-- trg_sync_legacy_eligibility       BEFORE INSERT OR UPDATE  -> sync_legacy_eligibility()   [PROD-1, migration 20260903175854]
