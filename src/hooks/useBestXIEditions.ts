import { useEffect, useState } from "react";
// Utilise le même client Supabase que useBestXI — pas de doublon de connexion.
import { supabase } from "@/integrations/supabase/client";

export interface BestXIEdition {
  id: string;
  edition: number | null;
  formation: string | null;
  published_at: string | null;
  title: string | null;
  editorial_note: string | null;
}

/**
 * Charge les 6 dernières éditions publiées du Best XI.
 *
 * WHY : on exclut l'édition courante (index 0) pour n'afficher que
 * l'historique. Si moins de 2 entrées reviennent, la section doit être
 * masquée côté affichage — ce hook renvoie un tableau vide dans ce cas.
 *
 * Si la table best_xi n'existe pas ou renvoie une erreur, le hook silences
 * l'erreur et renvoie [] pour ne pas casser la page.
 */
export function useBestXIEditions() {
  const [editions, setEditions] = useState<BestXIEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("best_xi")
          .select("id, edition, formation, published_at, title, editorial_note")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(6);

        if (cancelled) return;

        if (error || !data || data.length < 2) {
          // Moins de 2 résultats : pas d'historique à afficher.
          setEditions([]);
          return;
        }

        // Index 0 = édition courante → on la saute.
        setEditions((data as BestXIEdition[]).slice(1));
      } catch {
        // Silencieux : la section disparaît simplement si Supabase est KO.
        if (!cancelled) setEditions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { editions, loading };
}
