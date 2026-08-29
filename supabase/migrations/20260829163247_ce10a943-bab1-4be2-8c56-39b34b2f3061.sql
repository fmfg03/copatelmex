DROP POLICY IF EXISTS "Authenticated users can read match_lineups" ON public.match_lineups;
DROP POLICY IF EXISTS "Authenticated users can read match_events" ON public.match_events;

CREATE POLICY "Scoped read match_lineups"
ON public.match_lineups
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = match_lineups.team_id AND t.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_lineups.match_id AND m.status = 'completed'
  )
);

CREATE POLICY "Scoped read match_events"
ON public.match_events
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = match_events.team_id AND t.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_events.match_id AND m.status = 'completed'
  )
);