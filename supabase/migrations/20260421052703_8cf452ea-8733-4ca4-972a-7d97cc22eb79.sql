-- Add slug, pseudo, share_image_url to user_lists
ALTER TABLE public.user_lists
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS pseudo text,
  ADD COLUMN IF NOT EXISTS share_image_url text;

-- Unique index on slug (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS user_lists_slug_key ON public.user_lists (slug) WHERE slug IS NOT NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS user_lists_is_submitted_idx ON public.user_lists (is_submitted) WHERE is_submitted = true;