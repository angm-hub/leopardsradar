-- Sprint diaspora jeunes — colonne discovery_method
-- Permet de tracer comment chaque joueur a été ajouté en BDD.
-- Notamment pour filtrer du front les candidats `academy_scan_2026`
-- non encore vérifiés par Alexandre.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS discovery_method text;

COMMENT ON COLUMN players.discovery_method IS
  'Méthode d''insertion : NULL (legacy), rdc_pool, linafoot, wikidata, '
  'surname_eu, comprehensive_a/b/c/d, academy_scan_2026, manual_insertion.';

-- Index partiel : on requête souvent les unverified academy_scan pour validation
CREATE INDEX IF NOT EXISTS idx_players_unverified_academy_scan
  ON players (discovery_method, verified)
  WHERE discovery_method LIKE 'academy_scan%' AND verified = FALSE;

-- Backfill : marquer les insertions Munongo et Nzamu Ena comme manuelles
UPDATE players
  SET discovery_method = 'manual_insertion'
  WHERE transfermarkt_id IN ('1297673', '1472856')
    AND discovery_method IS NULL;
