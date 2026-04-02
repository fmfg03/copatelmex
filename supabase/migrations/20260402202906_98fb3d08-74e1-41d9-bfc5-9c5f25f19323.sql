-- 1. Fix tournament_config: restrict public SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view tournament config" ON public.tournament_config;
CREATE POLICY "Authenticated users can view tournament config"
  ON public.tournament_config FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix match_cedulas: restrict public SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view match cedulas" ON public.match_cedulas;
CREATE POLICY "Authenticated users can view match cedulas"
  ON public.match_cedulas FOR SELECT
  TO authenticated
  USING (true);

-- 3. Ensure registration-documents bucket exists and is PRIVATE
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-documents', 'registration-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;