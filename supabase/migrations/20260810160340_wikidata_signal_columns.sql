-- Signaux d'eligibilite Wikidata (citoyennete P27, selections nationales P54,
-- pays de naissance). Colonnes additives + RPC de remplissage COALESCE.
-- Ne touche JAMAIS computed_eligibility_status (signal != verdict).
-- Idempotent. Deja appliquee en base via MCP le 2026-08.
alter table players
  add column if not exists wikidata_qid text,
  add column if not exists wikidata_citizenships text,
  add column if not exists wikidata_national_teams text,
  add column if not exists wikidata_checked_at timestamptz;

comment on column players.wikidata_citizenships is 'Signal Wikidata P27 (citoyennetes) — source secondaire, a reviser';
comment on column players.wikidata_national_teams is 'Signal Wikidata P54 filtre selections nationales (inclut jeunes) — signal cap-tied a reviser, JAMAIS un verdict';
comment on column players.wikidata_checked_at is 'Horodatage du dernier scan Wikidata (rempli meme si aucun match, pour resumabilite)';

create or replace function apply_wikidata_signals(rows jsonb)
returns void language plpgsql security definer as $$
declare r jsonb;
begin
  for r in select * from jsonb_array_elements(rows) loop
    update players p set
      country_of_birth       = coalesce(p.country_of_birth, nullif(r->>'country_of_birth','')),
      wikidata_qid           = coalesce(p.wikidata_qid, nullif(r->>'wikidata_qid','')),
      wikidata_citizenships  = coalesce(p.wikidata_citizenships, nullif(r->>'wikidata_citizenships','')),
      wikidata_national_teams= coalesce(p.wikidata_national_teams, nullif(r->>'wikidata_national_teams','')),
      wikidata_checked_at    = now()
    where p.id = (r->>'id')::int;
  end loop;
end $$;

grant execute on function apply_wikidata_signals(jsonb) to anon;
