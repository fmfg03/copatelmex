INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-media', 'gallery-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can view gallery media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-media');

CREATE POLICY "Admins can upload gallery media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update gallery media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-media'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'gallery-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete gallery media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-media'
  AND public.has_role(auth.uid(), 'admin')
);
