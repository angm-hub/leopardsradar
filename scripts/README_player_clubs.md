# Léopards Radar — Backfill `player_clubs` (Sprint 2)

## Objectif

Enrichir la fiche joueur avec une frise de carrière historique. Pour chaque
joueur prioritaire, on scrape la page "career history" Transfermarkt et on
stocke chaque passage en club dans la table `player_clubs`. Le composant
`PlayerCareerTimeline.tsx` lit ces données et les affiche sur la fiche.

---

## Périmètre : 165 joueurs prioritaires

Le script traite par défaut les **165 joueurs prioritaires** :

- **Roster** : tous les joueurs de la sélection nationale actuelle RDC
- **Top 100 radar** : les 100 joueurs radar triés par `market_value_eur DESC`

Ce périmètre correspond à l'essentiel des fiches visitées. Les ~900 joueurs
radar restants peuvent être traités ultérieurement via `--all-players`.

**Étendre le périmètre :**

```bash
# Traiter tous les joueurs (batch de 500 max par run)
python backfill_player_clubs.py --all-players --batch-size 500

# Traiter un sous-ensemble spécifique (ex: 300 joueurs)
python backfill_player_clubs.py --all-players --batch-size 300
```

---

## Mapping Transfermarkt → schéma `player_clubs`

| Colonne `player_clubs` | Source TM | Notes |
|------------------------|-----------|-------|
| `player_id` | `players.id` | FK vers players |
| `club_id` | `clubs.id` | Résolu par TM ID du club, créé à la volée si absent |
| `transfer_type` | Icône/titre dans le tableau carrière | Voir table ci-dessous |
| `date_from` | Colonne "From" du tableau | ISO `YYYY-MM-DD`, `07-01` si seul l'année est dispo |
| `date_to` | Colonne "To" du tableau | `NULL` si club actuel |
| `fee_eur` | Colonne "Transfer fee" | `NULL` si free/prêt/non renseigné |
| `source_url` | URL de la page leistungsdaten | Tracabilité |

**Types de transfert normalisés :**

| Label TM | Valeur stockée |
|----------|---------------|
| Transfer | `transfer` |
| Free Transfer / Free Agent | `free` |
| Loan Transfer | `loan` |
| End of Loan / Return from Loan | `return` |
| Youth | `youth` |
| Promotion | `promotion` |

---

## Idempotence et re-runs

Le script est **strictement idempotent** : chaque passage est UPSERT'd sur la
contrainte `UNIQUE (player_id, club_id, date_from)` (index `player_clubs_unique_passage`).

Rejouer le script ne crée pas de doublons. Si Transfermarkt met à jour une valeur
(ex: fee confirmé après rumeur), le UPDATE sur conflit met à jour la ligne existante.

```bash
# Re-run complet sans risque
python backfill_player_clubs.py

# Re-run en dry-run pour vérifier sans écrire
python backfill_player_clubs.py --dry-run
```

---

## Corriger manuellement un passage erroné

**Corriger un fee ou un type de transfert :**

```sql
UPDATE public.player_clubs
SET fee_eur = 25000000,
    transfer_type = 'transfer'
WHERE player_id = (SELECT id FROM players WHERE slug = 'joueur-slug')
  AND club_id   = (SELECT id FROM clubs WHERE transfermarkt_id = '123456')
  AND date_from = '2022-07-01';
```

**Supprimer un passage fantôme :**

```sql
DELETE FROM public.player_clubs
WHERE player_id = (SELECT id FROM players WHERE slug = 'joueur-slug')
  AND date_from = '2015-07-01'
  AND club_id   = (SELECT id FROM clubs WHERE name_normalized = 'nom-du-club');
```

**Voir l'historique d'un joueur :**

```sql
SELECT
  p.name,
  c.name AS club,
  pc.transfer_type,
  pc.date_from,
  pc.date_to,
  pc.fee_eur
FROM player_clubs pc
JOIN players p ON p.id = pc.player_id
JOIN clubs   c ON c.id = pc.club_id
WHERE p.slug = 'joueur-slug'
ORDER BY pc.date_from DESC;
```

---

## Performance attendue

- **165 joueurs** × ~5 passages par joueur = **~825 lignes** dans `player_clubs`
  après un backfill complet
- Durée typique : 15-25 minutes (rate-limit 1s/joueur + parsing + créations
  de clubs éventuelles)
- Clubs créés à la volée : quelques dizaines (clubs peu connus absents de
  `sync-clubs` car non liés à un joueur dans `players.current_club`)

**Requête de vérification post-backfill :**

```sql
SELECT
  COUNT(*) AS total_passages,
  COUNT(DISTINCT player_id) AS joueurs_enrichis,
  COUNT(DISTINCT club_id) AS clubs_uniques,
  MIN(date_from) AS passage_le_plus_ancien,
  MAX(date_from) AS passage_le_plus_recent
FROM public.player_clubs;
```

---

## Workflow GitHub Actions

Le job `backfill-player-clubs.yml` tourne **chaque mardi à 02h UTC**, en
cascade après `sync-clubs` du lundi (03h). Cette séquence garantit que les
clubs sont en base avant que le backfill ne tente de les résoudre.

**Déclencher manuellement (dry-run recommandé pour le premier run) :**

1. GitHub → Actions → "Backfill Player Clubs"
2. "Run workflow" → `dry_run = true` → Run
3. Vérifier les logs (nombre de passages trouvés, clubs créés à la volée)
4. Si OK → re-lancer avec `dry_run = false`

**Premier run recommandé :**

```
dry_run      = true    → vérification sans écriture
priority_only = true   → 165 joueurs seulement
batch_size   = 165     → défaut
```

Puis si le dry-run valide les données :

```
dry_run      = false
priority_only = true
batch_size   = 165
```
