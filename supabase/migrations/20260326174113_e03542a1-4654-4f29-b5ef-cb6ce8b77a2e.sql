-- PART 2: Tournament config table (single tournament, no tournament_id FK)
CREATE TABLE IF NOT EXISTS public.tournament_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_enabled boolean DEFAULT true,
  registration_fee numeric DEFAULT NULL,
  payment_enabled boolean DEFAULT true,
  payment_instructions text,
  payment_methods jsonb DEFAULT '["transfer"]'::jsonb,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_clabe text,
  early_bird_discount numeric DEFAULT NULL,
  early_bird_deadline timestamptz DEFAULT NULL,
  max_players_per_team integer DEFAULT 22,
  min_players_per_team integer DEFAULT 11,
  max_teams_per_category integer DEFAULT NULL,
  require_photo boolean DEFAULT true,
  require_birth_certificate boolean DEFAULT true,
  require_curp boolean DEFAULT true,
  require_medical_certificate boolean DEFAULT false,
  send_confirmation_email boolean DEFAULT true,
  send_payment_reminder boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament config" ON public.tournament_config FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert tournament config" ON public.tournament_config FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tournament config" ON public.tournament_config FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tournament config" ON public.tournament_config FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Match cedulas
CREATE TABLE IF NOT EXISTS public.match_cedulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  referee_name text,
  file_url text,
  parsed_data jsonb,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_cedulas_match_id_key UNIQUE (match_id)
);

ALTER TABLE public.match_cedulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match cedulas" ON public.match_cedulas FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert match cedulas" ON public.match_cedulas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update match cedulas" ON public.match_cedulas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete match cedulas" ON public.match_cedulas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Survey responses
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_type text NOT NULL DEFAULT 'general',
  rating integer NOT NULL,
  feedback text,
  respondent_name text,
  phone_number text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert survey responses" ON public.survey_responses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view survey responses" ON public.survey_responses FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete survey responses" ON public.survey_responses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Statistics uploads
CREATE TABLE IF NOT EXISTS public.statistics_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  file_name text,
  excel_file_name text,
  excel_file_path text,
  records_updated integer,
  notes text,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT statistics_uploads_category_id_key UNIQUE (category_id)
);

ALTER TABLE public.statistics_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view statistics uploads" ON public.statistics_uploads FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert statistics uploads" ON public.statistics_uploads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update statistics uploads" ON public.statistics_uploads FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete statistics uploads" ON public.statistics_uploads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Statistics PDF reports
CREATE TABLE IF NOT EXISTS public.statistics_pdf_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  jornada_number integer NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  report_date date NOT NULL,
  notes text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.statistics_pdf_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view statistics reports" ON public.statistics_pdf_reports FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert statistics reports" ON public.statistics_pdf_reports FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update statistics reports" ON public.statistics_pdf_reports FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete statistics reports" ON public.statistics_pdf_reports FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));