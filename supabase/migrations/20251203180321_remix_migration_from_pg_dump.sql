CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: calculate_check_digit(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_check_digit(id_base text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  sum INTEGER := 0;
  i INTEGER;
  char_code INTEGER;
  check_digit INTEGER;
BEGIN
  -- Calculate sum of ASCII codes multiplied by position
  FOR i IN 1..length(id_base) LOOP
    char_code := ascii(substring(id_base from i for 1));
    sum := sum + (char_code * i);
  END LOOP;
  
  -- Calculate check digit using modulo 11
  check_digit := sum % 11;
  
  -- Return check digit (0-9, X for 10)
  IF check_digit = 10 THEN
    RETURN 'X';
  ELSE
    RETURN check_digit::TEXT;
  END IF;
END;
$$;


--
-- Name: can_access_player(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_player(_user_id uuid, _registration_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.registrations r
    INNER JOIN public.teams t ON r.team_id = t.id
    WHERE r.id = _registration_id
      AND t.user_id = _user_id
  )
$$;


--
-- Name: generate_payment_reference(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_payment_reference() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_reference TEXT;
  reference_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar código aleatorio de 6 dígitos
    new_reference := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Verificar si ya existe
    SELECT EXISTS(
      SELECT 1 FROM registrations WHERE payment_reference = new_reference
    ) INTO reference_exists;
    
    -- Si no existe, salir del loop
    EXIT WHEN NOT reference_exists;
  END LOOP;
  
  RETURN new_reference;
END;
$$;


--
-- Name: generate_unique_player_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_player_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  paternal_initials TEXT;
  maternal_initial TEXT;
  first_initial TEXT;
  consecutive TEXT;
  base_id TEXT;
  check_digit TEXT;
  final_id TEXT;
BEGIN
  -- Skip if unique_player_id is already set
  IF NEW.unique_player_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if surnames are not set yet
  IF NEW.paternal_surname IS NULL OR NEW.maternal_surname IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extract initials (uppercase, remove spaces and special characters)
  paternal_initials := UPPER(LEFT(regexp_replace(NEW.paternal_surname, '[^A-Za-z]', '', 'g'), 2));
  maternal_initial := UPPER(LEFT(regexp_replace(NEW.maternal_surname, '[^A-Za-z]', '', 'g'), 1));
  first_initial := UPPER(LEFT(regexp_replace(NEW.first_name, '[^A-Za-z]', '', 'g'), 1));
  
  -- Ensure we have at least the minimum characters
  IF length(paternal_initials) < 2 THEN
    paternal_initials := RPAD(paternal_initials, 2, 'X');
  END IF;
  
  IF length(maternal_initial) < 1 THEN
    maternal_initial := 'X';
  END IF;
  
  IF length(first_initial) < 1 THEN
    first_initial := 'X';
  END IF;

  -- Get next consecutive number
  consecutive := LPAD(nextval('player_id_sequence')::TEXT, 3, '0');

  -- Build base ID
  base_id := 'CCA' || paternal_initials || maternal_initial || first_initial || consecutive;

  -- Calculate check digit
  check_digit := calculate_check_digit(base_id);

  -- Build final ID
  final_id := base_id || check_digit;

  -- Assign to player
  NEW.unique_player_id := final_id;

  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    new.email
  );
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: log_admin_action(text, text, uuid, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_admin_action(p_action text, p_table_name text, p_record_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Insert audit log
  INSERT INTO public.admin_audit_log (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    v_user_email,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$;


--
-- Name: log_player_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_player_access() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Log the access attempt
  INSERT INTO public.player_access_log (user_id, player_id, action)
  VALUES (auth.uid(), NEW.id, TG_OP);
  RETURN NEW;
END;
$$;


--
-- Name: set_payment_reference(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_payment_reference() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Solo generar si no viene ya con una referencia
  IF NEW.payment_reference IS NULL THEN
    NEW.payment_reference := generate_payment_reference();
  END IF;
  
  -- Establecer payment_status como pending si no viene definido
  IF NEW.payment_status IS NULL THEN
    NEW.payment_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_profiles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profiles_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_team_standings(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_team_standings(p_category_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Eliminar posiciones existentes para la categoría especificada o todas
  IF p_category_id IS NOT NULL THEN
    DELETE FROM team_standings WHERE category_id = p_category_id;
  ELSE
    DELETE FROM team_standings;
  END IF;

  -- Calcular y insertar nuevas posiciones
  INSERT INTO team_standings (
    team_id, 
    category_id, 
    played, 
    won, 
    drawn, 
    lost, 
    goals_for, 
    goals_against, 
    goal_difference, 
    points
  )
  SELECT 
    t.id as team_id,
    m.category_id,
    COUNT(m.id) as played,
    SUM(CASE 
      WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR
           (m.away_team_id = t.id AND m.away_score > m.home_score)
      THEN 1 ELSE 0 
    END) as won,
    SUM(CASE 
      WHEN m.status = 'finished' AND m.home_score = m.away_score
      THEN 1 ELSE 0 
    END) as drawn,
    SUM(CASE 
      WHEN (m.home_team_id = t.id AND m.home_score < m.away_score) OR
           (m.away_team_id = t.id AND m.away_score < m.home_score)
      THEN 1 ELSE 0 
    END) as lost,
    SUM(CASE 
      WHEN m.home_team_id = t.id THEN m.home_score
      WHEN m.away_team_id = t.id THEN m.away_score
      ELSE 0 
    END) as goals_for,
    SUM(CASE 
      WHEN m.home_team_id = t.id THEN m.away_score
      WHEN m.away_team_id = t.id THEN m.home_score
      ELSE 0 
    END) as goals_against,
    SUM(CASE 
      WHEN m.home_team_id = t.id THEN (m.home_score - m.away_score)
      WHEN m.away_team_id = t.id THEN (m.away_score - m.home_score)
      ELSE 0 
    END) as goal_difference,
    SUM(CASE 
      WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR
           (m.away_team_id = t.id AND m.away_score > m.home_score)
      THEN 3
      WHEN m.status = 'finished' AND m.home_score = m.away_score
      THEN 1
      ELSE 0 
    END) as points
  FROM teams t
  JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
  WHERE m.status = 'finished'
    AND (p_category_id IS NULL OR m.category_id = p_category_id)
  GROUP BY t.id, m.category_id;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_email text,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    year_born text,
    description text,
    max_players_per_team integer DEFAULT 15,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: featured_videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text,
    video_type text DEFAULT 'highlight'::text,
    category_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: gallery_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    category_id uuid,
    photo_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: live_streams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.live_streams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    match_id uuid,
    stream_url text NOT NULL,
    platform text NOT NULL,
    scheduled_time timestamp with time zone NOT NULL,
    status text DEFAULT 'scheduled'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    home_team_id uuid,
    away_team_id uuid,
    match_date timestamp with time zone NOT NULL,
    field_number text,
    phase text,
    home_score integer DEFAULT 0,
    away_score integer DEFAULT 0,
    status text DEFAULT 'scheduled'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT matches_phase_check CHECK ((phase = ANY (ARRAY['group'::text, 'round_16'::text, 'quarter'::text, 'semi'::text, 'final'::text, 'third_place'::text]))),
    CONSTRAINT matches_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'live'::text, 'finished'::text, 'cancelled'::text])))
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    image_url text,
    author_id uuid,
    published_at timestamp with time zone DEFAULT now(),
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: player_access_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_access_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    player_id uuid NOT NULL,
    action text NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address inet,
    user_agent text
);


--
-- Name: player_id_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.player_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: player_identification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_identification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid NOT NULL,
    identification_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: player_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid NOT NULL,
    match_id uuid NOT NULL,
    goals integer DEFAULT 0,
    assists integer DEFAULT 0,
    yellow_cards integer DEFAULT 0,
    red_cards integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    birth_date date NOT NULL,
    parent_name text NOT NULL,
    parent_email text NOT NULL,
    parent_phone text NOT NULL,
    jersey_number integer,
    "position" text,
    created_at timestamp with time zone DEFAULT now(),
    photo_url text,
    birth_certificate_url text,
    documents_verified boolean DEFAULT false,
    verification_notes text,
    documents_complete boolean DEFAULT false,
    curp text,
    paternal_surname text,
    maternal_surname text,
    unique_player_id text,
    CONSTRAINT valid_curp_format CHECK (((curp IS NULL) OR (curp ~ '^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$'::text)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text
);


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    category_id uuid NOT NULL,
    registration_date timestamp with time zone DEFAULT now(),
    payment_status text DEFAULT 'pending'::text,
    payment_amount numeric(10,2),
    payment_date timestamp with time zone,
    document_urls jsonb DEFAULT '[]'::jsonb,
    payment_reference text,
    notes text,
    CONSTRAINT registrations_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])))
);


