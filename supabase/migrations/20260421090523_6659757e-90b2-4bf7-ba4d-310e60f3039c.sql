
-- 1) Move pg_net to extensions schema (drop + recreate)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- 2) user_lists: add edit_token + tighten policies
ALTER TABLE public.user_lists
  ADD COLUMN IF NOT EXISTS edit_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_user_lists_edit_token ON public.user_lists(edit_token);

DROP POLICY IF EXISTS "Anyone can insert a list" ON public.user_lists;
DROP POLICY IF EXISTS "Session owner can update own list" ON public.user_lists;
DROP POLICY IF EXISTS "Submitted lists are publicly readable" ON public.user_lists;

CREATE POLICY "Anyone can create a draft list"
ON public.user_lists
FOR INSERT
TO anon, authenticated
WITH CHECK (shared_count = 0);

CREATE POLICY "Token holder can update own list"
ON public.user_lists
FOR UPDATE
TO anon, authenticated
USING (edit_token::text = ((current_setting('request.headers', true))::json ->> 'x-edit-token'))
WITH CHECK (edit_token::text = ((current_setting('request.headers', true))::json ->> 'x-edit-token'));

CREATE POLICY "Submitted lists public or owner via token"
ON public.user_lists
FOR SELECT
TO anon, authenticated
USING (
  is_submitted = true
  OR edit_token::text = ((current_setting('request.headers', true))::json ->> 'x-edit-token')
);

-- 3) storage.objects: restrict player-photos SELECT to portraits/* prefix only
DROP POLICY IF EXISTS "Player photos publicly readable by exact path" ON storage.objects;

CREATE POLICY "Player portraits publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'player-photos'
  AND (storage.foldername(name))[1] = 'portraits'
);
