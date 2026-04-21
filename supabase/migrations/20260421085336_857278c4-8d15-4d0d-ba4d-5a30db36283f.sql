-- 1. Remove unused email column (newsletter is coming soon, never populated)
ALTER TABLE public.user_lists DROP COLUMN IF EXISTS email;

-- 2. Tighten UPDATE policy: only session owner can update their own list
DROP POLICY IF EXISTS "Anyone can update a list" ON public.user_lists;

CREATE POLICY "Session owner can update own list"
  ON public.user_lists
  FOR UPDATE
  TO anon, authenticated
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
  WITH CHECK (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- 3. Fix SECURITY DEFINER view → security_invoker
ALTER VIEW public.v_home_stats SET (security_invoker = on);
