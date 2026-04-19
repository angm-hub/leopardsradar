export type PositionCode = "GK" | "DEF" | "MID" | "ATT";

export type League =
  | "Premier League"
  | "Ligue 1"
  | "La Liga"
  | "Serie A"
  | "Bundesliga"
  | "Other Europe"
  | "Africa"
  | "Middle East"
  | "Other";

export type Foot = "Droit" | "Gauche" | "Les 2";

export type PlayerCategory = "Roster" | "Radar" | "Watch";

export interface PlayerStats {
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
}

export interface RadarSource {
  title: string;
  url: string;
}

export interface Player {
  slug: string;
  name: string;
  photoUrl: string;
  club: string;
  clubLogoUrl: string;
  league: League;
  position: PositionCode;
  positionLabel: string;
  age: number;
  stats: PlayerStats;
  marketValueEur: number; // in thousands
  marketValueDisplay: string;
  capsRdc: number;
  goalsRdc: number;
  isCaptain?: boolean;
  category: PlayerCategory;
  nationalitySport: string;
  birthPlace?: string;
  foot?: Foot;
  heightCm?: number;
  contractUntil?: string;
  bio?: string;
  radarReason?: string;
  radarSources?: RadarSource[];
  radarEligibility?: string;
}
