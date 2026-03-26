
-- Match lineups table
CREATE TABLE public.match_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  jersey_number INTEGER,
  is_starter BOOLEAN NOT NULL DEFAULT true,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Match events table
CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  minute INTEGER,
  notes TEXT,
  related_player_id UUID REFERENCES public.players(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Admin/moderator can manage lineups
CREATE POLICY "Admins can manage match_lineups" ON public.match_lineups
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Everyone can read lineups
CREATE POLICY "Anyone can read match_lineups" ON public.match_lineups
  FOR SELECT TO anon, authenticated USING (true);

-- Admin/moderator can manage events
CREATE POLICY "Admins can manage match_events" ON public.match_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Everyone can read events
CREATE POLICY "Anyone can read match_events" ON public.match_events
  FOR SELECT TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX idx_match_lineups_match_id ON public.match_lineups(match_id);
CREATE INDEX idx_match_events_match_id ON public.match_events(match_id);
