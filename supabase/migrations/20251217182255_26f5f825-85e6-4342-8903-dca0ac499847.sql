-- Make the registration-documents bucket private if it exists
UPDATE storage.buckets 
SET public = false 
WHERE id = 'registration-documents';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- Create storage policies for registration-documents bucket
-- Policy: Users can upload documents to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'registration-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view documents in their own folder
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'registration-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'registration-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Users can delete documents in their own folder
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'registration-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update documents in their own folder
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'registration-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'registration-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);