/**
 * Store du flow guidé /ma-liste (type Typeform) — refonte 04/09.
 *
 * On persiste le système et les sélections par groupe (slugs). L'étape
 * courante reste locale au composant. Un lien de partage encode le tout.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Formation, GroupKey } from "@/components/ma-liste/guided/guidedGroups";

type Selections = Record<GroupKey, string[]>;

const EMPTY: Selections = { GK: [], RB: [], LB: [], CB: [], MID: [], ATT: [] };

interface GuidedState {
  formation: Formation | null;
  selections: Selections;
  setFormation: (f: Formation) => void;
  toggle: (group: GroupKey, slug: string) => void;
  isPicked: (group: GroupKey, slug: string) => boolean;
  countIn: (group: GroupKey) => number;
  totalPicked: () => number;
  reset: () => void;
  hydrate: (formation: Formation, selections: Selections) => void;
}

export const useGuidedStore = create<GuidedState>()(
  persist(
    (set, get) => ({
      formation: null,
      selections: { ...EMPTY },
      setFormation: (f) => set({ formation: f }),
      toggle: (group, slug) =>
        set((s) => {
          const cur = s.selections[group] ?? [];
          const next = cur.includes(slug)
            ? cur.filter((x) => x !== slug)
            : [...cur, slug];
          return { selections: { ...s.selections, [group]: next } };
        }),
      isPicked: (group, slug) => (get().selections[group] ?? []).includes(slug),
      countIn: (group) => (get().selections[group] ?? []).length,
      totalPicked: () =>
        Object.values(get().selections).reduce((n, arr) => n + arr.length, 0),
      reset: () => set({ formation: null, selections: { ...EMPTY } }),
      hydrate: (formation, selections) => set({ formation, selections }),
    }),
    { name: "leopards-maliste-guided-v1" },
  ),
);

// ── Partage par lien : encode { f, s } compact en base64 URL-safe ──────────
const GROUPS: GroupKey[] = ["GK", "RB", "LB", "CB", "MID", "ATT"];

export function encodeShare(formation: Formation, selections: Selections): string {
  const payload = {
    f: formation === "4-2-3-1" ? 1 : 0,
    s: GROUPS.map((g) => (selections[g] ?? []).join("~")).join("|"),
  };
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeShare(
  code: string,
): { formation: Formation; selections: Selections } | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    const p = JSON.parse(json) as { f: number; s: string };
    const parts = (p.s ?? "").split("|");
    const selections: Selections = { ...EMPTY };
    GROUPS.forEach((g, i) => {
      selections[g] = (parts[i] ?? "").split("~").filter(Boolean);
    });
    return { formation: p.f === 1 ? "4-2-3-1" : "4-3-3", selections };
  } catch {
    return null;
  }
}
