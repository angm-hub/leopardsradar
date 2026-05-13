-- =====================================================================
-- Léopards Radar — Fonction compute_eligibility() + triggers
-- Migration : 04-compute-eligibility.sql
-- À exécuter APRÈS 03-seed-leagues.sql
--
-- IMPLÉMENTATION DES STATUTS FIFA art. 5-9 (refonte 2020 + amendements 2022)
--
-- Statuts retournés :
--   SELECTED      — déjà sélectionné en RDC A officiel
--   ELIGIBLE      — base juridique RDC + aucun engagement bloquant ailleurs
--   POTENTIALLY   — pas de base juridique confirmée, profil à instruire
--   SWITCHABLE    — engagé ailleurs mais conditions de switch FIFA réunies
--   INELIGIBLE    — verrou définitif (cap-tied)
-- =====================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- Type retour structuré
-- ─────────────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS public.eligibility_result CASCADE;

CREATE TYPE public.eligibility_result AS (
  status TEXT,                  -- 'SELECTED'|'ELIGIBLE'|'POTENTIALLY'|'SWITCHABLE'|'INELIGIBLE'
  bases TEXT[],                 -- liste codes basis ['FATHER', 'GRANDPARENT_MATERNAL_GRANDFATHER']
  blockers TEXT[],              -- liste verrous ['CAP_TIED_FRA_OFFICIAL_AGE_24', 'MAJOR_COMP_FRA_EURO_2024']
  switch_window TEXT,           -- 'OPEN' | 'CONDITIONAL' | 'CLOSED' | NULL
  switch_deadline DATE,         -- date après laquelle la fenêtre se ferme
  source_urls TEXT[],
  confidence TEXT,              -- 'HIGH' | 'MEDIUM' | 'LOW'
  procedure_summary TEXT
);

-- ─────────────────────────────────────────────────────────────────────
-- Fonction principale
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_eligibility(p_player_id INTEGER)
RETURNS public.eligibility_result
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result public.eligibility_result;
  v_player           RECORD;
  v_caps_rdc_a_off   INTEGER := 0;
  v_caps_other_a_off INTEGER := 0;
  v_caps_other_major INTEGER := 0;
  v_max_age_other_a  INTEGER := 0;
  v_last_other_a_date DATE;
  v_other_fed        TEXT;
  v_bases_count      INTEGER := 0;
  v_bases_high       INTEGER := 0;
  v_basis_list       TEXT[] := ARRAY[]::TEXT[];
  v_blockers         TEXT[] := ARRAY[]::TEXT[];
  v_sources          TEXT[] := ARRAY[]::TEXT[];
  v_three_years_after DATE;
