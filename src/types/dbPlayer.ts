// Mirror of the Supabase `players` table. We keep this app-side type
// because the auto-generated Database type is currently empty (the table
// was added after type generation).

export type DBPosition = "Goalkeeper" | "Defender" | "Midfield" | "Attack";
export type DBFoot = "left" | "right" | "both";
export type DBCategory = "roster" | "radar" | "heritage";
export type DBTier = "tier1" | "tier2";

export interface DBPlayer {
  id: number;
  transfermarkt_id: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  /** Fallback URL when image_url 404/403 — populated by the multi-source
   * backfill (Wikipedia EN/FR pageimages, Wikidata P18). */
  image_url_alt?: string | null;
  date_of_birth: string | null;
  age: number | null;
  place_of_birth: string | null;
  country_of_birth: string | null;
  height_cm: number | null;
  position: DBPosition | null;
  foot: DBFoot | null;
  current_club: string | null;
  current_club_id: string | null;
  contract_expires: string | null;
  on_loan_from: string | null;
  agent: string | null;
  is_binational: boolean | null;
  nationalities: string[];
  other_nationalities: string[];
  player_category: DBCategory;
  tier: DBTier | null;
  caps_rdc: number;
  eligibility_status: string | null;
  eligibility_note: string | null;
  market_value_eur: number | null;
  season_games: number;
  season_goals: number;
  season_assists: number;
  season_minutes: number;
  season_rating: number | null;
  source_urls: string[] | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeStats {
  total_players: number | null;
  total_countries: number | null;
  total_clubs: number | null;
  avg_age: number | null;
  total_market_value: number | null;
  tier1_count: number | null;
  roster_count: number | null;
  radar_count: number | null;
  heritage_count: number | null;
  ineligible_count: number | null;
}
