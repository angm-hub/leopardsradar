CREATE TABLE public.best_xi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  formation text NOT NULL CHECK (formation IN ('4-3-3','4-2-3-1','3-5-2')),
  players jsonb NOT NULL,
  editorial_note text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_best_xi_published ON public.best_xi (is_published, published_at DESC);

ALTER TABLE public.best_xi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published Best XI are publicly viewable"
  ON public.best_xi FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can insert best xi"
  ON public.best_xi FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update best xi"
  ON public.best_xi FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete best xi"
  ON public.best_xi FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_best_xi_updated_at
  BEFORE UPDATE ON public.best_xi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed first published Best XI (4-3-3) with real roster players
INSERT INTO public.best_xi (title, formation, players, editorial_note, is_published, published_at)
VALUES (
  'Édition #15 — Le onze qui fait rêver',
  '4-3-3',
  '[
    {"position":"GK","player_id":428,"label":"1"},
    {"position":"RB","player_id":409,"label":"2"},
    {"position":"CB","player_id":717,"label":"4"},
    {"position":"CB","player_id":527,"label":"5"},
    {"position":"LB","player_id":438,"label":"3"},
    {"position":"CM","player_id":531,"label":"6"},
    {"position":"CM","player_id":753,"label":"8"},
    {"position":"CM","player_id":577,"label":"10"},
    {"position":"RW","player_id":593,"label":"7"},
    {"position":"ST","player_id":870,"label":"9"},
    {"position":"LW","player_id":726,"label":"11"}
  ]'::jsonb,
  'Mbemba en patron, Sadiki en métronome, Wissa en pointe : un onze qui mêle expérience et insolence. Bakambu sur le banc, ça veut tout dire sur la profondeur du vivier.',
  true,
  now()
);