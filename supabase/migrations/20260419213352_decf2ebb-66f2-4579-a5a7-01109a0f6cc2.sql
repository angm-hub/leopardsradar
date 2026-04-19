-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security-definer helper (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3. RLS on user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- (No INSERT/UPDATE/DELETE policies => only service role can mutate)

-- 4. Admin write access on players (public SELECT policy already exists)
CREATE POLICY "Admins can insert players"
ON public.players
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update players"
ON public.players
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete players"
ON public.players
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Storage policies for player-photos bucket (public read already implicit since bucket is public)
CREATE POLICY "Admins can upload player photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-photos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update player photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'player-photos'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'player-photos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete player photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'player-photos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Public can read player photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'player-photos');