BEGIN
  -- 0. Charger le joueur
  SELECT id, name, date_of_birth INTO v_player
  FROM public.players WHERE id = p_player_id;

  IF v_player IS NULL THEN
    result.status := 'POTENTIALLY';
    result.confidence := 'LOW';
    result.procedure_summary := 'Joueur introuvable.';
    RETURN result;
  END IF;

  -- 1. Compter les caps RDC A officielles
  SELECT COUNT(*) INTO v_caps_rdc_a_off
  FROM public.selections
  WHERE player_id = p_player_id
    AND federation_code = 'COD'
    AND category = 'A_OFFICIAL';

  -- 2. Si déjà sélectionné A officiel RDC → SELECTED, point final
  IF v_caps_rdc_a_off > 0 THEN
    result.status := 'SELECTED';
    result.confidence := 'HIGH';

    -- Charger les bases pour info
    SELECT array_agg(basis), array_agg(DISTINCT evidence_url) FILTER (WHERE evidence_url IS NOT NULL)
      INTO result.bases, result.source_urls
    FROM public.nationality_basis
    WHERE player_id = p_player_id AND nationality_code = 'COD';

    result.procedure_summary := format(
      'Membre confirmé du roster Léopards (%s sélection%s A officiel RDC).',
      v_caps_rdc_a_off,
      CASE WHEN v_caps_rdc_a_off > 1 THEN 's' ELSE '' END
    );
    RETURN result;
  END IF;

  -- 3. Charger les bases juridiques RDC
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE confidence = 'HIGH'),
    array_agg(basis ORDER BY
      CASE confidence WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END
    ),
    array_agg(DISTINCT evidence_url) FILTER (WHERE evidence_url IS NOT NULL)
  INTO v_bases_count, v_bases_high, v_basis_list, v_sources
  FROM public.nationality_basis
  WHERE player_id = p_player_id
    AND nationality_code = 'COD'
    AND confidence IN ('HIGH', 'MEDIUM');

  result.bases := COALESCE(v_basis_list, ARRAY[]::TEXT[]);
  result.source_urls := COALESCE(v_sources, ARRAY[]::TEXT[]);

  -- 4. Vérifier caps autres nations (A officiel + majeures)
  SELECT
    COUNT(*) FILTER (WHERE category = 'A_OFFICIAL'),
    COUNT(*) FILTER (WHERE is_major_competition = TRUE),
    COALESCE(MAX(EXTRACT(YEAR FROM AGE(match_date, v_player.date_of_birth))::INT), 0),
    MAX(match_date) FILTER (WHERE category = 'A_OFFICIAL')
  INTO v_caps_other_a_off, v_caps_other_major, v_max_age_other_a, v_last_other_a_date
  FROM public.selections
  WHERE player_id = p_player_id
    AND federation_code <> 'COD';

  -- Récupérer la fédération qui cap-tie (la plus représentée)
  SELECT federation_code INTO v_other_fed
  FROM public.selections
  WHERE player_id = p_player_id
    AND federation_code <> 'COD'
    AND category = 'A_OFFICIAL'
  GROUP BY federation_code
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- 5. Logique de décision
  -- ── 5a. INELIGIBLE — verrou définitif (FIFA art. 9)
  IF v_caps_other_major > 0 THEN
    result.status := 'INELIGIBLE';
    result.confidence := 'HIGH';
    v_blockers := array_append(v_blockers, format('MAJOR_COMP_%s', COALESCE(v_other_fed, 'OTHER')));
    result.blockers := v_blockers;
    result.procedure_summary := format(
      'Cap-tied : a participé à au moins une grande compétition (CDM/CAN/EURO/CONCACAF/Asie/Conmebol senior) avec %s. Switch FIFA impossible.',
      COALESCE(v_other_fed, 'autre nation')
    );
    RETURN result;
  END IF;

  IF v_max_age_other_a >= 21 AND v_caps_other_a_off >= 1 THEN
    result.status := 'INELIGIBLE';
    result.confidence := 'HIGH';
    v_blockers := array_append(v_blockers, format('CAP_TIED_%s_OFFICIAL_AGE_%s', COALESCE(v_other_fed, 'OTHER'), v_max_age_other_a));
    result.blockers := v_blockers;
    result.procedure_summary := format(
      'Cap-tied : %s match%s A officiel %s à %s ans. La règle FIFA <21 ans n''est plus remplie.',
      v_caps_other_a_off,
      CASE WHEN v_caps_other_a_off > 1 THEN 's' ELSE '' END,
      COALESCE(v_other_fed, 'autre nation'),
      v_max_age_other_a
    );
    RETURN result;
  END IF;

  IF v_caps_other_a_off >= 3 THEN
    result.status := 'INELIGIBLE';
    result.confidence := 'HIGH';
    v_blockers := array_append(v_blockers, format('CAP_TIED_%s_3PLUS_CAPS', COALESCE(v_other_fed, 'OTHER')));
    result.blockers := v_blockers;
    result.procedure_summary := format(
      '%s caps A officielles avec %s. Au-delà de 3 caps, le switch FIFA n''est plus possible.',
      v_caps_other_a_off,
      COALESCE(v_other_fed, 'autre nation')
    );
    RETURN result;
  END IF;

  -- ── 5b. SWITCHABLE — engagé mais switch possible
  IF v_bases_count > 0 AND v_caps_other_a_off > 0 THEN
    result.status := 'SWITCHABLE';
    result.confidence := CASE WHEN v_bases_high > 0 THEN 'HIGH' ELSE 'MEDIUM' END;
    v_three_years_after := v_last_other_a_date + INTERVAL '3 years';
    result.switch_window := 'CONDITIONAL';
    result.switch_deadline := NULL; -- pas de deadline stricte côté FIFA, mais 3 ans depuis dernier match
    v_blockers := array_append(v_blockers, format('CAP_OTHER_%s_PRE21_%sx', COALESCE(v_other_fed, 'OTHER'), v_caps_other_a_off));
    result.blockers := v_blockers;
    result.procedure_summary := format(
      'Switch FIFA possible. Conditions : %s caps A officielles avec %s avant 21 ans, pas de match majeur, base juridique RDC %s. Procédure : (1) accord écrit du joueur, (2) passeport RDC actif, (3) délai 3 ans depuis le dernier match (%s), (4) dossier déposé par la FECOFA à la FIFA.',
      v_caps_other_a_off,
      COALESCE(v_other_fed, 'autre nation'),
      CASE WHEN v_bases_high > 0 THEN 'confirmée' ELSE 'à confirmer' END,
      COALESCE(to_char(v_three_years_after, 'YYYY-MM-DD'), 'date inconnue')
    );
    RETURN result;
  END IF;

  -- ── 5c. ELIGIBLE — base juridique sans engagement bloquant
  IF v_bases_count > 0 THEN
    result.status := 'ELIGIBLE';
    result.confidence := CASE WHEN v_bases_high > 0 THEN 'HIGH' ELSE 'MEDIUM' END;
    result.switch_window := 'OPEN';
    result.procedure_summary := format(
      'Éligible RDC sans verrou. Procédure FECOFA : (1) accord écrit du joueur, (2) vérifier passeport RDC actif, (3) déposer demande FIFA 60j avant convocation. Bases juridiques documentées : %s.',
      array_to_string(v_basis_list, ', ')
    );
    RETURN result;
  END IF;

  -- ── 5d. POTENTIALLY — pas de base juridique confirmée
  result.status := 'POTENTIALLY';
  result.confidence := 'LOW';
  result.procedure_summary := 'Profil à instruire. Aucune base juridique RDC documentée à ce jour. Investigation requise (biographie, interviews, parents/grands-parents).';
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.compute_eligibility IS
'Calcule le statut d''éligibilité FIFA d''un joueur pour la RDC selon les Statuts FIFA art. 5-9 (refonte 2020 + amendements 2022). Retourne statut + bases + verrous + fenêtre switch + sources + confiance + procédure.';

