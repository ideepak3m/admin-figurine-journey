-- ============================================
-- Storage Bucket Policies for FigureIt_Assets
-- ============================================
-- These policies need to be created in Supabase Dashboard
-- Storage > FigureIt_Assets > Policies

-- IMPORTANT: Create the bucket first in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Name: FigureIt_Assets
-- 4. Public: OFF (private bucket)
-- 5. File size limit: 52428800 (50MB)
-- 6. Allowed MIME types: image/jpeg, image/png, image/jpg, image/webp, video/mp4, video/quicktime

-- After creating the bucket, add these policies:

-- ============================================
-- Policy 1: SELECT - Users can view their own files
-- ============================================
-- Policy Name: Users can view own files
-- Operation: SELECT
-- Policy Definition:

CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'FigureIt_Assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Policy 2: INSERT - Users can upload to their own folder
-- ============================================
-- Policy Name: Users can upload to own folder
-- Operation: INSERT
-- Policy Definition:

CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'FigureIt_Assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Policy 3: UPDATE - Users can update their own files
-- ============================================
-- Policy Name: Users can update own files
-- Operation: UPDATE
-- Policy Definition:

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'FigureIt_Assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'FigureIt_Assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Policy 4: DELETE - Users can delete their own files
-- ============================================
-- Policy Name: Users can delete own files
-- Operation: DELETE
-- Policy Definition:

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'FigureIt_Assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- File Organization Structure
-- ============================================
-- Files will be organized as:
-- FigureIt_Assets/
--   └── {user_id}/
--       ├── images/
--       │   ├── filename1.jpg
--       │   └── filename2.png
--       └── videos/
--           ├── filename1.mp4
--           └── filename2.mov

-- ============================================
-- Notes
-- ============================================
-- 1. The user_id is stored in both:
--    - Storage path: for file access control via RLS
--    - Database table: for querying and metadata management
--
-- 2. This dual storage ensures:
--    - Files are organized per user in storage
--    - Fast queries on assets table
--    - Secure access control at both storage and database level
--
-- 3. The storage policies use (storage.foldername(name))[1] to extract
--    the first folder in the path, which should be the user_id
