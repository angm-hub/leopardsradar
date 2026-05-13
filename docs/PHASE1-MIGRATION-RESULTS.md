# Phase 1 — Résultats de migration (2026-05-14)

Migration appliquée par Claude via Supabase MCP sur le projet `pvpshyoaregroihwglye`.

## Schéma posé

| Migration | Status |
|-----------|--------|
| 01-eligibility-schema.sql (9 tables + indexes + RLS, sans policies admin) | OK |
| 02-seed-federations.sql (60 fédérations) | OK — 60 rows |
| 03-seed-leagues.sql (50+ championnats) | OK — 48 rows |
| 04-compute-eligibility.sql (fonction + 2 triggers) | OK |
| 05-data-nationality-basis.sql (BIRTH + UNKNOWN) | OK — 477 rows |
| 06-data-selections-rdc.sql (caps_rdc legacy) | OK — 64 rows |
| 07-data-selections-cap-tied.sql (10 cap-tied) | OK — 29 rows (multi-caps) |

## Recompute global

`SELECT public.recompute_all_eligibility()` → **477 joueurs** recalculés.

## Distribution des statuts calculés

| Status         | N   | Sens                                                                  |
|----------------|-----|-----------------------------------------------------------------------|
| `SELECTED`     | 64  | A déjà 1+ cap A officiel RDC (caps_rdc > 0)                           |
| `ELIGIBLE`     | 53  | Base juridique HIGH (BIRTH = né en RDC) sans engagement bloquant      |
| `POTENTIALLY`  | 350 | DR Congo dans nationalities mais base UNKNOWN (à instruire)           |
| `INELIGIBLE`   | 10  | Cap-tied confirmé : 5 par MAJOR_COMP, 2 par AGE >=21, 3 par 3+ caps   |

## Cas validés

| Joueur | Statut nouveau | Statut legacy | Confiance | Cohérence |
|--------|---------------|---------------|-----------|-----------|
| Yoane Wissa | SELECTED (BIRTH) | selected | HIGH | OK |
| Aaron Wan-Bissaka | SELECTED (UNKNOWN) | selected | HIGH | OK (caps_rdc > 0 court-circuite la check base) |
| Jeremy Ngakia | SELECTED (BIRTH) | selected | HIGH | OK |
| Ezri Konsa | INELIGIBLE (MAJOR_COMP_ENG) | ineligible | HIGH | OK |
| Jean-Philippe Mateta | INELIGIBLE (CAP_TIED_FRA_OFFICIAL_AGE_28) | ineligible | HIGH | OK |
| Moïse Bombito | INELIGIBLE (MAJOR_COMP_CAN) | ineligible | HIGH | OK |
| Orel Mangala | INELIGIBLE (CAP_TIED_BEL_OFFICIAL_AGE_25) | ineligible | HIGH | OK |
| Castello Lukeba | POTENTIALLY (UNKNOWN LOW) | potentially_eligible | LOW | OK |
| Roméo Lavia, Dilane Bakwa, Divin Mubama, Bitshiabu, Mbangula, Mayulu | POTENTIALLY (UNKNOWN LOW) | eligible | LOW | **Régression apparente** mais en réalité **plus rigoureuse** : ces joueurs étaient marqués `eligible` legacy sans documentation. Le nouveau système dit "POTENTIALLY = à instruire" tant qu'on n'a pas la preuve (FATHER/MOTHER/GRANDPARENT). C'est conforme au pacte éditorial "préférer un tiret à un zéro qui ment". |

## Distribution `nationality_basis` créées

| Confidence | Basis | N |
|------------|-------|---|
| HIGH | BIRTH | 112 |
| LOW | UNKNOWN | 365 |
| **Total COD** | | **477** |

→ Tous les 477 joueurs ont une base juridique RDC enregistrée. Les 365 UNKNOWN attendent l'enrichissement Transfermarkt + investigation manuelle pour basculer vers `FATHER`, `MOTHER`, `GRANDPARENT_*` avec confiance MEDIUM ou HIGH.

## Distribution `selections` créées

| Federation | Catégorie | Major comp | N |
|-----------|----------|-----------|---|
| COD | A_OFFICIAL | non | 64 |
| BEL | A_OFFICIAL | non | 18 |
| CHE | A_OFFICIAL | non | 5 |
| FRA | A_OFFICIAL | oui (Euro) | 2 |
| FRA | A_OFFICIAL | non (post-21) | 2 |
| CAN | A_OFFICIAL | oui (Copa) | 1 |
| ENG | A_OFFICIAL | oui (WC) | 1 |
| **Total** | | | **93** |

## Prochain travail nécessaire (Phase S3)

### Côté frontend
- Modifier `src/components/player/PlayerWhySection.tsx` pour afficher le bloc enrichi (bases / blockers / fenêtre switch / procédure FECOFA) en utilisant les nouvelles colonnes `players.computed_*`
- Ajouter filtre Radar "Statut switch FIFA" (Open / Conditional / Closed)
- Page dédiée `/eligibilite` (FAQ + matrice par profil)

### Côté data — passer de POTENTIALLY → ELIGIBLE pour les 350
Pour chaque profil POTENTIALLY, instruire la base juridique :
1. Lire la biographie Transfermarkt + Wikipedia FR/EN
2. Si parent/grand-parent RDC mentionné avec source → INSERT `nationality_basis` avec basis=FATHER/MOTHER/GRANDPARENT_* + confidence=MEDIUM (ou HIGH si source primaire)
3. Le trigger recalculera automatiquement le statut → POTENTIALLY → ELIGIBLE

Liste prioritaire (les 53 actuels ELIGIBLE + les 10 SWITCHABLE potentiels parmi les 350) à instruire en premier — environ 60-70 fiches manuelles, ~5 min par fiche → 5h de travail manuel.

### Côté GitHub Actions (Phase S2 d'origine)
Les workflows YAML sont en place dans `.github/workflows/`. Pour les activer il faut juste configurer 2 secrets :
- `SUPABASE_URL` = `https://pvpshyoaregroihwglye.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = à récupérer dans Supabase Dashboard → Project Settings → API

URL : https://github.com/angm-hub/leopardsradar/settings/secrets/actions

À partir de dimanche prochain 03:00 UTC, le cron tournera tout seul : refresh 200 profils Transfermarkt + sélections + recompute éligibilité.

---

*Migration produite le 14 mai 2026 via MCP Supabase. Voir `database/migrations/0[1-7]-*.sql` pour le détail SQL exécuté.*
