/**
 * playerVisibility — Filtre commun pour les vues publiques du radar.
 *
 * Pourquoi : le job `discover-academies` (cron mensuel) insère en BDD ~600
 * candidats par mois issus des scans d'académies U17/U18/U19/U21 — tous en
 * `verified=false` avec `discovery_method='academy_scan_2026'`. Ces candidats
 * sont des "diaspora signal forts" (patronyme bantou + né en Europe + club
 * EU jeune) mais nécessitent une validation manuelle Alexandre AVANT
 * d'apparaître publiquement (risque crédibilité si on expose 600 U16
 * inconnus).
 *
 * Règle d'admission publique :
 *   1. archived IS NOT TRUE                    (toujours, sans exception)
 *   2. ET (discovery_method != 'academy_scan_2026'
 *          OU verified = true
 *          OU caps_rdc > 0)
 *
 * L'archive est un soft-delete edite par Alexandre quand un faux positif
 * est identifie (ex : 956 stubs polluants archives le 17/05/2026).
 *
 * Helper à appliquer à TOUTE query qui alimente le radar public, les listes
 * de Léopards, les Best XI, les histoires, etc. NE PAS appliquer dans les
 * écrans admin où on veut tout voir pour valider.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQuery = any;

export function applyPublicVisibilityFilter(query: SupabaseQuery): SupabaseQuery {
  // Clause AND : archives caches TOUJOURS (NULL ou false OK, true exclu).
  // PostgREST .not("archived", "is", true) couvre les 2 valeurs admises.
  return query
    .not("archived", "is", true)
    .or(
      "discovery_method.is.null," +
      "discovery_method.neq.academy_scan_2026," +
      "verified.eq.true," +
      "caps_rdc.gt.0",
    );
}
