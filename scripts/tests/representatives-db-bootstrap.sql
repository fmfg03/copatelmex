CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE SCHEMA auth;
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION public.has_role(uid uuid, role public.app_role) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT uid IS NOT NULL AND coalesce(current_setting('test.role', true), '') = role::text $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
