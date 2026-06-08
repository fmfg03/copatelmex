
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