--
-- Name: role_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    previous_role public.app_role,
    new_role public.app_role,
    changed_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_managers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_managers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    "position" text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    phone text NOT NULL
);


--
-- Name: team_standings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_standings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    category_id uuid NOT NULL,
    played integer DEFAULT 0,
    won integer DEFAULT 0,
    drawn integer DEFAULT 0,
    lost integer DEFAULT 0,
    goals_for integer DEFAULT 0,
    goals_against integer DEFAULT 0,
    goal_difference integer DEFAULT 0,
    points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    team_name text NOT NULL,
    academy_name text,
    shield_url text,
    state text NOT NULL,
    facebook_url text,
    instagram_url text,
    phone_country_code text DEFAULT '+52'::text,
    phone_number text NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    rejection_reason text,
    CONSTRAINT teams_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'paid'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: featured_videos featured_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_videos
    ADD CONSTRAINT featured_videos_pkey PRIMARY KEY (id);


--
-- Name: gallery_photos gallery_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_photos
    ADD CONSTRAINT gallery_photos_pkey PRIMARY KEY (id);


--
-- Name: live_streams live_streams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_streams
    ADD CONSTRAINT live_streams_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: player_access_log player_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_access_log
    ADD CONSTRAINT player_access_log_pkey PRIMARY KEY (id);


