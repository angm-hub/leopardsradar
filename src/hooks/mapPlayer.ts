import type { Player, PositionCode, League, PlayerCategory, Foot } from "@/types/player";

// Loose row type — Supabase types are auto-generated and we want this resilient
// to either a flat 'players' row or one joined with 'clubs'.
export interface PlayerRow {
  slug: string;
  name: string;
  photo_url?: string | null;
  club_name?: string | null;
  club_logo_url?: string | null;
  league?: string | null;
  position: string;
  position_label?: string | null;
  age: number;
  matches?: number | null;
  goals?: number | null;
  assists?: number | null;
  minutes?: number | null;
  market_value_eur?: number | null;
  caps_rdc?: number | null;
  goals_rdc?: number | null;
  is_captain?: boolean | null;
  category: string;
  nationality_sport?: string | null;
  birth_place?: string | null;
  foot?: string | null;
  height_cm?: number | null;
  contract_until?: string | null;
  bio?: string | null;
  radar_reason?: string | null;
  radar_eligibility?: string | null;
  radar_sources?: { title: string; url: string }[] | null;
  clubs?: {
    name?: string | null;
    logo_url?: string | null;
    league?: string | null;
  } | null;
  season_stats?: {
    matches?: number;
    goals?: number;
    assists?: number;
    minutes?: number;
  } | null;
  selections_rdc?: {
    caps?: number;
    goals?: number;
  } | null;
}

const POSITION_LABEL: Record<PositionCode, string> = {
  GK: "Gardien",
  DEF: "Défenseur",
  MID: "Milieu",
  ATT: "Attaquant",
};

const fmt = (k: number) =>
  k >= 1000 ? `${(k / 1000).toFixed(k % 1000 === 0 ? 0 : 1)}M €` : `${k}K €`;

export function mapRowToPlayer(row: PlayerRow): Player {
  const position = (row.position as PositionCode) ?? "MID";
  const stats = row.season_stats ?? {
    matches: row.matches ?? 0,
    goals: row.goals ?? 0,
    assists: row.assists ?? 0,
    minutes: row.minutes ?? 0,
  };
  const marketValueEur = row.market_value_eur ?? 0;
  const capsRdc = row.selections_rdc?.caps ?? row.caps_rdc ?? 0;
  const goalsRdc = row.selections_rdc?.goals ?? row.goals_rdc ?? 0;

  return {
    slug: row.slug,
    name: row.name,
    photoUrl: row.photo_url ?? "",
    club: row.clubs?.name ?? row.club_name ?? "—",
    clubLogoUrl: row.clubs?.logo_url ?? row.club_logo_url ?? "",
    league: (row.clubs?.league ?? row.league ?? "Other") as League,
    position,
    positionLabel: row.position_label ?? POSITION_LABEL[position],
    age: row.age,
    stats: {
      matches: stats.matches ?? 0,
      goals: stats.goals ?? 0,
      assists: stats.assists ?? 0,
      minutes: stats.minutes ?? 0,
    },
    marketValueEur,
    marketValueDisplay: fmt(marketValueEur),
    capsRdc,
    goalsRdc,
    isCaptain: row.is_captain ?? false,
    category: (row.category as PlayerCategory) ?? "Roster",
    nationalitySport: row.nationality_sport ?? "RDC",
    birthPlace: row.birth_place ?? undefined,
    foot: (row.foot as Foot) ?? undefined,
    heightCm: row.height_cm ?? undefined,
    contractUntil: row.contract_until ?? undefined,
    bio: row.bio ?? undefined,
    radarReason: row.radar_reason ?? undefined,
    radarSources: row.radar_sources ?? undefined,
    radarEligibility: row.radar_eligibility ?? undefined,
  };
}
