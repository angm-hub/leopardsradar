import type { DBPlayer, DBPosition } from "./dbPlayer";

/**
 * "Ma Liste des 26" types.
 *
 * NOTE: this feature uses the live database player shape (`DBPlayer` from
 * src/types/dbPlayer.ts), NOT the legacy mock `Player` type. Position values
 * therefore come from `DBPosition` ("Goalkeeper" | "Defender" | "Midfield" |
 * "Attack").
 */

export type Formation = "4-3-3" | "4-2-3-1" | "3-5-2";

// Tactical slot positions on the pitch
export type SlotPosition =
  | "GK"
  | "LB" | "LCB" | "CB" | "RCB" | "RB"
  | "LWB" | "RWB"
  | "CDM" | "LCM" | "CM" | "RCM" | "CAM"
  | "LM" | "RM"
  | "LW" | "ST" | "LST" | "RST" | "RW" | "CF";

export interface LineupSlot {
  position: SlotPosition;
  player: DBPlayer | null;
}

export interface UserListDraft {
  id?: string;
  sessionId: string;
  formation: Formation | null;
  startingXI: Record<string, DBPlayer | null>;
  bench: DBPlayer[];
  captain: DBPlayer | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  isSubmitted: boolean;
}

export interface ListInsights {
  radarCount: number;
  rosterCount: number;
  avgAge: number;
  totalMarketValueEur: number;
  captainPlayer: DBPlayer | null;
}

// Slot layout per formation (11 slots)
export const FORMATION_SLOTS: Record<Formation, SlotPosition[]> = {
  "4-3-3":   ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CM", "RCM", "LW", "ST", "RW"],
  "4-2-3-1": ["GK", "LB", "LCB", "RCB", "RB", "LCM", "RCM", "CAM", "LW", "ST", "RW"],
  "3-5-2":   ["GK", "LCB", "CB", "RCB", "LWB", "LCM", "CM", "RCM", "RWB", "LST", "RST"],
};

// Which DB position families fit each tactical slot
export const SLOT_COMPATIBILITY: Record<SlotPosition, DBPosition[]> = {
  GK: ["Goalkeeper"],
  LB: ["Defender"], LCB: ["Defender"], CB: ["Defender"], RCB: ["Defender"], RB: ["Defender"],
  LWB: ["Defender", "Midfield"], RWB: ["Defender", "Midfield"],
  CDM: ["Defender", "Midfield"], LCM: ["Midfield"], CM: ["Midfield"], RCM: ["Midfield"],
  CAM: ["Midfield", "Attack"],
  LM: ["Midfield"], RM: ["Midfield"],
  LW: ["Attack"], ST: ["Attack"], LST: ["Attack"], RST: ["Attack"], RW: ["Attack"], CF: ["Attack"],
};

// Bench requirements (15 players total: 11 starters + 15 bench = 26 squad)
export const BENCH_MIN_REQUIREMENTS = {
  Goalkeeper: 2, // 3 GK total in squad
  Defender: 3,
  Midfield: 2,
  Attack: 1,
  TOTAL: 15,
} as const;
