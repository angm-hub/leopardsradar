/**
 * useNavSectionVisibility — décide si une entrée de nav doit être affichée
 * en fonction du nombre d'éléments publiés dans sa section.
 *
 * Sprint 1.7 du brief 2026-05-15 : "Cacher de la navigation principale toute
 * section qui n'a pas de contenu publié. Garder la route active pour ne pas
 * casser les liens existants, mais retirer le lien de la nav."
 *
 * Seuils :
 *   - Best XI : ≥ 1 édition publiée
 *   - Histoires : ≥ 3 articles publiés
 *   - Revue de presse : ≥ 5 items
 *
 * Usage : import dans Navbar + Footer pour filtrer NAV_LINKS dynamiquement.
 *
 * Stratégie réseau : 1 seule query, 3 counts via une RPC SQL ou 3 appels
 * count head:true. Cache 10 min via React Query staleTime → cohérent avec
 * la cadence éditoriale (le contenu n'est pas posté toutes les minutes).
 * Optimistic default = tout affiché (pas de flicker au mount initial).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NavSectionVisibility {
  bestXI: boolean;
  histoires: boolean;
  presse: boolean;
}

const DEFAULT_VISIBILITY: NavSectionVisibility = {
  bestXI: true,
  histoires: true,
  presse: true,
};

const THRESHOLDS = {
  bestXI: 1,
  histoires: 3,
  presse: 5,
};

async function fetchCounts(): Promise<NavSectionVisibility> {
  // 3 count queries en parallèle — head: true ne ramène que le compteur,
  // pas les rows (zéro bandwidth).
  const [bestXIRes, articlesRes, pressRes] = await Promise.all([
    (supabase as any)
      .from("best_xi")
      .select("*", { count: "exact", head: true })
      .not("published_at", "is", null),
    (supabase as any)
      .from("articles")
      .select("*", { count: "exact", head: true })
      .not("published_at", "is", null),
    (supabase as any)
      .from("press_items")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    bestXI: (bestXIRes.count ?? 0) >= THRESHOLDS.bestXI,
    histoires: (articlesRes.count ?? 0) >= THRESHOLDS.histoires,
    presse: (pressRes.count ?? 0) >= THRESHOLDS.presse,
  };
}

export function useNavSectionVisibility(): NavSectionVisibility {
  const { data } = useQuery({
    queryKey: ["nav-section-visibility"],
    queryFn: fetchCounts,
    staleTime: 10 * 60 * 1000, // 10 min — cadence éditoriale
    gcTime: 30 * 60 * 1000,
    // Pas de refetchOnMount/Window : la nav doit être ultra-stable
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return data ?? DEFAULT_VISIBILITY;
}
