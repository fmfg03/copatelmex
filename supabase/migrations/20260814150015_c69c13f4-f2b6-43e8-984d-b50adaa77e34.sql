-- 1. Teams: prevent self-approval
CREATE OR REPLACE FUNCTION public.prevent_team_status_selfupdate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'moderator'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'No autorizado: el estado del equipo solo puede ser modificado por administradores';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'No autorizado: no se puede transferir la propiedad del equipo';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_team_status_selfupdate ON public.teams;
CREATE TRIGGER trg_prevent_team_status_selfupdate
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.prevent_team_status_selfupdate();

DROP POLICY IF EXISTS "Users can update their own teams" ON public.teams;
CREATE POLICY "Users can update their own teams"
ON public.teams FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Registrations: block payment fields on INSERT for non-admins
CREATE OR REPLACE FUNCTION public.prevent_payment_field_selfinsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.payment_status := 'pending';
  NEW.payment_amount := NULL;
  NEW.payment_date := NULL;
  NEW.payment_reference := NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_payment_field_selfinsert ON public.registrations;
CREATE TRIGGER trg_prevent_payment_field_selfinsert
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.prevent_payment_field_selfinsert();

-- 3. Match lineups/events: no anonymous reads
DROP POLICY IF EXISTS "Anyone can read match_lineups" ON public.match_lineups;
CREATE POLICY "Authenticated users can read match_lineups"
ON public.match_lineups FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can read match_events" ON public.match_events;
CREATE POLICY "Authenticated users can read match_events"
ON public.match_events FOR SELECT TO authenticated
USING (true);

REVOKE SELECT ON public.match_lineups FROM anon;
REVOKE SELECT ON public.match_events FROM anon;
GRANT SELECT ON public.match_lineups TO authenticated;
GRANT SELECT ON public.match_events TO authenticated;