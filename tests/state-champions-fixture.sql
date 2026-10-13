-- Minimal fixture for a NEW disposable PostgreSQL database only.
-- Simulates auth.uid(), role lookup and storage metadata; not a full Supabase stack.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE auth.users (id uuid PRIMARY KEY, aud text, role text, email text);
CREATE TABLE public.user_roles (id uuid DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users, role public.app_role);
CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,metadata jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