--
-- Name: player_identification player_identification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_identification
    ADD CONSTRAINT player_identification_pkey PRIMARY KEY (id);


--
-- Name: player_identification player_identification_player_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_identification
    ADD CONSTRAINT player_identification_player_id_key UNIQUE (player_id);


--
-- Name: player_stats player_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT player_stats_pkey PRIMARY KEY (id);


--
-- Name: player_stats player_stats_player_id_match_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT player_stats_player_id_match_id_key UNIQUE (player_id, match_id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: players players_unique_player_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_unique_player_id_key UNIQUE (unique_player_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_team_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_team_id_category_id_key UNIQUE (team_id, category_id);


--
-- Name: role_audit_log role_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_audit_log
    ADD CONSTRAINT role_audit_log_pkey PRIMARY KEY (id);


--
-- Name: team_managers team_managers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_managers
    ADD CONSTRAINT team_managers_pkey PRIMARY KEY (id);


--
-- Name: team_standings team_standings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_standings
    ADD CONSTRAINT team_standings_pkey PRIMARY KEY (id);


--
-- Name: team_standings team_standings_team_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_standings
    ADD CONSTRAINT team_standings_team_id_category_id_key UNIQUE (team_id, category_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: players unique_player_curp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT unique_player_curp UNIQUE (curp);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_admin_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log USING btree (created_at DESC);


--
-- Name: idx_admin_audit_log_table_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_table_name ON public.admin_audit_log USING btree (table_name);


--
-- Name: idx_admin_audit_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_user_id ON public.admin_audit_log USING btree (user_id);


--
-- Name: idx_featured_videos_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_videos_category ON public.featured_videos USING btree (category_id);


--
-- Name: idx_gallery_photos_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gallery_photos_category ON public.gallery_photos USING btree (category_id);


--
-- Name: idx_gallery_photos_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gallery_photos_date ON public.gallery_photos USING btree (photo_date DESC);


--
-- Name: idx_live_streams_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_live_streams_scheduled ON public.live_streams USING btree (scheduled_time DESC);


--
-- Name: idx_matches_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_category_id ON public.matches USING btree (category_id);


--
-- Name: idx_matches_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_date ON public.matches USING btree (match_date);


--
-- Name: idx_player_access_log_accessed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_access_log_accessed_at ON public.player_access_log USING btree (accessed_at DESC);


--
-- Name: idx_player_access_log_player_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_access_log_player_id ON public.player_access_log USING btree (player_id);


--
-- Name: idx_player_identification_player_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_identification_player_id ON public.player_identification USING btree (player_id);


--
-- Name: idx_player_stats_match_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_stats_match_id ON public.player_stats USING btree (match_id);


--
-- Name: idx_player_stats_player_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_stats_player_id ON public.player_stats USING btree (player_id);


--
-- Name: idx_players_curp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_players_curp ON public.players USING btree (curp);


--
-- Name: idx_players_documents_complete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_players_documents_complete ON public.players USING btree (documents_complete);


--
-- Name: idx_players_registration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_players_registration_id ON public.players USING btree (registration_id);


--
-- Name: idx_registrations_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_category_id ON public.registrations USING btree (category_id);


--
-- Name: idx_registrations_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_team_id ON public.registrations USING btree (team_id);


--
-- Name: idx_role_audit_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_audit_created_at ON public.role_audit_log USING btree (created_at DESC);


--
-- Name: idx_role_audit_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_audit_user_id ON public.role_audit_log USING btree (user_id);


--
-- Name: idx_team_managers_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_managers_team_id ON public.team_managers USING btree (team_id);


--
-- Name: idx_team_standings_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_standings_category ON public.team_standings USING btree (category_id);


--
-- Name: idx_team_standings_points; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_standings_points ON public.team_standings USING btree (category_id, points DESC);


--
-- Name: idx_teams_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_user_id ON public.teams USING btree (user_id);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: players generate_player_id_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_player_id_trigger BEFORE INSERT OR UPDATE OF paternal_surname, maternal_surname, first_name ON public.players FOR EACH ROW EXECUTE FUNCTION public.generate_unique_player_id();


--
-- Name: registrations trigger_set_payment_reference; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_payment_reference BEFORE INSERT ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.set_payment_reference();


--
-- Name: player_identification update_player_identification_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_player_identification_updated_at BEFORE UPDATE ON public.player_identification FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();


--
-- Name: team_standings update_team_standings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_team_standings_updated_at BEFORE UPDATE ON public.team_standings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: teams update_teams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: featured_videos featured_videos_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_videos
    ADD CONSTRAINT featured_videos_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: gallery_photos gallery_photos_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_photos
    ADD CONSTRAINT gallery_photos_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: live_streams live_streams_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_streams
    ADD CONSTRAINT live_streams_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id);


--
-- Name: matches matches_away_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: matches matches_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: matches matches_home_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: player_access_log player_access_log_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_access_log
    ADD CONSTRAINT player_access_log_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: player_access_log player_access_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_access_log
    ADD CONSTRAINT player_access_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: player_identification player_identification_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_identification
    ADD CONSTRAINT player_identification_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: player_stats player_stats_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT player_stats_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: player_stats player_stats_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT player_stats_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;


--
-- Name: players players_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: registrations registrations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: registrations registrations_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: role_audit_log role_audit_log_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_audit_log
    ADD CONSTRAINT role_audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: role_audit_log role_audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_audit_log
    ADD CONSTRAINT role_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: team_managers team_managers_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_managers
    ADD CONSTRAINT team_managers_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_standings team_standings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_standings
    ADD CONSTRAINT team_standings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: team_standings team_standings_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_standings
    ADD CONSTRAINT team_standings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: teams teams_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: teams Admins and moderators can update any team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and moderators can update any team" ON public.teams FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: categories Admins can delete categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: featured_videos Admins can delete featured videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete featured videos" ON public.featured_videos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gallery_photos Admins can delete gallery photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete gallery photos" ON public.gallery_photos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: live_streams Admins can delete live streams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete live streams" ON public.live_streams FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: matches Admins can delete matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: news Admins can delete news; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete news" ON public.news FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_stats Admins can delete player stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete player stats" ON public.player_stats FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_standings Admins can delete team standings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete team standings" ON public.team_standings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: teams Admins can delete teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: categories Admins can insert categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: featured_videos Admins can insert featured videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert featured videos" ON public.featured_videos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gallery_photos Admins can insert gallery photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert gallery photos" ON public.gallery_photos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: live_streams Admins can insert live streams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert live streams" ON public.live_streams FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: matches Admins can insert matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: news Admins can insert news; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert news" ON public.news FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_stats Admins can insert player stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert player stats" ON public.player_stats FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_standings Admins can insert team standings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert team standings" ON public.team_standings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: categories Admins can update categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: featured_videos Admins can update featured videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update featured videos" ON public.featured_videos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gallery_photos Admins can update gallery photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update gallery photos" ON public.gallery_photos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: live_streams Admins can update live streams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update live streams" ON public.live_streams FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: matches Admins can update matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: news Admins can update news; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update news" ON public.news FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_stats Admins can update player stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update player stats" ON public.player_stats FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: team_standings Admins can update team standings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update team standings" ON public.team_standings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: players Admins can view all player data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all player data" ON public.players FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Anyone can send contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can send contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: categories Anyone can view categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);


--
-- Name: featured_videos Anyone can view featured videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view featured videos" ON public.featured_videos FOR SELECT USING (true);


--
-- Name: gallery_photos Anyone can view gallery photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view gallery photos" ON public.gallery_photos FOR SELECT USING (true);


--
-- Name: live_streams Anyone can view live streams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view live streams" ON public.live_streams FOR SELECT USING (true);


--
-- Name: matches Anyone can view matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);


