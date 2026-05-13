# Léopards Radar — Build kit Phase 1

Date : 2026-05-13 (révisé 2026-05-14)
Auteur : Alexandre Ngomo (kAIra)

Ce dossier contient **tout ce qu'il faut pour exécuter la Phase 1** de la roadmap (audit + addendum 0€) : schéma Supabase refondu, migration des données existantes, scrapers Transfermarkt en GitHub Actions, fonction `compute_eligibility` FIFA. Coût : **0€**.

---

## Arbre du dossier

```
build-2026-05-13/
├── README.md                          ← tu es ici
├── schema/                            ← À coller dans Supabase SQL Editor (dans l'ordre)
│   ├── 01-eligibility-schema.sql      ← 9 tables + indexes + RLS
│   ├── 02-seed-federations.sql        ← Référentiel fédérations CAF/UEFA/CONMEBOL/AFC/CONCACAF
│   ├── 03-seed-leagues.sql            ← 50+ championnats avec tier UEFA + IDs Transfermarkt/football-data
│   └── 04-compute-eligibility.sql     ← Fonction Postgres + triggers auto-recompute
├── scripts/                           ← À copier dans le repo `angm-hub/leopardsradar` sous `/scripts/`
│   ├── requirements.txt               ← deps Python (requests, beautifulsoup4, lxml)
│   ├── supabase_client.py             ← Wrapper REST Supabase
│   ├── transfermarkt_client.py        ← Scraper TM (rate-limit 3sec, 10 user-agents)
│   ├── migrate_existing_players.py    ← Migration one-shot des 467 joueurs legacy
│   ├── sync_transfermarkt.py          ← Job cron hebdo (200 joueurs/run)
│   └── discover_candidates.py         ← Job cron mensuel (50 nouveaux/run max)
└── workflows/                         ← À copier dans `.github/workflows/` du repo
    ├── sync-transfermarkt.yml         ← Cron dimanche 03:00 UTC
    └── discover-candidates.yml        ← Cron 1er dimanche du mois 04:00 UTC
```

---

## Plan d'exécution — 5 étapes, 1 à 2 heures total

### Étape 1 — Coller les 4 SQL dans Supabase (Lovable project)

1. Ouvrir le dashboard Supabase Lovable (project ID : `dpykmhmdgvmqcehjuusn`)
2. Aller dans **SQL Editor** → New query
3. Coller et exécuter **dans l'ordre strict** :
   1. `schema/01-eligibility-schema.sql` → crée les 9 tables (federations, leagues, clubs, player_clubs, nationality_basis, selections, eligibility_log, player_snapshots, sync_logs) + indexes + RLS
   2. `schema/02-seed-federations.sql` → seed 60 fédérations
   3. `schema/03-seed-leagues.sql` → seed 50+ championnats
   4. `schema/04-compute-eligibility.sql` → fonction `compute_eligibility()` + triggers

4. Vérifier après chaque exécution :
   ```sql
   SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
   ```

**Rollback** : chaque migration est en `BEGIN/COMMIT`. Si quelque chose casse, le `BEGIN` met tout dans une transaction et un `ROLLBACK` annule. Pour défaire complètement, lancer `DROP TABLE ... CASCADE` dans l'ordre inverse.

### Étape 2 — Récupérer la `SUPABASE_SERVICE_ROLE_KEY`

Le Service Role Key bypasse la RLS et permet aux scripts d'écrire. **Ne jamais l'exposer côté client**.

