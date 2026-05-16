/**
 * Store Ma Liste v2 — version anti-friction.
 *
 * Différences vs maListeStore (v1) :
 * - Aucun step / wizard — la page est unique
 * - URL hash sync à chaque mutation (mode remix gratuit)
 * - Auto-save indicator (timestamp dernière sauvegarde locale)
 * - persist localStorage (clé v2 distincte)
 *
 * Cf. docs/DESIGN_MA_LISTE_V2.md pour la DA et les principes.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Formation, SlotPosition } from "@/types/maListe";
import type { DBPlayer } from "@/types/dbPlayer";
import { FORMATION_SLOTS } from "@/types/maListe";
import {
  encodeListToHash,
  decodeHashToList,
  syncUrlHash,
} from "@/lib/maListeUrlState";

interface MaListeV2State {
  // ---- State ----
  sessionId: string;
  formation: Formation;
  startingXI: Record<string, DBPlayer | null>;
  bench: DBPlayer[];
  captain: DBPlayer | null;
  lastSavedAt: number | null;
  // Pour le mode remix : marque "déjà chargé depuis URL"
  hydratedFromUrl: boolean;

  // ---- Actions ----
  setFormation: (formation: Formation) => void;
  placePlayerInSlot: (slot: SlotPosition, player: DBPlayer) => void;
  removePlayerFromSlot: (slot: SlotPosition) => void;
  addToBench: (player: DBPlayer) => void;
  removeFromBench: (slug: string) => void;
  setCaptain: (player: DBPlayer | null) => void;
  reset: () => void;
  hydrateFromUrl: (allPlayers: DBPlayer[]) => void;

  // ---- Computed ----
  getXICount: () => number;
  getBenchCount: () => number;
  isXIComplete: () => boolean;
  isBenchComplete: () => boolean;
  isComplete: () => boolean;
  getAvailablePlayers: (allPlayers: DBPlayer[]) => DBPlayer[];
  getPlayersInList: () => DBPlayer[];
}

const generateSessionId = () =>
  `v2-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const emptyXI = (formation: Formation): Record<string, DBPlayer | null> =>
  FORMATION_SLOTS[formation].reduce<Record<string, DBPlayer | null>>((acc, s) => {
    acc[s] = null;
    return acc;
  }, {});

const DEFAULT_FORMATION: Formation = "4-3-3";

export const useMaListeV2Store = create<MaListeV2State>()(
  persist(
    (set, get) => {
      // Sync URL hash après chaque mutation. Debounce minimal (next tick) pour
      // batcher si plusieurs mutations enchaînées dans le même cycle React.
      let urlSyncQueued = false;
      const queueUrlSync = () => {
        if (urlSyncQueued) return;
        urlSyncQueued = true;
        queueMicrotask(() => {
          urlSyncQueued = false;
          const s = get();
          const hash = encodeListToHash({
            formation: s.formation,
            startingXI: s.startingXI,
            bench: s.bench,
            captain: s.captain,
          });
          syncUrlHash(hash);
          set({ lastSavedAt: Date.now() });
        });
      };

      return {
        sessionId: generateSessionId(),
        formation: DEFAULT_FORMATION,
        startingXI: emptyXI(DEFAULT_FORMATION),
        bench: [],
        captain: null,
        lastSavedAt: null,
        hydratedFromUrl: false,

        setFormation: (formation) => {
          const cur = get();
          if (cur.formation === formation) return;
          // Préserve les joueurs sur les slots compatibles entre formations.
          // Tente de re-placer chaque joueur de l'XI actuel sur un slot de la
          // nouvelle formation par même nom de slot d'abord, sinon vide.
          const newXI = emptyXI(formation);
          const newSlots = FORMATION_SLOTS[formation];
          const unplaced: DBPlayer[] = [];
          for (const [oldSlot, p] of Object.entries(cur.startingXI)) {
            if (!p) continue;
            if (newSlots.includes(oldSlot as SlotPosition)) {
              newXI[oldSlot] = p;
            } else {
              unplaced.push(p);
            }
          }
          // Push les unplaced au banc (limite 15)
          const newBench = [...cur.bench, ...unplaced].slice(0, 15);
          set({ formation, startingXI: newXI, bench: newBench });
          queueUrlSync();
        },

        placePlayerInSlot: (slot, player) => {
          const cur = get();
          // Si le joueur est déjà dans bench, le retire
          const newBench = cur.bench.filter((b) => b.slug !== player.slug);
          // Si le joueur est déjà dans XI à un autre slot, le retire de là
          const newXI = { ...cur.startingXI };
          for (const [s, p] of Object.entries(newXI)) {
            if (p && p.slug === player.slug && s !== slot) {
              newXI[s] = null;
            }
          }
          newXI[slot] = player;
          // Si le capitaine était l'ancien joueur du slot, le retire
          const ousted = cur.startingXI[slot];
          const newCaptain =
            cur.captain && ousted && cur.captain.slug === ousted.slug ? null : cur.captain;
          set({ startingXI: newXI, bench: newBench, captain: newCaptain });
          queueUrlSync();
        },

        removePlayerFromSlot: (slot) => {
          const cur = get();
          const removed = cur.startingXI[slot];
          const newXI = { ...cur.startingXI, [slot]: null };
          const newCaptain =
            cur.captain && removed && cur.captain.slug === removed.slug ? null : cur.captain;
          set({ startingXI: newXI, captain: newCaptain });
          queueUrlSync();
        },

        addToBench: (player) => {
          const cur = get();
          if (cur.bench.length >= 15) return;
          if (cur.bench.some((b) => b.slug === player.slug)) return;
          // Si le joueur est dans XI, le retire d'abord
          const newXI = { ...cur.startingXI };
          for (const [s, p] of Object.entries(newXI)) {
            if (p && p.slug === player.slug) newXI[s] = null;
          }
          set({ bench: [...cur.bench, player], startingXI: newXI });
          queueUrlSync();
        },

        removeFromBench: (slug) => {
          const cur = get();
          const newCaptain = cur.captain?.slug === slug ? null : cur.captain;
          set({
            bench: cur.bench.filter((b) => b.slug !== slug),
            captain: newCaptain,
          });
          queueUrlSync();
        },

        setCaptain: (player) => {
          set({ captain: player });
          queueUrlSync();
        },

        reset: () => {
          set({
            sessionId: generateSessionId(),
            formation: DEFAULT_FORMATION,
            startingXI: emptyXI(DEFAULT_FORMATION),
            bench: [],
            captain: null,
            lastSavedAt: null,
            hydratedFromUrl: false,
          });
          syncUrlHash("");
        },

        hydrateFromUrl: (allPlayers) => {
          if (get().hydratedFromUrl) return;
          const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
          if (!hash) {
            set({ hydratedFromUrl: true });
            return;
          }
          const decoded = decodeHashToList(hash);
          if (!decoded || !decoded.formation) {
            set({ hydratedFromUrl: true });
            return;
          }
          const byId = new Map<number, DBPlayer>();
          for (const p of allPlayers) byId.set(p.id, p);
          const slots = FORMATION_SLOTS[decoded.formation];
          const newXI = emptyXI(decoded.formation);
          decoded.xiIds.forEach((pid, i) => {
            if (pid && slots[i]) {
              const player = byId.get(pid);
              if (player) newXI[slots[i]] = player;
            }
          });
          const benchPlayers = decoded.benchIds
            .map((id) => byId.get(id))
            .filter((p): p is DBPlayer => !!p)
            .slice(0, 15);
          const captain =
            (decoded.captainSlug &&
              [...Object.values(newXI), ...benchPlayers]
                .filter((p): p is DBPlayer => !!p)
                .find((p) => p.slug === decoded.captainSlug)) ||
            null;
          set({
            formation: decoded.formation,
            startingXI: newXI,
            bench: benchPlayers,
            captain,
            hydratedFromUrl: true,
          });
        },

        getXICount: () =>
          Object.values(get().startingXI).filter(Boolean).length,
        getBenchCount: () => get().bench.length,
        isXIComplete: () => {
          const s = get();
          return Object.values(s.startingXI).every((p) => p !== null);
        },
        isBenchComplete: () => get().bench.length === 15,
        isComplete: () => {
          const s = get();
          return s.isXIComplete() && s.isBenchComplete() && !!s.captain;
        },

        getAvailablePlayers: (allPlayers) => {
          const s = get();
          const inXI = new Set(
            Object.values(s.startingXI)
              .filter((p): p is DBPlayer => !!p)
              .map((p) => p.slug),
          );
          const inBench = new Set(s.bench.map((p) => p.slug));
          return allPlayers.filter((p) => !inXI.has(p.slug) && !inBench.has(p.slug));
        },

        getPlayersInList: () => {
          const s = get();
          const xi = Object.values(s.startingXI).filter((p): p is DBPlayer => !!p);
          return [...xi, ...s.bench];
        },
      };
    },
    {
      name: "leopards-ma-liste-v2",
      partialize: (s) => ({
        sessionId: s.sessionId,
        formation: s.formation,
        startingXI: s.startingXI,
        bench: s.bench,
        captain: s.captain,
        lastSavedAt: s.lastSavedAt,
      }),
    },
  ),
);
