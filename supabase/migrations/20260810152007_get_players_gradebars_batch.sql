-- Batch de get_player_gradebars : percentiles de plusieurs joueurs en un appel
-- (mode Empreintes du roster). Reutilise la logique existante -> auto-fraiche.
-- Idempotent (CREATE OR REPLACE). Deja appliquee en base via MCP le 2026-08.
create or replace function public.get_players_gradebars(p_slugs text[])
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  s text;
  one jsonb;
  out jsonb := '[]'::jsonb;
begin
  foreach s in array p_slugs loop
    one := public.get_player_gradebars(s);
    if one is not null then
      out := out || jsonb_build_array(jsonb_build_object(
        'slug', s,
        'pool_label', one->'pool_label',
        'axes', one->'axes'
      ));
    end if;
  end loop;
  return out;
end;
$function$;

grant execute on function public.get_players_gradebars(text[]) to anon;
