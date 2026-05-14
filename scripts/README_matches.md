# Sync Matchs RDC — Documentation

Script : `scripts/sync_matches_rdc.py`
Workflow : `.github/workflows/sync-matches.yml`
Cadence : quotidien 06:00 UTC

---

## Source primaire retenue : Wikipedia Mediawiki API

**Pourquoi Wikipedia et pas les autres sources évaluées**

| Source | Verdict | Raison |
|--------|---------|--------|
| **Wikipedia Mediawiki API** | Retenu — source primaire | Gratuit, sans clé, automatisable, bien tenu par la communauté. Contient les matchs passés ET les fixtures futures avec heures FIFA officielles. |
| Football-data.org | Écarté | Tier gratuit = 403 sur toutes les compétitions internationales. Tier payant nécessaire pour la CAF et les matchs A. |
| API-Football (RapidAPI) | Écarté | Gratuit à 100 calls/jour uniquement, payant au-delà. Pas adapté à un budget 0€ récurrent. |
| FECOFA (fecofa.cd) | Fallback manuel | Site accessible mais rendu JavaScript — pas d'API publique, instable, ne liste pas de calendrier structuré. |
| CAF (cafonline.com) | Validation visuelle | Pas d'API JSON publique documentée. Utile pour vérification manuelle des compétitions CAF. |
| SofaScore / Flashscore | Écarté | API non publique, 403 systématique. Scraping interdit par les CGU. |

**Pages Wikipedia parsées**

1. `DR Congo national football team results (2020–present)`
   - Contient tous les matchs passés depuis 2020 ET les fixtures futures schedulées
   - Format structuré `{{Football box collapsible}}` — parseable sans HTML
   - URL API : `https://en.wikipedia.org/w/api.php?action=parse&page=DR+Congo+national+football+team+results+(2020%E2%80%93present)&prop=wikitext&format=json`

2. `2026 FIFA World Cup Group K`
   - Contient les 3 matchs RDC du Groupe K avec heures UTC officielles et stades
   - URL API : `https://en.wikipedia.org/w/api.php?action=parse&page=2026+FIFA+World+Cup+Group+K&prop=wikitext&format=json`

**Fraîcheur**
Les pages Wikipedia sont mises à jour par des contributeurs dans les heures suivant chaque annonce officielle. Pour les matchs du Mondial 2026, les données sont tirées des PDF FIFA officiels.

**Clé API requise : aucune**

---

## État des matchs RDC au 14 mai 2026

### Matchs amicaux pré-Mondial (confirmés, dans la base seed)

| Date | Adversaire | Compétition | Lieu | Stade |
|------|-----------|-------------|------|-------|
| 3 juin 2026, 19:00 UTC | Danemark | Match amical | Lille, France | Stade Pierre-Mauroy |
| 7 juin 2026, 18:00 UTC | Maroc | Match amical | Lens, France | Stade Bollaert-Delelis |

Ces deux matchs sont dans `scripts/data/initial_matches_rdc_2026.sql` et dans la base seed.
Wikipedia ne les référence pas encore au 14 mai 2026 — ils seront ajoutés après le match.

### Coupe du Monde 2026 — Groupe K

**Composition du groupe** : RD Congo (COD), Portugal (POR), Ouzbékistan (UZB), Colombie (COL)

| Journée | Date | Heure UTC | Adversaire | Stade | Ville |
|---------|------|-----------|-----------|-------|-------|
| J1 | 17 juin 2026 | 17:00 UTC | Portugal | NRG Stadium | Houston, Texas |
| J2 | 23 juin 2026 | 02:00 UTC (24 juin) | Colombie | Estadio Akron | Zapopan, Mexique |
| J3 | 27 juin 2026 | 23:30 UTC | Ouzbékistan | Mercedes-Benz Stadium | Atlanta, Georgie |

**Calcul des heures UTC**
- J1 : 12:00 p.m. UTC-5 → 17:00 UTC ✓
- J2 : 8:00 p.m. UTC-6 → 02:00 UTC le 24 juin ✓
- J3 : 7:30 p.m. UTC-4 → 23:30 UTC ✓

**Source** : Wikipedia "2026 FIFA World Cup Group K" + FIFA Match Centre officiel
- J1 : https://www.fifa.com/en/match-centre/match/17/285023/289273/400021502
- J2 : https://www.fifa.com/en/match-centre/match/17/285023/289273/400021501
- J3 : https://www.fifa.com/en/match-centre/match/17/285023/289273/400021500

---

## Format des données reçues vs attendu

### Wikitext Wikipedia (entrée)

```
{{Football box collapsible
|format     = 1
|round=[[2026 FIFA World Cup|2026 World Cup - GS]]
|date=17 June
|time=12:00 p.m. [[UTC−05:00|UTC−5]]
|team1={{fb-rt|POR}}
|score=
|team2={{fb|COD}}
|stadium=[[NRG Stadium]]
|location=[[Houston]], [[United States of America|United States]]
|report=https://www.fifa.com/...
}}
```

