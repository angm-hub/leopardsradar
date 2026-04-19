-- Confirm subscription via token (double opt-in)
CREATE OR REPLACE FUNCTION public.confirm_newsletter_subscription(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.newsletter_subscribers%ROWTYPE;
BEGIN
  SELECT * INTO _row
  FROM public.newsletter_subscribers
  WHERE confirmation_token = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF _row.is_active AND _row.confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_confirmed', 'email', _row.email);
  END IF;

  UPDATE public.newsletter_subscribers
  SET is_active = true,
      confirmed_at = COALESCE(confirmed_at, now()),
      unsubscribed_at = NULL,
      updated_at = now()
  WHERE id = _row.id;

  RETURN jsonb_build_object('status', 'confirmed', 'email', _row.email);
END;
$$;

-- Unsubscribe via token
CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.newsletter_subscribers%ROWTYPE;
BEGIN
  SELECT * INTO _row
  FROM public.newsletter_subscribers
  WHERE confirmation_token = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  UPDATE public.newsletter_subscribers
  SET is_active = false,
      unsubscribed_at = now(),
      updated_at = now()
  WHERE id = _row.id;

  RETURN jsonb_build_object('status', 'unsubscribed', 'email', _row.email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_newsletter_subscription(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(uuid) TO anon, authenticated;