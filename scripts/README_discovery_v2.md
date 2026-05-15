# Discovery v3 — Guide technique

## Contexte : pourquoi cette v3 ?

**Cas déclencheur** : Believe Munongo (TM ID 1297673), milieu de FC Metz en Ligue 2,
n'était pas dans la BDD Léopards Radar car sa nationalité **primaire** sur Transfermarkt
est France — RDC n'apparaît qu'en **secondaire**.

**Pourquoi les scripts existants ne l'ont pas capturé** :

| Script | Méthode | Pourquoi Munongo est passé entre les mailles |
|--------|---------|----------------------------------------------|
| `discover_candidates.py` | Filtre TM `land_id=193` (nationalité RDC primary) | Munongo a nationalité France primary → invisible |
| `discover_by_surname.py` | Crawl sélections jeunes EU + quelques académies | Lorient (ID 432, Metz ID 391 dans la v2) non scannés |
| `discover_wikidata.py` | P19=RDC ou P27=RDC | Né à Metz, pas de citizenship RDC sur Wikidata |

**Gap quantifié** : 684 joueurs en BDD ont 2+ nationalités mais `other_nationalities`
est vide pour tous (0/1068). La méthode E comble ce gap structurel.

---

## Les 5 méthodes de `comprehensive_discovery.py`

### Méthode A — Scan clubs pros top ligues

**Périmètre** : ~100 clubs dans Ligue 1, L2 FR (top 8), Pro League BE, Eredivisie,
2.Bundesliga, Championship, Liga Portugal, Süper Lig (top 4), Serie A (top 6).

**Logique** : pour chaque club, fetch le roster TM → filtre sur patronymes bantu
(liste `EXTENDED_PATRONYMES`, 90+ noms) → si patronyme match + pas en BDD = candidat.

**Rationale** : Lorient (TM ID 432) est dans la liste. Munongo aurait été capturé.
C'est la méthode avec la valeur détection/effort la plus élevée.

**Limitation** : les joueurs avec patronyme européen mais mère congolaise passent encore.

---

### Méthode B — Wikipedia categories scraping

**Sources** : 12 catégories Wikipedia FR + EN :
- `Footballeur_français_d'origine_congolaise_(RDC)`
- `Footballeur_belge_d'origine_congolaise_(RDC)`
- `Democratic_Republic_of_the_Congo_international_footballers`
- etc.

**Logique** : Mediawiki API → liste des membres → TM search par nom → si TM ID
trouvé + pas en BDD = candidat.

**Limitation** : dépend de la qualité de la catégorisation Wikipedia. Les joueurs
très récents ou peu connus n'ont pas encore de page Wikipedia.

---

### Méthode C — Wikidata SPARQL étendu

**Extension vs `discover_wikidata.py`** : ajoute P22 (père) et P25 (mère) dans
la requête SPARQL. Attrape les joueurs dont **un des parents** est congolais, même
si eux-mêmes n'ont pas encore P27=RDC enregistré.

**Requête** : filtre sur P27=RDC **OU** P19 en RDC **OU** père/mère avec P27=RDC
**OU** père/mère né en RDC.

**Limitation** : les liens parentaux ne sont pas systématiquement renseignés sur
Wikidata, surtout pour les joueurs moins médiatisés.

---

### Méthode D — Patronymes étendus × Transfermarkt search

**Liste** : 90+ patronymes bantu congolais consolidés depuis la whitelist existante
`bantou_surnames.json` + noms fréquents RDC (Wikipedia, DataNomes, recensements).

**Logique** : pour chaque patronyme, `schnellsuche` TM → récupère tous les profils
joueurs → filtre pas-en-BDD = candidat.

**"Munongo" est le premier patronyme de la liste** — il aurait été capturé.

**Limitation** : les noms très courants (Bamba, Kanda) peuvent générer des
faux positifs de pays différents. Le champ `eligibility_status = 'unknown'`
signale que la vérification manuelle est obligatoire.

---

### Méthode E — Squad scan complet + fiche individuelle (multi-nats) ⭐ NOUVEAU

**Problème résolu** : un joueur avec nationalité primaire française/belge/allemande
et RD Congo en secondaire est **invisible** pour toutes les méthodes A-D (sauf D si
le patronyme est dans la whitelist). La méthode E scanne CHAQUE joueur de CHAQUE
club ciblé sans filtre patronyme.

**Logique** :
1. Pour chaque club de la liste `TOP_LEAGUE_CLUBS` : fetch le roster complet via TM
2. Pour chaque joueur inconnu en BDD : fetch sa fiche individuelle TM
3. Si COD apparaît dans **n'importe quelle** nationalité → candidat, avec toutes les
   données enrichies (DOB, position, valeur marchande, etc.)

**Variantes COD reconnues** : `DR Congo`, `RD Congo`, `Democratic Republic of Congo`,
`Belgian Congo`, `Congo DR`, etc. (12 variantes + filet sécurité sur "congo" + "democrat/rd/rdc/dr")

**Données enrichies** : la méthode E pré-remplit `nationalities`, `other_nationalities`,
`is_binational`, `current_club`, `date_of_birth`, `place_of_birth`, `height_cm`,
`position`, `market_value_eur` — pas besoin d'un sync TM supplémentaire.

