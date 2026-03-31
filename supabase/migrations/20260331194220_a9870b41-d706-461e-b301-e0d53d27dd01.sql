CREATE TABLE IF NOT EXISTS public.news_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  requested_action TEXT NOT NULL DEFAULT 'preview',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  extracted_title TEXT NULL,
  extracted_content TEXT NULL,
  extracted_image_url TEXT NULL,
  result JSONB NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT news_import_jobs_requested_action_check CHECK (requested_action IN ('preview', 'publish')),
  CONSTRAINT news_import_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_news_import_jobs_user_id_created_at
  ON public.news_import_jobs (user_id, created_at DESC);

ALTER TABLE public.news_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view import jobs"
ON public.news_import_jobs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create import jobs"
ON public.news_import_jobs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND auth.uid() = user_id
);

CREATE POLICY "Admins can update import jobs"
ON public.news_import_jobs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_news_import_jobs_updated_at
BEFORE UPDATE ON public.news_import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();