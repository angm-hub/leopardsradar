-- Léopards Radar — Migration : table caps_audit_findings
--
-- À appliquer via Supabase MCP apply_migration AVANT de lancer audit_caps_consistency.py.
--
-- Objectif : tracer les écarts entre p.caps_rdc (compteur dénormalisé) et le
-- nombre réel de sélections dans la table `selections`. Ces écarts indiquent
-- soit une erreur de saisie, soit des sélections manquantes à backfiller.
--
-- Index :
--   - idx_caps_audit_player  → jointure rapide avec players
--   - idx_caps_audit_status  → filtre admin sur les "pending" non revus

CREATE TABLE IF NOT EXISTS caps_audit_findings (
  id                   BIGSERIAL PRIMARY KEY,
  player_id            BIGINT REFERENCES players(id) ON DELETE CASCADE,
  audit_date           DATE DEFAULT CURRENT_DATE,
  cached_caps          INT,
  real_selections_count INT,
  gap                  INT,
  status               TEXT DEFAULT 'pending'
                         CHECK (status IN ('pending', 'reviewed', 'fixed')),
  reviewed_by          TEXT,
  reviewed_at          TIMESTAMPTZ,
  note                 TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caps_audit_player
  ON caps_audit_findings (player_id);

CREATE INDEX IF NOT EXISTS idx_caps_audit_status
  ON caps_audit_findings (status);

COMMENT ON TABLE caps_audit_findings IS
  'Écarts détectés entre players.caps_rdc et le vrai COUNT de selections. '
  'Alimenté par audit_caps_consistency.py (job hebdo lundi 05h UTC).';

COMMENT ON COLUMN caps_audit_findings.cached_caps IS
  'Valeur de players.caps_rdc au moment de l''audit';

COMMENT ON COLUMN caps_audit_findings.real_selections_count IS
  'COUNT(selections) filtré sur federation_code=COD et category IN (A_OFFICIAL, A_FRIENDLY)';

COMMENT ON COLUMN caps_audit_findings.gap IS
  'ABS(cached_caps - real_selections_count). Seuil d''alerte : > 2.';

COMMENT ON COLUMN caps_audit_findings.status IS
  'pending = à vérifier manuellement | reviewed = vu, pas encore corrigé | fixed = corrigé';
