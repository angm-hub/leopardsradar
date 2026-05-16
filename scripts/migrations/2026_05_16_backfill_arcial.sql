-- Backfill discovery_method='manual_insertion' pour Arcial Nzamu Ena (id 2683)
-- Inséré post-migration discovery_method donc backfill manqué de justesse.
UPDATE players
  SET discovery_method = 'manual_insertion'
  WHERE transfermarkt_id = '1472856'
    AND discovery_method IS NULL;
