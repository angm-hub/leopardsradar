import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Formation, SlotPosition } from "@/types/maListe";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import { FORMATION_SLOTS } from "@/types/maListe";

export type Step =
  | "intro"
  | "formation"
  | "lineup"
  | "bench"
  | "captain"
  | "recap"
  | "share";

interface MaListeState {
  // ---- State ----
  sessionId: string;
  formation: Formation | null;
  startingXI: Record<string, DBPlayer | null>;
  bench: DBPlayer[];
  captain: DBPlayer | null;
  email: string | null;
  currentStep: Step;

  // ---- Actions ----
  setFormation: (formation: Formation) => void;
  placePlayerInSlot: (slot: SlotPosition, player: DBPlayer) => void;
  removePlayerFromSlot: (slot: SlotPosition) => void;
  addToBench: (player: DBPlayer) => void;
  removeFromBench: (slug: string) => void;
  setCaptain: (player: DBPlayer) => void;
  setEmail: (email: string) => void;
  goToStep: (step: Step) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;

  // ---- Computed ----
  getPlayersInStartingXI: () => DBPlayer[];
  getAvailablePlayers: (allPlayers: DBPlayer[]) => DBPlayer[];
  getStartingXICount: () => number;
  getBenchCount: () => number;
  isStartingXIComplete: () => boolean;
  isBenchComplete: () => boolean;
  canProceedToCaptain: () => boolean;
}

const STEP_ORDER: Step[] = [
  "intro",
  "formation",
  "lineup",
  "bench",
  "captain",
  "recap",
  "share",
];

const generateSessionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const createEmptyStartingXI = (
  formation: Formation | null,
): Record<string, DBPlayer | null> => {
  if (!formation) return {};
  return FORMATION_SLOTS[formation].reduce<Record<string, DBPlayer | null>>(
    (acc, slot) => {
      acc[slot] = null;
      return acc;
    },
    {},
  );
};

const positionFamily = (pos: DBPosition | null): DBPosition | null => pos;

export const useMaListeStore = create<MaListeState>()(
  persist(
    (set, get) => ({
      sessionId: generateSessionId(),
      formation: null,
      startingXI: {},
      bench: [],
      captain: null,
      email: null,
      currentStep: "intro",

      setFormation: (formation) => {
        set({
          formation,
          startingXI: createEmptyStartingXI(formation),
          bench: [],
          captain: null,
        });
      },

      placePlayerInSlot: (slot, player) => {
        set((state) => {
          // Strip the player from bench if present
          const newBench = state.bench.filter((p) => p.slug !== player.slug);
          // Strip the player from any other XI slot
          const newXI: Record<string, DBPlayer | null> = { ...state.startingXI };
          for (const key of Object.keys(newXI)) {
            if (newXI[key]?.slug === player.slug) newXI[key] = null;
          }
          newXI[slot] = player;
          return { startingXI: newXI, bench: newBench };
        });
      },

      removePlayerFromSlot: (slot) => {
        set((state) => ({
          startingXI: { ...state.startingXI, [slot]: null },
        }));
      },

      addToBench: (player) => {
        set((state) => {
          if (state.bench.length >= 15) return state;
          if (state.bench.some((p) => p.slug === player.slug)) return state;
          // Strip from XI if present
          const newXI: Record<string, DBPlayer | null> = { ...state.startingXI };
          for (const key of Object.keys(newXI)) {
            if (newXI[key]?.slug === player.slug) newXI[key] = null;
          }
          return {
            bench: [...state.bench, player],
            startingXI: newXI,
          };
        });
      },

      removeFromBench: (slug) => {
        set((state) => ({
          bench: state.bench.filter((p) => p.slug !== slug),
        }));
      },

      setCaptain: (player) => set({ captain: player }),
      setEmail: (email) => set({ email }),
      goToStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const idx = STEP_ORDER.indexOf(get().currentStep);
        if (idx < STEP_ORDER.length - 1) {
          set({ currentStep: STEP_ORDER[idx + 1] });
        }
      },

      previousStep: () => {
        const idx = STEP_ORDER.indexOf(get().currentStep);
        if (idx > 0) set({ currentStep: STEP_ORDER[idx - 1] });
      },

      reset: () => {
        set({
          sessionId: generateSessionId(),
          formation: null,
          startingXI: {},
          bench: [],
          captain: null,
          email: null,
          currentStep: "intro",
        });
      },

      // ---- Computed ----
      getPlayersInStartingXI: () =>
        Object.values(get().startingXI).filter(
          (p): p is DBPlayer => p !== null,
        ),

      getAvailablePlayers: (allPlayers) => {
        const used = new Set<string>();
        for (const p of get().getPlayersInStartingXI()) used.add(p.slug);
        for (const p of get().bench) used.add(p.slug);
        return allPlayers.filter((p) => !used.has(p.slug));
      },

      getStartingXICount: () => get().getPlayersInStartingXI().length,
      getBenchCount: () => get().bench.length,
      isStartingXIComplete: () => get().getPlayersInStartingXI().length === 11,

      isBenchComplete: () => {
        const bench = get().bench;
        if (bench.length !== 15) return false;
        const counts: Record<DBPosition, number> = {
          Goalkeeper: 0,
          Defender: 0,
          Midfield: 0,
          Attack: 0,
        };
        for (const p of bench) {
          const fam = positionFamily(p.position);
          if (fam) counts[fam]++;
        }
        return (
          counts.Goalkeeper >= 2 &&
          counts.Defender >= 3 &&
          counts.Midfield >= 2 &&
          counts.Attack >= 1
        );
      },

      canProceedToCaptain: () =>
        get().isStartingXIComplete() && get().isBenchComplete(),
    }),
    {
      name: "ma-liste-storage",
      partialize: (state) => ({
        sessionId: state.sessionId,
        formation: state.formation,
        startingXI: state.startingXI,
        bench: state.bench,
        captain: state.captain,
        email: state.email,
        currentStep: state.currentStep,
      }),
    },
  ),
);
