# Méthodologie Léopards Radar

Source unique de la méthode de découverte, vérification, tiering, éligibilité et
enrichissement du vivier RDC. Mise à jour : 16/08/2026.

---

## 1. Sources de découverte
Par ordre de fiabilité du signal :

- **TM, recherche avancée « 2ème nationalité = RD Congo »** (± filtrée « Actif pour
  un club de : [pays] ») : la source reine, liste des joueurs flaggés COD.
- **Drapeau TM « DR Congo »** sur une fiche : signal direct, publiable.
- **Wikidata SPARQL** (P27 = Q974, plus parents P22/P25) + **catégories Wikipédia**
  « d'origine congolaise (RDC) ».
- **Crawls youth league faits** : France, Belgique, Angleterre, Allemagne, Pays-Bas.
  **Angles morts** : Suisse (clubs ajoutés au code le 16/08/2026), Italie/Portugal
  youth, Espagne, Autriche, Finlande, USA, et **ligues africaines hors RDC**
  (Angola, Afrique du Sud, Zambie).
- **Onomastique** (patronyme kongo/lingala) : jamais seule, toujours en radar à vérifier.
- Réseau, Polka Foot, footballdatabase.eu, tips Boomsports, API FIFA (changements
  d'association).

## 2. Vérification AVANT ajout (non négociable)
1. **Dédup par `transfermarkt_id`, jamais par nom.** Les accents (Etshélé rate
   `%Etshel%`), prénoms insérés (Richard **Jean David** Makengo) et variantes o/u
   (Moholo/Muholo) font manquer les doublons. La contrainte unique
   `players_transfermarkt_id_key` est le dernier filet. `execute_sql` ne renvoie que
   le dernier statement : un check de collision = un appel isolé.
2. **Vérifier le signal RDC sur la fiche** avant d'écrire. Drapeau TM « DR Congo » =
   confirmé. **Nom/onomastique seul n'est pas une preuve** (leçon Warren Ngana).
   Transfrontalier n'est pas une preuve. Homonyme n'est pas une preuve.
3. **URL douteuse = scraper la fiche.** L'id prime sur le slug
   (`gael-nsombi/.../74494` renvoyait un joueur colombien).

## 3. RD Congo vs Congo-Brazzaville
Piège permanent. TM tague **« Congo » (Q971, Brazzaville)** différemment de
**« RD Congo » (Q974, COD)**. Un « Congo » seul dans le radar RDC est un faux positif
à trancher (cas Mwamba, Samba). Le script `factcheck_players` existe pour ça.

## 4. Assessment onomastique
Si pas de drapeau RDC mais nom bantou, on juge l'**aire** :
- **Aire kongo/lingala** (RDC-plausible, non exclusif car partagé Brazza/Angola) :
  Mbenza, Nsakala, Lisombo, Makola, Ntondo, Lukeba, etc.
- **Off-target à flaguer** : N'Zi (ivoirien), Fomba (malien), Ndongo avec prénom
  sénégalais (wolof), Moukambi (gabonais).

## 5. Tiers (`radar_tier`)
| Tier | Critère |
|------|---------|
| **TIER1_CONFIRME** | cap RDC en compétition / sélection / source ferme |
| **TIER2_TRES_PROBABLE** | drapeau TM RD Congo confirmé + bio recoupée |
| **TIER3_A_VERIFIER** | signal présent, à approfondir |
| **TIER4_ONOMASTIC_RADAR** | onomastique seule, France-seule sur TM, `unknown`, réserve privée |
| **TIER5_EXCLU** | off-target, ou cap-tied ailleurs |

## 6. Éligibilité FIFA
- Amicaux **ne verrouillent jamais**. **4 capes A en compétition ou plus**, ou une
  finale, entraînent l'archivage. **1 cape compét après 21 ans** verrouille.
- `eligibility_status` : eligible / unknown / ineligible / selected / potentially_eligible.

## 7. Écriture DB
Classification honnête, `eligibility_note` datée avec la raison, `source_urls`,
`discovery_method`. **Jamais présenter la supposition comme un fait.** Off-target noté
explicitement. **Signal RDC obligatoire pour l'affichage public** ; TIER4 / `unknown`
reste une réserve privée.

Rappels techniques d'insertion (gabarit) : `source_urls` est `text[]`
(`array[...]::text[]`), `nationalities` / `other_nationalities` sont jsonb.

## 8. Enrichissement
Via **GitHub Actions `workflow_dispatch`** (clé service-role dans les secrets du repo,
`gh` authentifié angm-hub ; le `.env.local` local n'a que la clé publishable, rejetée
par `supabase_client.py`) :

1. `sync-transfermarkt` **avec Playwright** (seul moyen de passer Cloudflare) :
   valeur, taille, DOB, poste, caps.
2. `sync-understat`, `sync-stats-multi` (FBRef mort, à sauter),
   `enrich-wikidata-signals`, `factcheck-players`.
3. Puis RPC via SQL : `refresh_player_levels(null)`, puis
   `compute_leopards_scores_all()`, puis `refresh_sprint5_insights()`.

## 9. Plafonds connus
- Le vivier jeune/amateur FR est **structurellement sans données** (ni cote, ni
  taille, ni stats). Relancer les scrapers donne un gain proche de zéro.
- Le **score Léopards exige des stats de match** : bloqué à environ 15 % tant
  qu'API-Football n'est pas câblé (edge function `sync-players-apifootball`, chantier
  de dev).
- **Scraping TM = Playwright obligatoire.** Les scripts en requests simples
  (Méthode E de `comprehensive_discovery.py`) sont **morts sur CI** (Cloudflare) :
  26 clubs ciblés Suisse/Italie/Portugal le 16/08/2026 = 26 erreurs, 0 joueur.
  Voie de contournement : la recherche avancée TM par pays (source reine, point 1),
  ou porter la Méthode E sous Playwright.

## 10. Règles d'or
Défaut = **inclure** un candidat RDC crédible, mais **jamais sans signal vérifié**.
Croiser systématiquement (Léopards ne se fie pas à la mémoire). Pousser un désaccord
honnête quand la preuve est faible.

---

Voir aussi les mémoires kAIra : dédup par TM id, plafond d'enrichissement,
verrouillage FIFA nature et âge, matière noire parentage, méthode découverte canonique.