**Coût** :
- Ligue 1 France (20 clubs, ~30 joueurs/club) ≈ 15 min
- Toutes les ligues (~100 clubs × ~30 joueurs) ≈ 6-8h
- Rate limit : 1.5s/fiche individuelle

**Test unitaire** : `--test-player 1297673` vérifie Munongo en 3 secondes.

**Exemple dry-run L1** (15 mai 2026) :
- 20 clubs scannés (Ligue 1 + quelques clubs L2/BEL doublons)
- ~600 fiches individuelles parsées
- Résultats à compléter après run complet

**Limitation** : coûteux en temps. Prévoir timeout 240 min en GH Actions.
Ne pas activer en cron hebdomadaire (trop lent) — déclencher manuellement
via `workflow_dispatch` avec `methods=A,B,C,D,E`.

---

## Comment ajouter une nouvelle source

1. Écrire une fonction `method_X_nom(existing_ids, ...) -> list[dict]`
2. Chaque élément retourné doit contenir :
   - `transfermarkt_id` (str)
   - `name` (str)
   - `profile_url` (str)
   - `method` (str, ex. "F")
   - `source` (str, description lisible)
3. Appeler la fonction dans `main()` dans le bloc `if "X" in methods`
4. Ajouter `X` à l'input `methods` du workflow et au `README_discovery_v2.md`

---

## Liste des patronymes bantu (à enrichir manuellement)

La liste `EXTENDED_PATRONYMES` dans `comprehensive_discovery.py` contient 90+
patronymes. Pour l'enrichir :

1. Sources de référence :
   - Wikipedia : "Noms de famille en République démocratique du Congo"
   - DataNomes (datanomes.com) : fréquences noms RDC
   - Base Léopards Radar elle-même (`SELECT DISTINCT name FROM players` + extraction)
2. Ajouter dans la liste `EXTENDED_PATRONYMES` du script
3. Commiter avec le cas d'usage ("ajout patronyme X, joueur Y non capturé")

---

## Cas connus traités

| Joueur | TM ID | Club | Pourquoi manquait | Méthode qui le trouve |
|--------|-------|------|--------------------|-----------------------|
| Believe Munongo | 1297673 | FC Metz (L2, ancien Lorient) | Nationalité primaire France sur TM, RDC en secondaire | E (squad scan + fiche individuelle) + D (patronyme "Munongo") |

---

## Cas connus encore manquants (limitation technique)

| Cas | Raison | Workaround possible |
|-----|--------|---------------------|
| Joueur avec patronyme entièrement européen (prénom congolais seulement) | Les 5 méthodes filtrent majoritairement sur le nom de famille | Recherche par prénom bantu (P735 Wikidata) — trop de faux positifs |
| Joueur très récent (U15/U16) sans page TM ni Wikidata | TM ne profile pas les -16 ans systématiquement | Scan FECOFA (manuel) ou sites diaspora |
| Joueur avec double nationalité non déclarée sur TM | TM peut ne pas afficher la nationalité RDC si jamais sélectionné | Méthode E ne peut pas détecter ce qui n'est pas déclaré sur TM |
| Clubs hors du périmètre `TOP_LEAGUE_CLUBS` | La méthode E ne scanne que ~100 clubs définis | Étendre la liste `TOP_LEAGUE_CLUBS` avec d'autres championnats |

---

## Exécution manuelle

```bash
cd scripts

# Test unitaire Munongo (3 secondes, confirme que COD est détecté)
python comprehensive_discovery.py --dry-run --methods E --test-player 1297673

# Dry run méthode E — Ligue 1 uniquement (~15 min)
python comprehensive_discovery.py --dry-run --methods E --leagues L1

# Dry run méthode E — Belgique uniquement (~10 min)
python comprehensive_discovery.py --dry-run --methods E --leagues BEL1

# Dry run — méthode A seulement (rapide, patronyme bantu)
python comprehensive_discovery.py --dry-run --methods A

# Dry run — toutes les méthodes A-D
python comprehensive_discovery.py --dry-run

# Exécution réelle méthode E Ligue 1 (LIVE, ~15 min)
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
python comprehensive_discovery.py --methods E --leagues L1

# Exécution réelle — toutes méthodes (LIVE, 6-8h pour E complète)
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
python comprehensive_discovery.py --methods A,B,C,D,E
```

## Activer la méthode E via GitHub Actions

Sur le repo GitHub Actions (`comprehensive-discovery.yml`), déclencher manuellement :
- `methods` : `A,B,C,D,E`
- `leagues` : laisser vide pour tout scanner (6-8h) ou `L1` pour Ligue 1 seulement (15 min)
- `dry_run` : `true` pour tester sans insérer

Le timeout du job est 240 min (4h) pour couvrir un run E complet sur toutes les ligues.

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `SUPABASE_URL` | Oui (sauf dry-run) | URL projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui (sauf dry-run) | Clé service_role |
| `RATE_LIMIT_SECONDS` | Non (défaut 1.5) | Délai entre requêtes TM |
| `GITHUB_RUN_URL` | Non | Injecté automatiquement par GH Actions |