1. Dashboard Supabase → Project Settings → API
2. Copier le `service_role` (commence par `eyJ...`, **pas** l'`anon` key)

### Étape 3 — Copier les fichiers dans le repo `leopardsradar`

```bash
cd /chemin/vers/leopardsradar    # le repo cloné depuis angm-hub/leopardsradar
mkdir -p scripts .github/workflows
cp /Users/alexandrengomo/kAIra/10-recherche-veille/leopards-radar/build-2026-05-13/scripts/*.py scripts/
cp /Users/alexandrengomo/kAIra/10-recherche-veille/leopards-radar/build-2026-05-13/scripts/requirements.txt scripts/
cp /Users/alexandrengomo/kAIra/10-recherche-veille/leopards-radar/build-2026-05-13/workflows/*.yml .github/workflows/

git add scripts/ .github/workflows/
git commit -m "chore(data): add eligibility schema + Transfermarkt sync GitHub Actions"
git push origin main
```

### Étape 4 — Configurer les secrets GitHub Actions

1. Aller sur `https://github.com/angm-hub/leopardsradar/settings/secrets/actions`
2. Cliquer **New repository secret**, créer :
   - `SUPABASE_URL` = `https://dpykmhmdgvmqcehjuusn.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = la clé copiée à l'étape 2

### Étape 5 — Lancer la migration des 467 joueurs existants

En local (ne tourne qu'une fois) :

```bash
cd build-2026-05-13/scripts
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export SUPABASE_URL=https://dpykmhmdgvmqcehjuusn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<la clé>

# Test à blanc d'abord (n'écrit rien)
python migrate_existing_players.py --dry-run --limit 10

# Migration complète
python migrate_existing_players.py
```

À l'issue, tu devrais voir un récap du genre :
```
=== Récap ===
Joueurs traités       : 467
Bases juridiques      : ~520    (1 à 2 par joueur)
Sélections inférées   : ~180    (cap_rdc + caps autres nations parsées depuis notes)
Erreurs               : ~5-10
Recompute éligibilité globale...
  → 467 joueurs recalculés
```

Vérification post-migration dans Supabase SQL Editor :
```sql
-- Distribution des statuts calculés
SELECT computed_eligibility_status, COUNT(*)
FROM players
GROUP BY computed_eligibility_status
ORDER BY 2 DESC;

-- Cas qui ont basculé en INELIGIBLE (vérifier que c'est bien les 10 cap-tied connus)
SELECT name, computed_eligibility_status, computed_eligibility_blockers
FROM players
WHERE computed_eligibility_status = 'INELIGIBLE'
ORDER BY name;

-- Vérifier qu'on a bien des bases juridiques
SELECT confidence, basis, COUNT(*)
FROM nationality_basis
WHERE nationality_code = 'COD'
GROUP BY confidence, basis
ORDER BY 1, 3 DESC;
```

### Étape 6 — Trigger manuel du premier sync GitHub Actions

1. Onglet **Actions** du repo
2. Workflow "Sync Transfermarkt RDC pool" → bouton **Run workflow** (en haut à droite)
3. Confirmer les paramètres par défaut (BATCH_SIZE=200, RATE_LIMIT=3.0)
4. Suivre les logs en temps réel

Le job va prendre ~10-15 min pour 200 joueurs. À la fin, vérifier la table `sync_logs` :
```sql
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;
```

À partir de dimanche prochain, le cron prend le relais automatiquement.

---

## Tests rapides du détecteur d'éligibilité

Après la migration, tester sur quelques cas connus :

```sql
-- Castello Lukeba — devrait être ELIGIBLE (1 cap France amical à 19 ans = pas cap-tying)
SELECT * FROM compute_eligibility(
  (SELECT id FROM players WHERE slug = 'castello-lukeba')
);

-- Ezri Konsa — devrait être INELIGIBLE (cap-tied England senior officiel)
SELECT * FROM compute_eligibility(
  (SELECT id FROM players WHERE slug = 'ezri-konsa')
);

-- Roméo Lavia — devrait être ELIGIBLE ou SWITCHABLE selon ses caps Belgique
SELECT * FROM compute_eligibility(
  (SELECT id FROM players WHERE slug = 'romeo-lavia')
);
```

Si un cas ne donne pas le bon résultat, c'est probablement parce que les `selections` n'ont pas été correctement créées par le parsing de l'`eligibility_note`. Solution : enrichir manuellement via `INSERT INTO selections ...`.

---

## Limites connues / à enrichir manuellement

### 1. Le parsing de `eligibility_note` est imparfait

Le script `migrate_existing_players.py` extrait des sélections depuis du texte libre comme *"17 caps England A senior + squad WC 2026. Cap-tied."*. Les regex couvrent ~80% des cas, le reste demande review manuelle. Liste des cas qui demanderont une saisie manuelle après la migration :
- Joueurs avec plusieurs nations citées dans la note (ex: France + Belgique)
- Notes avec syntaxe atypique
- Joueurs dont la base juridique n'est pas dans la note (ex: "Ascendance RDC via famille" sans préciser père/mère)

→ Plan : créer une UI admin `/admin/eligibility-queue` (Phase S6) pour ces enrichissements.

### 2. Le scraper Transfermarkt n'extrait pas tout

L'API Transfermarkt n'existe pas officiellement, donc on parse le HTML. Sélecteurs robustes mais pas blindés. À surveiller :
- Si TM change un classname (`.data-header__market-value-wrapper` → autre), le scraper rate ce champ silencieusement
- Le champ `agent` n'est pas toujours dans le HTML public
- Les sélections nationales sur la page `/nationalmannschaft/spieler/<id>` ne précisent pas toujours la fédération de manière scrapable → fallback sur Wikidata SPARQL prévu en Phase S4

### 3. Pas de gestion multi-fédérations dans `compute_eligibility`

La fonction prend "la fédération autre que RDC la plus représentée" pour l'analyse cap-tying. Si un joueur a joué pour la France ET la Belgique (cas rare mais existe), seule la plus présente est prise en compte. À enrichir si le cas se présente.

### 4. Pas encore de UI Player enrichie

Les colonnes `players.computed_eligibility_*` sont remplies par la fonction, mais le frontend React ne les affiche pas encore. Travail Phase S3 : modifier `src/components/player/PlayerWhySection.tsx` pour afficher le bloc enrichi (bases / blockers / fenêtre switch / procédure FECOFA).

---

## Que faire si Transfermarkt te ban (Plan B)

Symptôme : les jobs GitHub Actions retournent `HTTP 403` ou `429` dans les logs `sync_logs.error_details`.

Plan d'escalade :
1. **Pause 24h** des jobs (désactiver les workflows depuis l'onglet Actions)
2. **Réduire le rate-limit** : passer de 3 sec à 6 sec via input `workflow_dispatch`
3. **Diminuer la batch size** : passer de 200 à 50 par run (8 dimanches au lieu de 8 pour couvrir 1500)
4. **Si récidive** : ajouter un proxy Cloudflare Workers (gratuit, 100k req/jour) entre GitHub Actions et Transfermarkt → l'IP vue par TM devient une IP CF aléatoire
5. **Solution ultime** : self-host `transfermarkt-api` (FastAPI wrapper) sur Hugging Face Space (CPU gratuit, IP différente)

---

## Suite (Phases S2 à S6 de la roadmap)

Cette livraison couvre **Phase 1 (S1-S2)** et **fournit l'outillage de Phase 2 (S2-S3)** de l'addendum 0€.

Reste à faire :
- **S3** : modifier `src/components/player/PlayerWhySection.tsx` pour exposer le bloc éligibilité enrichi + ajouter filtre Radar "Statut switch FIFA"
- **S4** : ajouter scrapers spécifiques Pro League BEL, Premier League 2, Campionato Primavera, LaLiga RFEF, Bundesliga U23
- **S5** : page `/cdm-2026` + Buttondown newsletter + page `/journalistes`
- **S6** : page admin `/admin/scout-feed` + SEO (titres par page, structured data, sitemap)

Voir `AUDIT.md` et `ADDENDUM-stack-zero-euro.md` (sœurs de ce dossier) pour le détail.

---

## Décisions remises sur la table

Sur les 4 décisions ouvertes après l'addendum 0€ :
- **Sous-traitance dev** : tu fais tout toi-même → ~150h sur 6 sem (~25h/sem)
- **Note de cadrage FECOFA** : à confirmer
- **Page Histoires** : à trancher
- **Engagement newsletter** : à confirmer

Ce build kit te débloque indépendamment de ces 4 décisions. Tu peux exécuter Phase 1+2 dès maintenant.

---

*kAIra · Alexandre Ngomo · 2026-05-13*
