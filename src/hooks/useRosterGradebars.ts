import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PlayerGradebars } from "@/hooks/usePlayerGradebars";

/**
 * useRosterGradebars — percentiles (empreintes) de plusieurs joueurs en un
 * minimum d'appels, pour le mode « Empreintes » du roster.
 *
 * Appelle la RPC batch get_players_gradebars (même vérité que la fiche, donc
 * auto-fraîche) par paquets de 60 slugs, et renvoie une Map slug -> gradebars.
 * Le composant carte n'affiche jamais de case vide : un slug absent de la Map
 * n'a simplement pas d'empreinte calculable.
 */

const CHUNK = 60;

interface BatchRow extends PlayerGradebars {
  slug: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useRosterGradebars(slugs: string[]) {
  const key = useMemo(() => slugs.slice().sort().join(","), [slugs]);
  const [map, setMap] = useState<Map<string, PlayerGradebars>>(new Map());
  const [loading, setLoading] = useState(false);
  const cache = useRef<Map<string, PlayerGradebars>>(new Map());

  useEffect(() => {
    if (slugs.length === 0) {
      setMap(new Map());
      return;
    }
    let cancelled = false;
    const missing = slugs.filter((s) => !cache.current.has(s));

    if (missing.length === 0) {
      setMap(new Map(cache.current));
      return;
    }

    setLoading(true);
    (async () => {
      try {
        await Promise.all(
          chunk(missing, CHUNK).map(async (grp) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any).rpc(
              "get_players_gradebars",
              { p_slugs: grp },
            );
            if (error) throw error;
            for (const row of (data as BatchRow[]) ?? []) {
              if (row?.slug) {
                cache.current.set(row.slug, {
                  pool_label: row.pool_label,
                  axes: row.axes,
                });
              }
            }
          }),
        );
        if (!cancelled) setMap(new Map(cache.current));
      } catch (e) {
        console.error("[useRosterGradebars]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { gradebarsBySlug: map, loading };
}
