/**
 * Store Ma Liste v2 — modèle simple "convocation des 26".
 *
 * Pivot 2026-05-16 : abandonne le wizard formation/slots positionnels.
 * Modèle = juste 2 listes (starters ≤11 + bench ≤15) + capitaine.
 *
 * - Pas de wizard
 * - URL hash sync (mode remix gratuit)
 * - Auto-save localStorage (persist Zustand)
 * - Pas de mapping positions sur pitch
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DBPlayer } from "@/types/dbPlayer";

const MAX_STARTERS = 11;
const MAX_BENCH = 15;

interface MaListeV2State {
  sessionId: string;
  starters: DBPlayer[];
  bench: DBPlayer[];
  captain: DBPlayer | null;
  lastSavedAt: number | null;
  hydratedFromUrl: boolean;

  // Actions
  addToStarters: (player: DBPlayer) => boolean;
  addToBench: (player: DBPlayer) => boolean;
  removePlayer: (slug: string) => void;
  toggleStatus: (slug: string) => void; // starter <-> bench
  setCaptain: (player: DBPlayer | null) => void;
  reset: () => void;
  hydrateFromUrl: (allPlayers: DBPlayer[]) => void;

  // Computed
  getAllPicked: () => DBPlayer[];
  isPicked: (slug: string) => boolean;
  isStarter: (slug: string) => boolean;
  getStartersCount: () => number;
  getBenchCount: () => number;
  isStartersComplete: () => boolean;
  isBenchComplete: () => boolean;
  isComplete: () => boolean;
  getAvailablePlayers: (allPlayers: DBPlayer[]) => DBPlayer[];
}

const generateSessionId = () =>
  `v2-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const SEP_SECT = ".";
const SEP_PLAYER = "-";
const CAP_PREFIX = "cap=";

function encodeListToHash(s: MaListeV2State): string {
  const startersPart = s.starters.map((p) => p.id.toString(36)).join(SEP_PLAYER);
  const benchPart = s.bench.map((p) => p.id.toString(36)).join(SEP_PLAYER);
  const capPart = s.captain ? `${CAP_PREFIX}${s.captain.slug}` : "";
  return [startersPart || "_", benchPart || "_", capPart].filter(Boolean).join(SEP_SECT);
}

function decodeHash(hash: string, byId: Map<number, DBPlayer>) {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!clean) return null;
  const parts = clean.split(SEP_SECT);
  const starterIds = parts[0] === "_" || !parts[0] ? [] : parts[0].split(SEP_PLAYER);
  const benchIds = parts[1] === "_" || !parts[1] ? [] : parts[1].split(SEP_PLAYER);
  const capPart = parts.find((p) => p.startsWith(CAP_PREFIX));
  const captainSlug = capPart ? capPart.slice(CAP_PREFIX.length) : null;

  const starters = starterIds
    .map((s) => byId.get(parseInt(s, 36)))
    .filter((p): p is DBPlayer => !!p)
    .slice(0, MAX_STARTERS);
  const bench = benchIds
    .map((s) => byId.get(parseInt(s, 36)))
    .filter((p): p is DBPlayer => !!p)
    .slice(0, MAX_BENCH);
  const all = [...starters, ...bench];
  const captain = captainSlug ? all.find((p) => p.slug === captainSlug) : null;
  return { starters, bench, captain: captain ?? null };
}

function syncUrl(hash: string) {
  if (typeof window === "undefined") return;
  const newUrl = hash ? `#${hash}` : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

export const useMaListeV2Store = create<MaListeV2State>()(
  persist(
    (set, get) => {
      let urlSyncQueued = false;
      const queueUrlSync = () => {
        if (urlSyncQueued) return;
        urlSyncQueued = true;
        queueMicrotask(() => {
          urlSyncQueued = false;
          const s = get();
          syncUrl(encodeListToHash(s));
          set({ lastSavedAt: Date.now() });
        });
      };

      return {
        sessionId: generateSessionId(),
        starters: [],
        bench: [],
        captain: null,
        lastSavedAt: null,
        hydratedFromUrl: false,

        addToStarters: (player) => {
          const s = get();
          if (s.starters.length >= MAX_STARTERS) return false;
          if (s.isPicked(player.slug)) {
            // Si dans bench, le déplace vers starters
            if (s.bench.some((b) => b.slug === player.slug)) {
              set({
                bench: s.bench.filter((b) => b.slug !== player.slug),
                starters: [...s.starters, player],
              });
              queueUrlSync();
              return true;
            }
            return false;
          }
          set({ starters: [...s.starters, player] });
          queueUrlSync();
          return true;
        },

        addToBench: (player) => {
          const s = get();
          if (s.bench.length >= MAX_BENCH) return false;
          if (s.isPicked(player.slug)) {
            // Si dans starters, déplace vers bench
            if (s.starters.some((b) => b.slug === player.slug)) {
              set({
                starters: s.starters.filter((b) => b.slug !== player.slug),
                bench: [...s.bench, player],
              });
              queueUrlSync();
              return true;
            }
            return false;
          }
          set({ bench: [...s.bench, player] });
          queueUrlSync();
          return true;
        },

        removePlayer: (slug) => {
          const s = get();
          const newCaptain = s.captain?.slug === slug ? null : s.captain;
          set({
            starters: s.starters.filter((p) => p.slug !== slug),
            bench: s.bench.filter((p) => p.slug !== slug),
            captain: newCaptain,
          });
          queueUrlSync();
        },

        toggleStatus: (slug) => {
          const s = get();
          if (s.starters.some((p) => p.slug === slug)) {
            // starter -> bench (si banc plein, no-op)
            if (s.bench.length >= MAX_BENCH) return;
            const p = s.starters.find((p) => p.slug === slug)!;
            set({
              starters: s.starters.filter((p) => p.slug !== slug),
              bench: [...s.bench, p],
            });
            queueUrlSync();
          } else if (s.bench.some((p) => p.slug === slug)) {
            // bench -> starter (si starters plein, no-op)
            if (s.starters.length >= MAX_STARTERS) return;
            const p = s.bench.find((p) => p.slug === slug)!;
            set({
              bench: s.bench.filter((p) => p.slug !== slug),
              starters: [...s.starters, p],
            });
            queueUrlSync();
          }
        },

        setCaptain: (player) => {
          set({ captain: player });
          queueUrlSync();
        },

        reset: () => {
          set({
            sessionId: generateSessionId(),
            starters: [],
            bench: [],
            captain: null,
            lastSavedAt: null,
            hydratedFromUrl: false,
          });
          syncUrl("");
        },

        hydrateFromUrl: (allPlayers) => {
          if (get().hydratedFromUrl) return;
          const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
          if (!hash) {
            set({ hydratedFromUrl: true });
            return;
          }
          const byId = new Map<number, DBPlayer>(allPlayers.map((p) => [p.id, p]));
          const decoded = decodeHash(hash, byId);
          if (!decoded) {
            set({ hydratedFromUrl: true });
            return;
          }
          set({ ...decoded, hydratedFromUrl: true });
        },

        getAllPicked: () => {
          const s = get();
          return [...s.starters, ...s.bench];
        },
        isPicked: (slug) => {
          const s = get();
          return s.starters.some((p) => p.slug === slug) || s.bench.some((p) => p.slug === slug);
        },
        isStarter: (slug) => get().starters.some((p) => p.slug === slug),
        getStartersCount: () => get().starters.length,
        getBenchCount: () => get().bench.length,
        isStartersComplete: () => get().starters.length === MAX_STARTERS,
        isBenchComplete: () => get().bench.length === MAX_BENCH,
        isComplete: () => {
          const s = get();
          return s.isStartersComplete() && s.isBenchComplete() && !!s.captain;
        },
        getAvailablePlayers: (allPlayers) => {
          const picked = new Set(get().getAllPicked().map((p) => p.slug));
          return allPlayers.filter((p) => !picked.has(p.slug));
        },
      };
    },
    {
      name: "leopards-ma-liste-v2",
      partialize: (s) => ({
        sessionId: s.sessionId,
        starters: s.starters,
        bench: s.bench,
        captain: s.captain,
        lastSavedAt: s.lastSavedAt,
      }),
    },
  ),
);

export { MAX_STARTERS, MAX_BENCH };
