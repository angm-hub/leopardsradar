# Scraper Transfermarkt — limitations connues au 2026-05-14

Test exécuté en local avec rate-limit 3 sec sur 1 profil réel (Castello Lukeba, TM 618472).

## Champs qui marchent ✅

| Champ                | Valeur extraite                  | Note                                  |
|---------------------|----------------------------------|---------------------------------------|
| `name`              | `Castello Lukeba`                | Espace correct entre prénom et nom    |
| `position`          | `Defender`                       |                                       |
| `place_of_birth`    | `Lyon`                           |                                       |
| `country_of_birth`  | `France`                         |                                       |
| `nationalities`     | `['France', 'Angola']`           | Sélecteur Citizenship ciblé           |
| `current_club_name` | `Leipzig`                        |                                       |
| `current_club_id`   | `23826`                          | TM ID parsé du `href`                 |
| `market_value_eur`  | `45 000 000`                     |                                       |
| `image_url`         | `https://img.a.transfermarkt...` |                                       |

→ Ces champs sont la majorité de ce qui change semaine à semaine (club, valeur). Le sync hebdo en l'état apporte déjà de la valeur réelle.

## Champs qui ratent ❌

| Champ              | Cause                                                    | Workaround                                         |
|-------------------|----------------------------------------------------------|----------------------------------------------------|
| `date_of_birth`   | Sélecteur `span[itemprop='birthDate']` plus en place     | DOB déjà en DB pour les 467 joueurs migrés         |
| `foot`            | Format des labels `data-header__label` a changé          | Saisie manuelle si critique                        |
| `contract_expires`| Idem                                                     | Saisie manuelle ou ré-écrire le sélecteur          |
| `agent`           | Idem                                                     | Rarement renseigné publiquement                    |
| `selections` (intl)| Page `/-/nationalmannschaft/spieler/{id}` — sélecteurs `table.items tbody tr` ne matchent pas le HTML actuel | Voir ci-dessous |

→ Le pacte éditorial est respecté : `sync_transfermarkt.py` filtre les `None` (`patch = {k: v for k, v in patch.items() if v is not None}`) → on n'écrase pas la donnée existante avec un null.

## Sélections internationales — état dégradé

Le scraping de la page nationalmannschaft retourne **0 sélection** sur Castello Lukeba. C'est le composant le plus critique pour le détecteur d'éligibilité (qui dépend de `selections` pour calculer les blockers cap-tying).

Plan d'action recommandé pour **enrichir manuellement** les sélections critiques sur les ~50 joueurs prioritaires (le roster + les binationaux sensibles) :

```sql
-- Exemple : Castello Lukeba a 1 cap France amical en oct 2023
INSERT INTO selections (player_id, federation_code, category, competition,
                        is_major_competition, opponent, match_date, source_url, notes)
VALUES (
  (SELECT id FROM players WHERE slug = 'castello-lukeba'),
  'FRA',
  'A_FRIENDLY',
  'Friendly vs Scotland',
  FALSE,
  'Scotland',
  '2023-10-17',
  'https://en.wikipedia.org/wiki/Castello_Lukeba',
  'Manual entry — 1st A cap, friendly, age 19. Does NOT cap-tie per FIFA art. 9 amendments 2020.'
);
```

Le trigger `recompute_eligibility_on_selection` recalcule automatiquement le statut après chaque insert.

## Itérations à prévoir

Pour rattraper les sélecteurs cassés (DOB, foot, contract, agent, sélections intl), 2 options :

**Option A — Patcher les sélecteurs CSS un par un**
Sauvegarder le HTML brut de quelques profils types, identifier les nouveaux sélecteurs, mettre à jour `transfermarkt_client.py`. Coût : 2-3h de dev.

**Option B — Basculer sur `transfermarkt-api` (felipeall)**
Wrapper FastAPI open-source, plus haute fiabilité. Self-host sur Hugging Face Space (gratuit). Coût : 1-2h de setup.

Recommandation : **A en premier** pour rester en pure stack 0€ sans dépendance externe. **B en plan B** si TM continue de changer son HTML rapidement.

---

*Diagnostic produit le 14 mai 2026 — kAIra.*
