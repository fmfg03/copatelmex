-- Close remaining security advisor findings for checkout, email webhook, and invitation usage.

-- Invitation usage rows must not be forgeable by authenticated clients.
DROP POLICY IF EXISTS "Authenticated can insert invitation uses" ON public.invitation_uses;
REVOKE INSERT ON public.invitation_uses FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.redeem_invitation_code(p_code text)
RETURNS TABLE (
  redeemed boolean,
  invitation_id uuid,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invitation public.invitations%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'not_authenticated'::text;
    RETURN;
  END IF;

  SELECT *
  INTO v_invitation
  FROM public.invitations
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'not_found'::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.invitation_uses iu
    WHERE iu.invitation_id = v_invitation.id
      AND iu.user_id = v_user_id
  ) THEN
    RETURN QUERY SELECT false, v_invitation.id, 'already_redeemed'::text;
    RETURN;
  END IF;

  IF COALESCE(v_invitation.is_active, false) IS NOT TRUE THEN
    RETURN QUERY SELECT false, v_invitation.id, 'inactive'::text;
    RETURN;
  END IF;

  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at <= now() THEN
    RETURN QUERY SELECT false, v_invitation.id, 'expired'::text;
    RETURN;
  END IF;

  IF v_invitation.max_uses IS NOT NULL
     AND COALESCE(v_invitation.current_uses, 0) >= v_invitation.max_uses THEN
    RETURN QUERY SELECT false, v_invitation.id, 'max_uses_reached'::text;
    RETURN;
  END IF;

  INSERT INTO public.invitation_uses (invitation_id, user_id)
  VALUES (v_invitation.id, v_user_id);

  UPDATE public.invitations
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = v_invitation.id;

  RETURN QUERY SELECT true, v_invitation.id, 'redeemed'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_invitation_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_invitation_code(text) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invitation_uses_invitation_id_user_id_key'
      AND conrelid = 'public.invitation_uses'::regclass
  ) THEN
    ALTER TABLE public.invitation_uses
      ADD CONSTRAINT invitation_uses_invitation_id_user_id_key UNIQUE (invitation_id, user_id);
  END IF;
END $$;
