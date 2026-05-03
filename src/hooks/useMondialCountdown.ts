import { useEffect, useState } from "react";

/**
 * Mondial 2026 — coup d'envoi officiel : 11 juin 2026 (Mexico City).
 *
 * Source : FIFA, fixtures officiels publiés en décembre 2025 après le tirage.
 * On stocke la date en UTC midi (12:00) pour éviter les pirouettes timezone
 * autour des changements de jour.
 */
const KICKOFF_ISO = "2026-06-11T17:00:00Z"; // 11 juin 2026 — Mexico City inaugural
const TOURNAMENT_END_ISO = "2026-07-19T23:00:00Z"; // 19 juillet 2026 — finale

export type MondialPhase = "before" | "during" | "after";

export interface MondialCountdown {
  /** Days until kickoff. 0 the day of, negative once started. */
  daysUntilKickoff: number;
  /** Pre-formatted French date "11 juin 2026". */
  kickoffDateLabel: string;
  /** Where we are in the Mondial timeline. */
  phase: MondialPhase;
  /** ISO date the user can copy/share. */
  kickoffIso: string;
}

/**
 * useMondialCountdown — single source of truth for the Mondial 2026 timeline.
 *
 * Used by the promo banner, the home hero, and (later) any "tournament status"
 * widget. Keeping it in one hook avoids the repeated date-math drift that
 * killed the original "471 talents" hardcoded copy.
 */
export function useMondialCountdown(): MondialCountdown {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    // Re-tick once an hour. The countdown changes at most once per day so
    // we don't need a tighter cadence — and we avoid forcing a re-render
    // every second on every page that consumes the hook.
    const id = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const kickoffMs = new Date(KICKOFF_ISO).getTime();
  const endMs = new Date(TOURNAMENT_END_ISO).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilKickoff = Math.ceil((kickoffMs - now) / msPerDay);

  let phase: MondialPhase = "before";
  if (now > endMs) phase = "after";
  else if (now >= kickoffMs) phase = "during";

  return {
    daysUntilKickoff,
    kickoffDateLabel: "11 juin 2026",
    kickoffIso: KICKOFF_ISO,
    phase,
  };
}
