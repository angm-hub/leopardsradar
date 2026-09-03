# Cadrage — moteur d'éligibilité FIFA (switch / cap-tie)

Date : 2026-09-03. Fait suite à PROD-1 (moteur de cohérence) : celui-ci gère la
synchro canonique→legacy, mais **ne calcule pas** le statut FIFA. Ce document
cadre le vrai calcul switch/cap-tie.

## Constat : le calcul FIFA ne concerne qu'un sous-ensemble étroit

- 2276 actifs. La quasi-totalité sont des prospects **jamais capés A ailleurs** :
  leur statut est SWITCHABLE/ELIGIBLE par défaut une fois la base RDC confirmée.
  Le calcul FIFA ne change RIEN pour eux.
- Le calcul ne mord que sur les joueurs **capés en A par un autre pays** :
  **~10 avec `caps_other_count>0`**, ~43 avec `caps_other_country` renseigné,
  319 avec un signal étranger large (`fifa_country` non-RDC, souvent juste une
  citoyenneté, pas une cape). **C'est là, et seulement là, que se joue le moat
  éligibilité.**

## La règle (déjà établie côté kAIra)

Réf : mémoires `feedback_leopards-radar-captied-switch-fifa`,
`project_leopards-radar-verrouillage-fifa-nature-et-age`.

1. **Un amical ne verrouille jamais.**
2. **1 cape compétitive A après 21 ans → verrouille (INELIGIBLE).**
3. **Toute cape en tournoi final (CDM/CAN/EURO…) → verrouille.**
4. **≤3 capes compétitives, avant 21 ans, hors finale → SWITCHABLE** (switch FIFA
   possible ; fenêtre soumise au délai de 3 ans depuis la dernière cape).
5. Au-delà de 3 capes compétitives → INELIGIBLE.

## Classifieur déterministe (diagnostic, n'écrit rien)

Applique la règle aux colonnes existantes (`caps_other_count`,
`first_other_cap_type`, `first_other_cap_date`, `date_of_birth`) et **flague les
divergences** avec la curation, sans rien écraser :

```sql
with capped as (
  select id, name, computed_eligibility_status ces, caps_other_country coc,
    coalesce(caps_other_count,0) n, lower(coalesce(first_other_cap_type,'')) t,
    first_other_cap_date d, date_of_birth dob,
    case when first_other_cap_date is not null and date_of_birth is not null
         then extract(year from age(first_other_cap_date, date_of_birth))::int end age_cap
  from players
  where not archived and (coalesce(caps_other_count,0)>0 or first_other_cap_type is not null)
)
select name, ces,
  case
    when t like 'friendl%' and n<=1 then 'SWITCHABLE'
    when t like 'comp%' or t='official' then
      case when n>=4 then 'INELIGIBLE' when age_cap>=21 then 'INELIGIBLE' else 'SWITCHABLE' end
    when n>=4 then 'INELIGIBLE' else 'INDETERMINE' end suggest,
  coc, n, t, age_cap
from capped order by n desc, name;
```

## Résultat au 2026-09-03 (10 capés)

- **8 confirment** la curation (Vranckx 9 capes INELIGIBLE, Kage 5 INELIGIBLE,
  Limbombe/Tshimanga/Mendes/Bakenga 1 amical SWITCHABLE…).
- **2 INDETERMINE** — nature de cape inconnue, harvest requis : **Grady Makiobo**
  (BEL, 3 capes, type inconnu), **Collins Muhindo** (Burundi, 2 capes, type inconnu).
- **2 DIVERGENCES à trancher (décision Alexandre)** :
  - **Jorthy Mokio** : ELIGIBLE en base, 1 cape **compétitive** BEL à 17 ans →
    la règle dit **SWITCHABLE** (cap-tied mais switchable ; fenêtre 3 ans = 2028).
  - **Roméo Lavia** : INELIGIBLE en base, 1 cape **amicale** BEL (2023, 19 ans) →
    la règle dit **SWITCHABLE** (amical ne verrouille pas). **MAIS** conflit avec
    la mémoire `switchable-enrichment` (« retiré après vérif cape A ») →
    **re-vérifier la nature réelle de sa cape** (amicale ou compét ?) avant de flipper.

## Phases restantes

- **Phase 2 — Harvest ciblé (~319 max, en réalité quelques dizaines).** Pour les
  capés A étranger, renseigner proprement `caps_other_count`,
  `first_other_cap_type` (compétitive/amicale), `first_other_cap_date`, et un
  futur flag `cap_in_final_tournament`. Sources : edge fn `harvest-apifootball`
  (existante) ; **API FIFA change-of-association** (mémoire `fifa-coa-api`, JSON
  ouvert sans clé) = source autoritaire directe sur qui peut switcher.
- **Phase 3 — Promotion en fonction déterministe** qui écrit
  `computed_eligibility_status` **pour le seul sous-ensemble capé**, avec gate de
  validation humaine, sans toucher aux prospects non capés. Le trigger PROD-1
  propage ensuite le legacy automatiquement.

**Le goulot n'est pas la logique (posée ici), c'est la nature des capes.** Un
harvest de quelques dizaines de joueurs suffit à fermer le calcul.
