import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyPublicVisibilityFilter } from "@/lib/playerVisibility";

/**
 * useSwitchables — les joueurs encore basculables vers la RDC.
 *
 * Profils d'origine congolaise captés par un autre pays (souvent en sélection
 * de jeunes, ou par une cape A qui ne verrouille pas), donc éligibles au
 * changement d'association FIFA vers la RDC. C'est la donnée que ni
 * Transfermarkt ni Wyscout ne qualifient. Filtre de visibilité publique commun.
 */

export interface SwitchableRow {
  slug: string | null;
  name: string;
  current_club: string | null;
  current_club_id: string | null;
  position: string | null;
  position_detail: string | null;
  date_of_birth: string | null;
  market_value_eur: number | null;
  caps_other_country: string | null;
  nationalities: string[] | null;
  radar_tier: string | null;
}

export function useSwitchables() {
  const [rows, setRows] = useState<SwitchableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (supabase as any)
          .from("players")
          .select(
            "slug, name, current_club, current_club_id, position, position_detail, date_of_birth, market_value_eur, caps_other_country, nationalities, radar_tier",
          )
          .eq("computed_eligibility_status", "SWITCHABLE");
        q = applyPublicVisibilityFilter(q)
          .order("market_value_eur", { ascending: false, nullsFirst: false })
          .order("name", { ascending: true });
        const { data, error: qErr } = await q;
        if (qErr) throw qErr;
        if (!cancelled) setRows((data ?? []) as SwitchableRow[]);
      } catch (e) {
        console.error("[useSwitchables]", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, error };
}
