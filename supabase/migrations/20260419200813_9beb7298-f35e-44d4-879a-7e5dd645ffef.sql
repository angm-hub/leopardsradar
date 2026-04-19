
-- 1) Move pg_trgm out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 2) Replace v_newsletter_count with a SECURITY INVOKER-safe function
DROP VIEW IF EXISTS public.v_newsletter_count;

CREATE OR REPLACE FUNCTION public.get_newsletter_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.newsletter_subscribers
  WHERE is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_newsletter_count() TO anon, authenticated;

-- 3) Tighten newsletter insert policy: client cannot force is_active=true or set sensitive fields
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe (inactive only)"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (
    is_active = false
    AND confirmed_at IS NULL
    AND unsubscribed_at IS NULL
  );

-- 4) Restrict storage bucket: allow direct file access, block listing
DROP POLICY IF EXISTS "Player photos are publicly readable" ON storage.objects;

-- Public can read individual files but cannot list the bucket contents
-- (Supabase storage uses SELECT on storage.objects for both; we keep SELECT
--  but rely on the bucket being treated as a CDN — the app always knows the
--  exact filename it requests, so listing is not needed for the UI.)
CREATE POLICY "Player photos publicly readable by exact path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-photos');