--
-- Name: player_stats Anyone can view player stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view player stats" ON public.player_stats FOR SELECT USING (true);


--
-- Name: news Anyone can view published news; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published news" ON public.news FOR SELECT USING (true);


--
-- Name: team_standings Anyone can view team standings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view team standings" ON public.team_standings FOR SELECT USING (true);


--
-- Name: contact_messages Only admins can delete contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete contact messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_identification Only admins can delete player identification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete player identification" ON public.player_identification FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: players Only admins can delete players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete players" ON public.players FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: registrations Only admins can delete registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete registrations" ON public.registrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_identification Only admins can insert player identification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert player identification" ON public.player_identification FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Only admins can update contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update contact messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_identification Only admins can update player identification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update player identification" ON public.player_identification FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_audit_log Only admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view audit logs" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_messages Only admins can view contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_access_log Only admins can view player access logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view player access logs" ON public.player_access_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: player_identification Only admins can view player identification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view player identification" ON public.player_identification FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: role_audit_log Only admins can view role audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view role audit logs" ON public.role_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_audit_log System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: role_audit_log System can insert role audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert role audit logs" ON public.role_audit_log FOR INSERT WITH CHECK (true);


--
-- Name: team_managers Team owners and admins can delete managers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and admins can delete managers" ON public.team_managers FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_managers.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: team_managers Team owners and admins can insert managers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and admins can insert managers" ON public.team_managers FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_managers.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: registrations Team owners and admins can insert registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and admins can insert registrations" ON public.registrations FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = registrations.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: team_managers Team owners and admins can update managers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and admins can update managers" ON public.team_managers FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_managers.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_managers.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: registrations Team owners and admins can update registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and admins can update registrations" ON public.registrations FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = registrations.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = registrations.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: registrations Team owners and admins can view registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners and admins can view registrations" ON public.registrations FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = registrations.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: players Team owners can insert their own team players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can insert their own team players" ON public.players FOR INSERT TO authenticated WITH CHECK ((public.can_access_player(auth.uid(), registration_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: players Team owners can update their own team players; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can update their own team players" ON public.players FOR UPDATE TO authenticated USING ((public.can_access_player(auth.uid(), registration_id) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((public.can_access_player(auth.uid(), registration_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: players Team owners can view basic player info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can view basic player info" ON public.players FOR SELECT TO authenticated USING ((public.can_access_player(auth.uid(), registration_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: team_managers Team owners can view their own team managers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can view their own team managers" ON public.team_managers FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_managers.team_id) AND (t.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: teams Users can insert their own teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own teams" ON public.teams FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: teams Users can update their own teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own teams" ON public.teams FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: teams Users can view all teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all teams" ON public.teams FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: admin_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: gallery_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: live_streams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: news; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

--
-- Name: player_access_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player_access_log ENABLE ROW LEVEL SECURITY;

--
-- Name: player_identification; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player_identification ENABLE ROW LEVEL SECURITY;

--
-- Name: player_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: players; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: role_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: team_managers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_managers ENABLE ROW LEVEL SECURITY;

--
-- Name: team_standings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_standings ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


