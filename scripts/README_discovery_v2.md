# Discovery v2 — Guide technique

## Contexte : pourquoi cette v2 ?

**Cas déclencheur** : Believe Munongo (TM ID 1297673), attaquant de Lorient en Ligue 1,
n'était pas dans la BDD Léopards Radar malgré son patronyme bantou clairement congolais.

**Pourquoi les scripts existants ne l'ont pas capturé** :

| Script | Méthode | Pourquoi Munongo est passé entre les mailles |
|--------|---------|----------------------------------------------|
| `discover_candidates.py` | Filtre TM `land_id=193` (nationalité RDC déclarée) | Munongo est binational, pas encore international RDC, nationalité FR déclarée sur TM |
| `discover_by_surname.py` | Crawl sélections jeunes EU + quelques académies | Lorient (ID 432) **n'est pas** dans la liste des équipes scannées |
| `discover_wikidata.py` | P19=RDC ou P27=RDC | Munongo né en France/Belgique, pas de citizenship RDC sur Wikidata |

---

## Les 4 méthodes de `comprehensive_discovery.py`

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
signal que la vérification manuelle est obligatoire.

---

## Comment ajouter une nouvelle source

1. Écrire une fonction `method_X_nom(existing_ids, ...) -> list[dict]`
2. Chaque élément retourné doit contenir :
   - `transfermarkt_id` (str)
   - `name` (str)
   - `profile_url` (str)
   - `method` (str, ex. "E")
   - `source` (str, description lisible)
3. Appeler la fonction dans `main()` dans le bloc `if "X" in methods`
4. Ajouter `X` à l'input `methods` du workflow

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
| Believe Munongo | 1297673 | FC Lorient (L1) | Lorient non scanné par discover_by_surname, nationalité FR sur TM | A (club scan Lorient) + D (patronyme "Munongo") |

---

## Cas connus encore manquants (limitation technique)

| Cas | Raison | Workaround possible |
|-----|--------|---------------------|
| Joueur avec patronyme entièrement européen (prénom congolais seulement) | Les 4 méthodes filtrent sur le nom de famille | Recherche par prénom bantu (P735 Wikidata) — trop de faux positifs |
| Joueur très récent (U15/U16) sans page TM ni Wikidata | TM ne profile pas les -16 ans | Scan FECOFA (manuel) ou sites diaspora |
| Joueur avec double nationalité non déclarée sur TM | TM ne montre que la nationalité "principale" | Accès FECOFA officiel ou sélection RDC pour vérification |

---

## Exécution manuelle

```bash
# Dry run — méthode A seulement (rapide, prouve que Munongo est trouvé)
cd scripts
python comprehensive_discovery.py --dry-run --methods A

# Dry run — toutes les méthodes
python comprehensive_discovery.py --dry-run

# Exécution réelle (nécessite SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
python comprehensive_discovery.py --methods A,B,C,D
```

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `SUPABASE_URL` | Oui (sauf dry-run) | URL projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui (sauf dry-run) | Clé service_role |
| `RATE_LIMIT_SECONDS` | Non (défaut 1.5) | Délai entre requêtes TM |
| `GITHUB_RUN_URL` | Non | Injecté automatiquement par GH Actions |
