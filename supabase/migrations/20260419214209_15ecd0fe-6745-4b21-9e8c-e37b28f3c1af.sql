-- Ma Liste des 26: user-built squads
CREATE TABLE public.user_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  formation text NOT NULL CHECK (formation IN ('4-3-3', '4-2-3-1', '3-5-2')),
  starting_xi jsonb NOT NULL,
  bench jsonb NOT NULL,
  captain_id bigint REFERENCES public.players(id) ON DELETE SET NULL,

  radar_count int NOT NULL DEFAULT 0,
  roster_count int NOT NULL DEFAULT 0,
  avg_age numeric(4,1),
  total_market_value_eur bigint,

  user_agent text,
  locale text DEFAULT 'fr',
  referrer text,

  is_submitted boolean NOT NULL DEFAULT false,
  shared_count int NOT NULL DEFAULT 0,
  platforms_shared text[] NOT NULL DEFAULT ARRAY[]::text[]
);

CREATE INDEX idx_user_lists_session ON public.user_lists(session_id);
CREATE INDEX idx_user_lists_created ON public.user_lists(created_at DESC);
CREATE INDEX idx_user_lists_email ON public.user_lists(email) WHERE email IS NOT NULL;
CREATE INDEX idx_user_lists_submitted ON public.user_lists(is_submitted) WHERE is_submitted = true;

ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a list"
ON public.user_lists FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update a list"
ON public.user_lists FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Submitted lists are publicly readable"
ON public.user_lists FOR SELECT
TO anon, authenticated
USING (is_submitted = true);

CREATE TRIGGER update_user_lists_updated_at
BEFORE UPDATE ON public.user_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();