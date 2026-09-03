# Etat du schema Supabase — Leopards Radar

Derniere mise a jour : 2026-09-03 (audit SCHEMA-1).

## Projet de production

**Ref : `pvpshyoaregroihwglye`** (`https://pvpshyoaregroihwglye.supabase.co`).
C'est le projet que lit le frontend (`src/integrations/supabase/client.ts`) et
ou vivent les donnees. C'est la seule source de verite.

Le `config.toml` pointait par erreur sur `dpykmhmdgvmqcehjuusn` (ancien projet
Lovable). Corrige le 2026-09-03.

## La derive (SCHEMA-1)

Il existe **deux historiques de migrations qui ne coincident pas** :

- **Distant** (store de migrations du projet prod) : 80+ migrations, de mai 2026
  jusqu'a `20260903175854_prod1_eligibility_coherence_engine`. La base **est**
  reproductible depuis cet historique distant.
- **Local** (`supabase/migrations/`) : ~24 fichiers seulement, noms UUID Lovable,
  qui s'arretent au 11 aout 2026. **Perime.** Il ne reflete ni l'etat reel de la
  prod, ni les 80+ migrations distantes.

Consequence : **ne jamais lancer `supabase db push` depuis ce repo** — il
appliquerait les vieux fichiers locaux contre un historique distant different et
casserait tout.

## Reconciliation propre (a faire par Alexandre, une fois)

Necessite le CLI Supabase (absent de la machine) + le **mot de passe DB**
(dashboard > Settings > Database). Etapes :

```bash
npm i -g supabase                       # ou: brew install supabase/tap/supabase
cd 13-ressources-tierces/leopardsradar
supabase link --project-ref pvpshyoaregroihwglye
supabase db pull                        # regenere un baseline propre depuis la prod
# puis committer la migration baseline generee, et archiver les 24 vieux fichiers
```

Apres ce `db pull`, le dossier `migrations/` refletera la prod et sera
reproductible. Les migrations posees via le MCP (`apply_migration`) depuis mai
sont deja enregistrees cote distant ; `db pull` les capturera dans un baseline.

## En attendant

- `schema-snapshot-players-2026-09-03.sql` : instantane fidele (introspection)
  de la table `players` en prod (130 colonnes, 9 contraintes, 21 index, 2
  policies RLS, 3 triggers). Reference lisible, **pas** une migration a rejouer.
- Migrations recentes posees via MCP et deja cote distant : `prod1_eligibility_coherence_engine`
  (trigger de coherence, PROD-1) et la serie `onomastic_*` (02/09).
