-- PART 4: WhatsApp system tables

CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone text NOT NULL,
  recipient_name text,
  message_content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  message_sid text,
  direction text NOT NULL DEFAULT 'outbound',
  status text DEFAULT 'sent',
  media_url text,
  media_type text,
  media_filename text,
  is_read boolean NOT NULL DEFAULT false,
  sent_by uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view whatsapp messages" ON public.whatsapp_message_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert whatsapp messages" ON public.whatsapp_message_log FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update whatsapp messages" ON public.whatsapp_message_log FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete whatsapp messages" ON public.whatsapp_message_log FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_message_log;

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  description text,
  variables text[],
  template_type text DEFAULT 'custom',
  language text DEFAULT 'es',
  is_active boolean NOT NULL DEFAULT true,
  approval_status text DEFAULT 'pending',
  submitted_at timestamptz,
  approved_at timestamptz,
  rejection_reason text,
  twilio_template_sid text,
  twilio_content_sid text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view whatsapp templates" ON public.whatsapp_templates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert whatsapp templates" ON public.whatsapp_templates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update whatsapp templates" ON public.whatsapp_templates FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete whatsapp templates" ON public.whatsapp_templates FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.whatsapp_quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  shortcut text,
  category text,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view quick replies" ON public.whatsapp_quick_replies FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert quick replies" ON public.whatsapp_quick_replies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update quick replies" ON public.whatsapp_quick_replies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete quick replies" ON public.whatsapp_quick_replies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.whatsapp_auto_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'keyword',
  trigger_config jsonb,
  reply_content text NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_auto_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view auto replies" ON public.whatsapp_auto_replies FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert auto replies" ON public.whatsapp_auto_replies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update auto replies" ON public.whatsapp_auto_replies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete auto replies" ON public.whatsapp_auto_replies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversation_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view conversation tags" ON public.whatsapp_conversation_tags FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert conversation tags" ON public.whatsapp_conversation_tags FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update conversation tags" ON public.whatsapp_conversation_tags FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete conversation tags" ON public.whatsapp_conversation_tags FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  tag_id uuid NOT NULL REFERENCES public.whatsapp_conversation_tags(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversation_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view tag assignments" ON public.whatsapp_conversation_tag_assignments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert tag assignments" ON public.whatsapp_conversation_tag_assignments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tag assignments" ON public.whatsapp_conversation_tag_assignments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  assigned_to uuid NOT NULL,
  assigned_by uuid,
  priority text DEFAULT 'normal',
  notes text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversation_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view conversation assignments" ON public.whatsapp_conversation_assignments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert conversation assignments" ON public.whatsapp_conversation_assignments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update conversation assignments" ON public.whatsapp_conversation_assignments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete conversation assignments" ON public.whatsapp_conversation_assignments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Public view for teams (hides sensitive data)
CREATE OR REPLACE VIEW public.teams_public AS
SELECT id, team_name, academy_name, shield_url, state, country
FROM public.teams;