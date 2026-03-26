-- Fix security definer view
DROP VIEW IF EXISTS public.teams_public;
CREATE VIEW public.teams_public WITH (security_invoker = true) AS
SELECT id, team_name, academy_name, shield_url, state, country
FROM public.teams;