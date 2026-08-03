-- Harden sensitive reads reported by Supabase security advisors.

-- Invitation codes must not be listed directly by public or authenticated users.
DROP POLICY IF EXISTS "Anyone can validate invitation codes" ON public.invitations;

CREATE OR REPLACE FUNCTION public.validate_invitation_code(p_code text)
RETURNS TABLE (
  valid boolean,
  invitation_id uuid,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invitation public.invitations%ROWTYPE;
BEGIN
  SELECT *
  INTO v_invitation
  FROM public.invitations
  WHERE code = p_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'not_found'::text;
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

  RETURN QUERY SELECT true, v_invitation.id, 'valid'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_invitation_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation_code(text) TO anon, authenticated;

-- Bank account fields live in tournament_config, so direct reads are admin-only.
DROP POLICY IF EXISTS "Anyone can view tournament config" ON public.tournament_config;
DROP POLICY IF EXISTS "Authenticated users can view tournament config" ON public.tournament_config;
DROP POLICY IF EXISTS "Admins can view tournament config" ON public.tournament_config;
CREATE POLICY "Admins can view tournament config"
  ON public.tournament_config
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Preserve a non-sensitive public configuration projection.
CREATE OR REPLACE VIEW public.tournament_config_public
WITH (security_invoker = true) AS
SELECT
  id,
  registration_enabled,
  max_players_per_team,
  min_players_per_team,
  max_teams_per_category,
  require_photo,
  require_birth_certificate,
  require_curp,
  require_medical_certificate,
  created_at,
  updated_at
FROM public.tournament_config;

GRANT SELECT ON public.tournament_config_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_tournament_config()
RETURNS TABLE (
  id uuid,
  registration_enabled boolean,
  max_players_per_team integer,
  min_players_per_team integer,
  max_teams_per_category integer,
  require_photo boolean,
  require_birth_certificate boolean,
  require_curp boolean,
  require_medical_certificate boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    tc.id,
    tc.registration_enabled,
    tc.max_players_per_team,
    tc.min_players_per_team,
    tc.max_teams_per_category,
    tc.require_photo,
    tc.require_birth_certificate,
    tc.require_curp,
    tc.require_medical_certificate,
    tc.created_at,
    tc.updated_at
  FROM public.tournament_config tc;
$$;

REVOKE ALL ON FUNCTION public.get_public_tournament_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tournament_config() TO anon, authenticated;

-- Sensitive team owner fields must only be visible to owners and staff.
DROP POLICY IF EXISTS "Users can view all teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners and staff can view teams" ON public.teams;
CREATE POLICY "Team owners and staff can view teams"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  );

-- Keep a sanitized public team projection for public schedules/standings.
CREATE OR REPLACE VIEW public.teams_public
WITH (security_invoker = true) AS
SELECT id, team_name, academy_name, shield_url, state, country
FROM public.teams;

GRANT SELECT ON public.teams_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_teams(p_team_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  team_name text,
  academy_name text,
  shield_url text,
  state text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t.id, t.team_name, t.academy_name, t.shield_url, t.state, t.country
  FROM public.teams t
  WHERE p_team_ids IS NULL OR t.id = ANY(p_team_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_teams(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_teams(uuid[]) TO anon, authenticated;

-- Referee cédula reports are operational records, not broadly authenticated data.
DROP POLICY IF EXISTS "Anyone can view match cedulas" ON public.match_cedulas;
DROP POLICY IF EXISTS "Authenticated users can view match cedulas" ON public.match_cedulas;
DROP POLICY IF EXISTS "Admins and moderators can view match cedulas" ON public.match_cedulas;
CREATE POLICY "Admins and moderators can view match cedulas"
  ON public.match_cedulas
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  );

-- Public media objects may be fetched by known public URLs, but buckets must not
-- be listable by anonymous users.
DROP POLICY IF EXISTS "Public can view gallery media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view news images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can list gallery media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can list news images" ON storage.objects;

CREATE POLICY "Admins can list gallery media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'gallery-media'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can list news images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'news-images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
