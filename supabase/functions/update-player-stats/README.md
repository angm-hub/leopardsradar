# `update-player-stats` — Edge Function

Pulls top scorers from football-data.org for the 10 main competitions and
updates `season_goals`, `season_assists`, `season_games`, `stats_updated_at`
in the `players` table for every Léopards Radar player whose name matches.

Hexagons on `/player/:slug` populate from these fields. Without this
function running, every fiche shows `—` for the universal axes.

---

## One-time setup

### 1. Get a free API key

Sign up at https://www.football-data.org/client/register (free tier =
10 requests / minute, enough for the 10 competitions we hit).

The key arrives by email. It looks like a 32-char hex string.

### 2. Set the function secrets

In Supabase Dashboard for the canonical project (org **kAIra**, ref
`pvpshyoaregroihwglye`):

> Project Settings → Edge Functions → Secrets → Add new secret

Add **two** secrets:

| Name | Value |
| --- | --- |
| `FOOTBALL_DATA_API_KEY` | The key from step 1 |
| `PIPELINE_SECRET` | A random opaque string (e.g. output of `openssl rand -hex 32`). Save it locally too, the cron job needs it. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically
by the runtime — do NOT set them manually.

### 3. Smoke test

```bash
PIPELINE_SECRET="<the-secret-you-just-set>"

curl -X POST \
  -H "Authorization: Bearer $PIPELINE_SECRET" \
  https://pvpshyoaregroihwglye.supabase.co/functions/v1/update-player-stats
```

Expected payload (after ~75 s — the function paces itself to respect the
free-tier rate limit):

```json
{
  "ok": true,
  "competitions": 10,
  "players_in_db": 467,
  "matched": 18,
  "updated": 18,
  "errors": []
}
```

`matched` = number of footdata.org scorers found in our DB.
`updated` = number of `players` rows successfully written.

---

## Schedule (weekly cron)

Once the smoke test passes, add the schedule via the Supabase SQL Editor.
Replace `<PIPELINE_SECRET>` with the actual value.

```sql
-- Enable the cron + http extensions if they aren't already
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Drop any previous schedule of this name
select cron.unschedule('lr-update-player-stats')
where exists (select 1 from cron.job where jobname = 'lr-update-player-stats');

-- Sundays 23:05 UTC ≈ 00:05 / 01:05 Europe/Paris depending on DST.
-- Picked an off-:00 minute so we're not part of every cron user's Sunday spike.
select cron.schedule(
  'lr-update-player-stats',
  '5 23 * * 0',
  $$
  select net.http_post(
    url := 'https://pvpshyoaregroihwglye.supabase.co/functions/v1/update-player-stats',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <PIPELINE_SECRET>'
    )
  );
  $$
);
```

Inspect runs:

```sql
select jobid, jobname, schedule, command from cron.job;
select * from cron.job_run_details where jobid =
  (select jobid from cron.job where jobname = 'lr-update-player-stats')
  order by start_time desc limit 5;
```

---

## What this function does NOT do (yet)

- **Minutes per player** — football-data.org's `/scorers` endpoint
  doesn't expose this. We'd need `/persons/{id}/matches` per player which
  is too API-heavy for the free tier. Leave manual or upgrade to a paid
  tier (Sportmonks, StatsBomb).
- **Defensive stats** (tackles, interceptions, clean sheets) — same
  limitation; the free API has no advanced metrics. The `Activité`
  axis on midfielders and the `Solidité` / `Construction` axes on
  defenders, plus the goalkeeper axes, will keep showing `—` until a
  paid integration is added.
- **Discovery of new players** — this function only enriches existing
  rows. Catching players like Nathan Mbala the day they make their pro
  debut requires a separate scout pipeline (Soccerway scrape +
  editorial monitoring — see methodologie page).
- **Player-to-API mapping resilience** — we match by exact normalised
  name. False negatives possible if football-data.org spells a name
  differently (e.g. `Ngal'ayel Mukau` vs `N. Mukau`). When you spot a
  miss, fix the LR `players.name` to match the football-data.org canonical
  spelling and re-run.

---

## Manual invocation (cron-less)

If you ever need to trigger the run manually outside the schedule (e.g.
right after a transfer window closes), the same `curl` from step 3 works
any time. The function is idempotent — running it twice in a row updates
the same rows with the same values.

---

## Deployment

Already deployed to project `pvpshyoaregroihwglye` (status ACTIVE,
`verify_jwt = false`). To redeploy after editing `index.ts`:

```bash
# from anywhere with Supabase CLI installed and logged in
supabase functions deploy update-player-stats \
  --project-ref pvpshyoaregroihwglye \
  --no-verify-jwt
```

Or have me redeploy via MCP — I have direct access to the project.
