CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kickoff_at timestamp with time zone NOT NULL,
  opponent_name text NOT NULL,
  opponent_code text,
  opponent_flag text,
  competition text NOT NULL,
  venue text,
  city text,
  country text,
  home_or_away text NOT NULL DEFAULT 'neutral' CHECK (home_or_away IN ('home','away','neutral')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished','cancelled','postponed')),
  score_rdc integer,
  score_opponent integer,
  is_published boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_kickoff ON public.matches(kickoff_at);
CREATE INDEX idx_matches_status ON public.matches(status);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published matches are publicly viewable"
  ON public.matches FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();