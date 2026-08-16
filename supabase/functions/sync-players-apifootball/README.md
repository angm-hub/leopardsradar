# sync-players-apifootball

Edge function qui récupère les statistiques de saison (matchs, buts, passes,
minutes, note) via **API-Football (api-sports v3)** et les écrit dans
`public.players` pour nourrir le **score Léopards**.

## Pourquoi
Le RPC `compute_leopards_score` active le score dès **2 axes disponibles** :
- **A1 impact** = (buts + passes) / 90 min, si `season_minutes >= 450`
- **A2 volume** = `season_minutes`
- A3 valeur marchande, A4 sélections

Remplir `season_minutes` (et buts/passes) débloque A1 + A2, donc le score.
La colonne `season_rating` alimente en plus l'axe note côté client
(`src/lib/playerScores.ts`, garde `games >= 3 || minutes >= 270`).

## Ce qu'elle fait
1. Sélectionne les joueurs actifs non ineligibles (filtres `only_confirmed`,
   `only_missing_stats`), les plus anciens `stats_updated_at` d'abord.
2. Résout l'id API-Football : sentinel `transfermarkt_id = 'apf-<N>'`, sinon
   recherche par nom de famille + **date de naissance stricte**.
3. `GET /players?id=<apf>&season=<year>`, agrège les `statistics[]` (un bloc
   par compétition), note = moyenne pondérée par minutes.
4. `update players set season_games/goals/assists/minutes/rating, stats_updated_at`.
   Garde anti-écrasement : ne remplace pas des stats existantes par des zéros.
5. Log dans `sync_logs` (`job_name = sync-players-apifootball`).

## Config (déjà en place)
- `app_config.apifootball_key` : clé api-sports (Pro).
- `app_config.players_sync_token` : token partagé (auth header `x-sync-token`).
- Déployée avec `verify_jwt=false` (auth custom par token).

## Invocation
```bash
curl -sS -X POST "https://<project>.supabase.co/functions/v1/sync-players-apifootball" \
  -H "Content-Type: application/json" \
  -H "x-sync-token: <players_sync_token>" \
  -d '{"season":2025,"limit":50,"only_confirmed":true,"only_missing_stats":true}'
```
Body : `season` (année de début, défaut 2025), `limit` (max 300),
`only_confirmed` (TIER1/TIER2), `only_missing_stats` (défaut true),
`persist_apf_id` (écrit `apf-<N>` dans un `transfermarkt_id` vide).

Après un run, relancer le scoring :
```sql
select public.compute_leopards_scores_all();
select public.refresh_player_levels(null);
```

## Limite connue
Le rendement dépend de la **couverture API-Football**. Le vivier Léopards est
majoritairement composé de jeunes/amateurs en ligues non couvertes (National FR,
U19, régional) et de vétérans sans stats récentes : ceux-là ne ressortent pas.
La fonction enrichit les **pros actifs en ligues couvertes** (Ligue 1/2, Pro
League BE, etc.). C'est le complément d'`sync-stats-multi` (FBRef mort) sans
Cloudflare.

## Rate limit
`/players` = 1 requête par joueur par saison, + 1 requête de résolution si non
mappé. Pacing 350 ms intégré. Clé Pro requise pour dépasser ~100 req/jour.
