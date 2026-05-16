-- Sprint revue éditoriale par championnat (2026-05-16)
-- Ajoute deux colonnes pour la revue manuelle d'Alexandre :
--   archived       : soft delete pour les profils qui ne devraient pas être en BDD
--                    (faux positifs, doublons, joueurs non-RDC)
--   editorial_note : note libre d'Alexandre captée lors de la revue
--                    (ex: "joueur Angola pas RDC", "potentiel à suivre", etc.)

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS editorial_note text;

COMMENT ON COLUMN players.archived IS
  'Soft delete : profil masque du front, conserve en BDD pour traceability. '
  'Activé lors de la revue editoriale quand le profil est jugé non-pertinent.';

COMMENT ON COLUMN players.editorial_note IS
  'Note libre Alexandre, captee lors de la revue par championnat. '
  'Vise a tracer la decision (pourquoi confirme, pourquoi rejete).';

-- Index pour les queries front qui doivent exclure les archived
CREATE INDEX IF NOT EXISTS idx_players_archived
  ON players (archived) WHERE archived = TRUE;