-- ─────────────────────────────────────────────────────────────────────
-- Fonction pour persister le résultat dans players + log
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.persist_eligibility(p_player_id INTEGER, p_triggered_by TEXT DEFAULT 'auto_recompute')
RETURNS public.eligibility_result
LANGUAGE plpgsql
AS $$
DECLARE
  v_result public.eligibility_result;
  v_status_before TEXT;
BEGIN
  v_result := public.compute_eligibility(p_player_id);

  SELECT computed_eligibility_status INTO v_status_before
  FROM public.players WHERE id = p_player_id;

  UPDATE public.players SET
    computed_eligibility_status = v_result.status,
    computed_eligibility_bases = v_result.bases,
    computed_eligibility_blockers = v_result.blockers,
    switch_window = v_result.switch_window,
    switch_deadline = v_result.switch_deadline,
    computed_confidence = v_result.confidence,
    computed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_player_id;

  -- Log uniquement si changement de statut
  IF COALESCE(v_status_before, '') IS DISTINCT FROM v_result.status THEN
    INSERT INTO public.eligibility_log (
      player_id, status_before, status_after, reason, triggered_by
    ) VALUES (
      p_player_id,
      v_status_before,
      v_result.status,
      v_result.procedure_summary,
      p_triggered_by
    );
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.persist_eligibility IS
'Calcule + persiste le statut d''éligibilité dans players.computed_*. Log dans eligibility_log si changement.';

-- ─────────────────────────────────────────────────────────────────────
-- Fonction batch — recalcul massif (à appeler après import data)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recompute_all_eligibility()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_player_id INTEGER;
BEGIN
  FOR v_player_id IN SELECT id FROM public.players ORDER BY id
  LOOP
    PERFORM public.persist_eligibility(v_player_id, 'batch_recompute');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.recompute_all_eligibility IS
'Recalcule l''éligibilité de tous les joueurs. À appeler après une migration ou un grand changement de schéma. Retourne le nombre de joueurs traités.';

-- ─────────────────────────────────────────────────────────────────────
-- Triggers — recompute auto sur insert/update selections + nationality_basis
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_recompute_on_selection()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.persist_eligibility(NEW.player_id, 'new_selection');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_on_basis()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.persist_eligibility(NEW.player_id, 'new_basis');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recompute_eligibility_on_selection ON public.selections;
CREATE TRIGGER recompute_eligibility_on_selection
  AFTER INSERT OR UPDATE ON public.selections
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_on_selection();

DROP TRIGGER IF EXISTS recompute_eligibility_on_basis ON public.nationality_basis;
CREATE TRIGGER recompute_eligibility_on_basis
  AFTER INSERT OR UPDATE ON public.nationality_basis
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_on_basis();

COMMIT;

-- =====================================================================
-- TEST RAPIDE après exécution :
--
-- SELECT * FROM public.compute_eligibility(
--   (SELECT id FROM public.players WHERE slug = 'castello-lukeba')
-- );
--
-- → doit retourner status = 'ELIGIBLE' (1 cap France amical à 19 ans = pas cap-tying)
--   à condition d'avoir inséré la base juridique RDC + le cap France au préalable.
--
-- BATCH après import :
-- SELECT public.recompute_all_eligibility();
-- =====================================================================
