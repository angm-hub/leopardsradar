DROP INDEX IF EXISTS public.matches_external_id_key;
ALTER TABLE public.matches ADD CONSTRAINT matches_external_id_unique UNIQUE (external_id);