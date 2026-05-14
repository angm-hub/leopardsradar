// Mirror of the Supabase `players` table. We keep this app-side type
// because the auto-generated Database type is currently empty (the table
// was added after type generation).

export type DBPosition = "Goalkeeper" | "Defender" | "Midfield" | "Attack";
export type DBFoot = "left" | "right" | "both";
export type DBCategory = "roster" | "radar" | "heritage";
export type DBTier = "tier1" | "tier2";

// ──────────────────────────────────────────────────────────────────────
// New eligibility model (added 2026-05-14 with phase 1 schema rebuild)
// ──────────────────────────────────────────────────────────────────────

export type ComputedEligibilityStatus =
  | "SELECTED"
  | "ELIGIBLE"
  | "POTENTIALLY"
  | "SWITCHABLE"
  | "INELIGIBLE";

export type SwitchWindow = "OPEN" | "CONDITIONAL" | "CLOSED";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type Basis =
  | "BIRTH"
  | "FATHER"
  | "MOTHER"
  | "GRANDPARENT_PATERNAL_GRANDFATHER"
  | "GRANDPARENT_PATERNAL_GRANDMOTHER"
  | "GRANDPARENT_MATERNAL_GRANDFATHER"
  | "GRANDPARENT_MATERNAL_GRANDMOTHER"
  | "RESIDENCE_5Y"
  | "NATURALIZATION"
  | "UNKNOWN";

export type SelectionCategory =
  | "A_OFFICIAL"
  | "A_FRIENDLY"
  | "U23"
  | "U21"
  | "U20"
  | "U19"
  | "U18"
  | "U17";

export interface DBNationalityBasis {
  id: number;
  player_id: number;
  nationality_code: string;
  basis: Basis;
  evidence_url: string | null;
  evidence_quote: string | null;
  confidence: Confidence;
  verified_by: string | null;
  verified_at: string | null;
}

export interface DBSelection {
  id: number;
  player_id: number;
  federation_code: string;
  category: SelectionCategory;
  competition: string | null;
  is_major_competition: boolean;
  opponent: string | null;
  match_date: string;
  played_minutes: number | null;
  source_url: string | null;
  notes: string | null;
}

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
  // Phase 1 eligibility model — computed by Postgres function
  computed_eligibility_status?: ComputedEligibilityStatus | null;
  computed_eligibility_bases?: string[] | null;
  computed_eligibility_blockers?: string[] | null;
  switch_window?: SwitchWindow | null;
  switch_deadline?: string | null;
  computed_confidence?: Confidence | null;
  computed_at?: string | null;
  // Sprint 3 — Score composite de niveau de jeu (public, affiché sur fiche + cards)
  level_score?: number | null;
  level_band?: string | null;
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
