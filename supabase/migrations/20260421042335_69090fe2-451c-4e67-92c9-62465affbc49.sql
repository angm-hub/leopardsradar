-- Add columns to matches table for external sync
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
CREATE UNIQUE INDEX IF NOT EXISTS matches_external_id_key ON public.matches(external_id) WHERE external_id IS NOT NULL;

-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;