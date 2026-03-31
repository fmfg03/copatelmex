-- Fix contact_messages: keep public but validate non-empty fields instead of bare true
DROP POLICY IF EXISTS "Anyone can send contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can send contact messages"
  ON public.contact_messages
  FOR INSERT
  TO public
  WITH CHECK (
    length(name) > 0 AND length(email) > 0 AND length(message) > 0
  );

-- Fix survey_responses: validate rating range instead of bare true
DROP POLICY IF EXISTS "Anyone can insert survey responses" ON public.survey_responses;
CREATE POLICY "Anyone can insert survey responses"
  ON public.survey_responses
  FOR INSERT
  TO public
  WITH CHECK (
    rating >= 1 AND rating <= 5
  );