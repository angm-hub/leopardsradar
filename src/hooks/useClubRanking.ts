import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyPublicVisibilityFilter } from "@/lib/playerVisibility";

/**
 * useClubRanking — classe les clubs par nombre de joueurs du radar (visibles
 * publiquement). Agrégation côté client à partir d'une projection légère de
 * `players`, avec le même filtre de visibilité que le reste du radar.
 *
 * NB : on classe sur `current_club` (l'effectif actuel), pas sur le club
 * formateur : `formation_club` est vide en base. Un vrai classement des
 * académies formatrices viendra quand la donnée de formation sera remontée
 * (moteur de contribution). D'ici là, ce classement rend visible où se
 * concentre le vivier, ce qui fait remonter naturellement les clubs locaux RDC.
 */

export interface ClubRow {
  club: string;
  count: number;
  switchables: number;
  avgValueM: number | null;
  topValueM: number | null;
}

interface RawRow {
  current_club: string | null;
  market_value_eur: number | null;
  computed_eligibility_status: string | null;
}

// Faux-clubs et statuts sans club : jamais dans le classement.
const NON_CLUBS = new Set([
  "sans club",
  "unknown",
  "inconnu",
  "free agent",
  "sans contrat",
  "retired",
  "retraité",
  "n/a",
  "na",
  "-",
]);

// Préfixes de type de club retirés uniquement pour la CLÉ de regroupement,
// afin de fusionner "Maniema Union" et "AS Maniema Union". Le libellé affiché
// reste l'orthographe la plus fréquente.
const PREFIXES = ["as", "fc", "cs", "dc", "tp", "rc", "ac", "sc", "us", "cd", "sa"];

function normalizeKey(name: string): string {
  let s = name.trim().toLowerCase().replace(/\s+/g, " ");
  const first = s.split(" ")[0];
  if (PREFIXES.includes(first) && s.includes(" ")) {
    s = s.slice(first.length + 1);
  }
  return s;
}

export function useClubRanking() {
  const [rows, setRows] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const all: RawRow[] = [];
        // PostgREST plafonne à 1000 lignes : on pagine.
        for (let from = 0; ; from += 1000) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = (supabase as any)
            .from("players")
            .select("current_club, market_value_eur, computed_eligibility_status");
          q = applyPublicVisibilityFilter(q)
            .not("current_club", "is", null)
            .range(from, from + 999);
          const { data, error: qErr } = await q;
          if (qErr) throw qErr;
          const batch = (data ?? []) as RawRow[];
          all.push(...batch);
          if (batch.length < 1000) break;
        }
        if (cancelled) return;

        // Agrégation par clé normalisée.
        const acc = new Map<
          string,
          { labels: Map<string, number>; count: number; switchables: number; values: number[] }
        >();
        for (const r of all) {
          const raw = (r.current_club ?? "").trim();
          if (!raw) continue;
          if (NON_CLUBS.has(raw.toLowerCase())) continue;
          const key = normalizeKey(raw);
          if (!key) continue;
          let e = acc.get(key);
          if (!e) {
            e = { labels: new Map(), count: 0, switchables: 0, values: [] };
            acc.set(key, e);
          }
          e.count += 1;
          e.labels.set(raw, (e.labels.get(raw) ?? 0) + 1);
          if (r.computed_eligibility_status === "SWITCHABLE") e.switchables += 1;
          if (typeof r.market_value_eur === "number" && r.market_value_eur > 0) {
            e.values.push(r.market_value_eur);
          }
        }

        const out: ClubRow[] = [];
        for (const e of acc.values()) {
          // Libellé = orthographe la plus fréquente.
          let label = "";
          let best = -1;
          for (const [name, n] of e.labels) {
            if (n > best) {
              best = n;
              label = name;
            }
          }
          const avg = e.values.length
            ? e.values.reduce((a, b) => a + b, 0) / e.values.length
            : null;
          const top = e.values.length ? Math.max(...e.values) : null;
          out.push({
            club: label,
            count: e.count,
            switchables: e.switchables,
            avgValueM: avg != null ? Math.round((avg / 1_000_000) * 10) / 10 : null,
            topValueM: top != null ? Math.round((top / 1_000_000) * 10) / 10 : null,
          });
        }
        out.sort((a, b) => b.count - a.count || (b.topValueM ?? 0) - (a.topValueM ?? 0));
        if (!cancelled) setRows(out);
      } catch (e) {
        console.error("[useClubRanking]", e);
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
