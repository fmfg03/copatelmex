
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload news images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'news-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Public can view news images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'news-images');

CREATE POLICY "Admins can delete news images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'news-images'
  AND public.has_role(auth.uid(), 'admin')
);
