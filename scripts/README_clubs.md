# Référentiel clubs — Sprint 1

## Objectif

Transformer les ~250 chaînes texte dans `players.current_club` en entités
normalisées dans la table `clubs`, puis poser une vraie FK numérique
`players.current_club_fk → clubs.id` pour chaque joueur.

Ce référentiel est la base qui permettra aux composants frontend (PlayerCard,
RosterPlayer, RadarCanvas) d'afficher logo, ligue et tier d'un club de façon
fiable, sans dépendre d'une string fragile.

---

## Mapping source → cible

| Source (`players`) | Cible (`clubs`) | Notes |
|--------------------|-----------------|-------|
| `current_club` (TEXT) | `clubs.name` | Nom normalisé Transfermarkt après fetch |
| `current_club_id` (TEXT TM ID) | `clubs.transfermarkt_id` | Clé de déduplication |
| TM `/startseite/verein/{id}` → pays | `clubs.country_code` | ISO2 — `TM_COUNTRY_TO_ISO2` dans sync_clubs.py |
| TM `/wettbewerb/{comp_id}` | `leagues.transfermarkt_competition_id` → `clubs.league_id` | NULL si compétition hors référentiel |
| TM `img.data-header__profile-image` | `clubs.logo_url` | CDN Transfermarkt |
| Regex `RESERVE_KEYWORDS` sur le nom | `clubs.is_reserve` | U21, U23, II, Reserves, etc. |
| `clubs.id` (après upsert) | `players.current_club_fk` (INT) | FK posée par le backfill en étape 5 |

---

## Comment relancer le sync manuellement

### Via GitHub Actions (recommandé)

1. Aller sur l'onglet **Actions** du repo
2. Sélectionner **Sync Clubs (référentiel)**
3. Cliquer **Run workflow**
4. Options disponibles :
   - `dry_run: true` → affiche sans écrire, idéal pour vérifier avant un vrai run
   - `force_full_resync: true` → refetch Transfermarkt même pour les clubs déjà en base
   - `no_search: true` → saute la recherche pour les clubs sans TM ID (plus rapide, réduit le risque de ban)

### En local

```bash
cd scripts
pip install -r requirements.txt

# Dry-run (aucune écriture BDD)
python sync_clubs.py --dry-run

# Run normal (upsert + backfill FK)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python sync_clubs.py

# Full resync (refetch TM même pour les clubs existants)
python sync_clubs.py --force-resync

# Sans recherche (seulement les clubs avec TM ID connu)
python sync_clubs.py --no-search
```

---

## Override manuel d'un club mal matché

Si `sync_clubs.py` a associé un club à la mauvaise ligue, ou si le nom
normalisé est incorrect, Alexandre peut corriger directement via Supabase.

### Corriger la ligue d'un club

```sql
-- 1. Trouver l'ID du club concerné
SELECT id, name, league_id, transfermarkt_id
FROM clubs
WHERE name ILIKE '%Nom du Club%';

-- 2. Trouver l'ID de la bonne ligue
SELECT id, name, country_code, transfermarkt_competition_id
FROM leagues
WHERE name ILIKE '%Nom de la Ligue%';

-- 3. Corriger la FK league_id
UPDATE clubs
SET league_id = <id_ligue_correcte>,
    updated_at = now()
WHERE id = <id_club>;
```

### Corriger le pays d'un club

```sql
UPDATE clubs
SET country_code = 'FR',   -- remplacer par le code ISO2 correct
    updated_at = now()
WHERE transfermarkt_id = '12345';
```

### Forcer la FK d'un joueur vers un club corrigé

```sql
-- Si current_club_fk d'un joueur pointe vers le mauvais club
UPDATE players
SET current_club_fk = <id_club_correct>
WHERE id = <id_joueur>;
```

### Vérifier l'état du backfill

```sql
-- Joueurs avec current_club mais sans current_club_fk
SELECT COUNT(*)
FROM players
WHERE current_club IS NOT NULL
  AND current_club_fk IS NULL;

-- Détail des clubs non matchés
SELECT DISTINCT current_club, current_club_id
FROM players
WHERE current_club IS NOT NULL
  AND current_club_fk IS NULL
ORDER BY current_club;
```

---

## Transition `current_club_id` (TEXT) → `current_club_fk` (INT)

La migration se fait en deux temps pour éviter de casser le frontend
pendant le backfill.

### État actuel (Sprint 1)

- `players.current_club_id` : **TEXT** contenant l'ID Transfermarkt (ex: `"27259"`)
  — champ existant utilisé par le frontend comme string
- `players.current_club_fk` : **INT FK** vers `clubs.id`
  — nouveau champ posé par la migration `2026_05_15_players_current_club_fk.sql`

Les deux colonnes coexistent. Le frontend lit encore `current_club_id` (TEXT).

### Renommage final (à faire après validation du backfill)

Une fois que `SELECT COUNT(*) FROM players WHERE current_club IS NOT NULL AND current_club_fk IS NULL` retourne 0 (ou un nombre acceptable) :

```sql
-- Étape finale — à exécuter manuellement via Supabase MCP après validation
ALTER TABLE public.players DROP COLUMN current_club_id;
ALTER TABLE public.players RENAME COLUMN current_club_fk TO current_club_id;
ALTER INDEX idx_players_current_club_fk RENAME TO idx_players_current_club_id;
```

Puis mettre à jour les types TypeScript :
- `src/types/dbPlayer.ts` → `current_club_id: number | null`
- `src/integrations/supabase/types.ts` → `current_club_id: number | null`

---

## Stats prévisionnelles

- **~250 clubs distincts** dans `players.current_club` au lancement du Sprint 1
- **~200 clubs avec TM ID** (`players.current_club_id` non null) → fetch direct
- **~50 clubs sans TM ID** → recherche schnellsuche TM (peut échouer)
- **Taux de match attendu** : ~80-85% (clubs hors TM ou peu connus → unmatched)
- **Clubs avec `league_id` NULL** : clubs africains, ligues hors référentiel (normal)

Les clubs non matchés sont loggués dans `sync_logs.error_details.unmatched_clubs`
et peuvent être traités manuellement via les requêtes SQL ci-dessus.

---

## Voir aussi

- Migration FK : `scripts/migrations/2026_05_15_players_current_club_fk.sql`
- Hook frontend : `src/hooks/useClubInfo.ts`
- Script principal : `scripts/sync_clubs.py`
- Workflow GH : `.github/workflows/sync-clubs.yml`
- Référentiel leagues : `database/migrations/03-seed-leagues.sql`