### Table matches Supabase (sortie)

```json
{
  "kickoff_at": "2026-06-17T17:00:00+00:00",
  "opponent_name": "Portugal",
  "opponent_code": "POR",
  "opponent_flag": "🇵🇹",
  "competition": "Coupe du Monde 2026 — Phase de groupes",
  "venue": "NRG Stadium",
  "city": "Houston",
  "country": "United States",
  "home_or_away": "neutral",
  "status": "scheduled",
  "is_published": true
}
```

---

## Mapping compétition → label public

| Round Wikipedia | Label Léopards Radar |
|----------------|---------------------|
| `2026 World Cup - GS` | `Coupe du Monde 2026 — Phase de groupes` |
| `2026 FIFA World Cup` | `Coupe du Monde 2026 — Phase de groupes` |
| `Friendly` / `Exhibition match` | `Match amical` |
| `2025 AFCON RR` | `CAN 2025 — Phase de groupes` |
| `2026 FIFA WC Qualifier` | `Éliminatoires Coupe du Monde 2026` |
| `2026 World Cup qualification` | `Éliminatoires Coupe du Monde 2026` |

Pour ajouter un nouveau mapping : modifier `COMPETITION_MAP` dans `sync_matches_rdc.py`.

---

## Idempotence

Le script est strictement idempotent :

- **Détection doublon** : fenêtre ±12h sur `kickoff_at` + correspondance partielle sur `opponent_name`
- **INSERT** : uniquement si aucun match existant dans la fenêtre avec cet adversaire
- **UPDATE** : uniquement si une donnée a changé (status, score, kickoff_at décalé > 30 min, venue nouvellement disponible)
- **SKIP** : si le match est déjà à jour

2 runs consécutifs ne créent jamais de doublons.

---

## Procédure manuelle — quand Wikipedia ne suffit pas

### Cas 1 : Match amical annoncé mais pas encore sur Wikipedia

1. Ajouter le match manuellement dans `scripts/data/initial_matches_rdc_2026.sql`
2. Lancer `python seed_matches.py` en local (ou `python seed_matches.py --dry-run` pour vérifier)
3. Wikipedia mettra à jour la page dans les jours suivants → le script de sync prendra le relais

### Cas 2 : Erreur sur un match en base

1. Aller dans Supabase Dashboard → Table Editor → `matches`
2. Modifier directement la ligne concernée
3. Le champ `is_published` permet de masquer un match sans le supprimer

### Cas 3 : Wikipedia est en maintenance

Le script logge `sync-matches-rdc` dans `sync_logs` avec `status=partial` si une page est inaccessible.
Les matchs déjà en base ne sont pas affectés.

---

## Liens officiels pour validation visuelle hebdomadaire

**FIFA Mondial 2026**
- Calendrier officiel PDF : https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf
- Match Centre Groupe K : https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/groups/group-k

**Wikipedia**
- Page résultats RDC : https://en.wikipedia.org/wiki/DR_Congo_national_football_team_results_(2020%E2%80%93present)
- Page Groupe K : https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_K

**CAF**
- Site officiel : https://www.cafonline.com/
- Éliminatoires CAN 2027 (quand annoncées) : https://www.cafonline.com/caf-african-nations-championship/

**FECOFA (source primaire officielle RDC)**
- Actualités équipe nationale : https://fecofa.cd/equipe-nationale/actualites

---

## Activer le workflow GitHub Actions

Le workflow est prêt dans `.github/workflows/sync-matches.yml`.

**Aucune clé API à créer** — Wikipedia est public et gratuit.

**Secrets GitHub à vérifier** (déjà configurés si les autres workflows tournent) :

1. GitHub → Settings → Secrets and variables → Actions
2. Vérifier que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont présents
3. Le workflow tourne automatiquement à 06:00 UTC chaque jour

**Lancer manuellement** :
GitHub → Actions → "Sync Matchs RDC" → Run workflow → `dry_run: true` pour tester

---

## Limitations connues

1. **Matchs amicaux récents non documentés** : Wikipedia peut avoir 24-72h de délai après une annonce officielle. Pour les matchs imminents, utiliser `seed_matches.py` en complément.

2. **Heures non officielles** : pour les matchs CAF (éliminatoires CAN 2027), les horaires ne sont souvent confirmés qu'une semaine avant. Le script insère alors avec `kickoff_at` à minuit UTC (0h00) et `status=scheduled` — à corriger manuellement quand confirmé.

3. **Phases à élimination directe** : si la RDC passe les groupes, les pages Wikipedia des huitièmes/quarts ne seront créées qu'après qualification. Le script les détectera automatiquement dès leur apparition.

4. **Qualificatifs CAN 2027** : les dates et adversaires ne sont pas encore confirmés (mai 2026). Wikipedia liste des placeholders "September" / "October" sans jour précis → ignorés par le script (pas de kickoff_at calculable). À renseigner manuellement via `seed_matches.py` quand confirmés.
