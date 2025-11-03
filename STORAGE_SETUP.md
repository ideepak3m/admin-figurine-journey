# Supabase Storage Setup Guide

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `FigureIt_Assets`
   - **Public bucket**: **OFF** (keep it private)
   - **File size limit**: 50 MB (or adjust as needed)
   - **Allowed MIME types**: Leave empty or specify `image/*,video/*`

5. Click **Create bucket**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to add RLS policies:

1. Click on the `FigureIt_Assets` bucket
2. Go to **Policies** tab
3. Click **New Policy**

### Policy 1: Allow authenticated users to upload to their own folder

```sql
-- INSERT policy
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'FigureIt_Assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow users to view their own files

```sql
-- SELECT policy
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'FigureIt_Assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow users to update their own files

```sql
-- UPDATE policy
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'FigureIt_Assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow users to delete their own files

```sql
-- DELETE policy
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'FigureIt_Assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 5: Allow admins to view all files

```sql
-- SELECT policy for admins
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'FigureIt_Assets' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Step 3: Verify Setup

After setting up the policies, test the upload functionality:

1. Log in to your app
2. Navigate to **Upload Images**
3. Select an image file
4. Fill in all required fields
5. Click **Upload Image**

## Troubleshooting

### Error: "new row violates row-level security policy"
- Check that you're logged in as an authenticated user
- Verify your user has `is_approved = TRUE` in the `user_profiles` table
- Ensure the storage policies are correctly created

### Error: "Failed to upload image"
- Check the browser console for detailed error messages
- Verify the bucket name is exactly `FigureIt_Assets`
- Check file size is under the limit
- Ensure file type is an image

### Error: "relation storage.objects does not exist"
- The storage extension might not be enabled
- Run this in SQL editor: `CREATE EXTENSION IF NOT EXISTS "storage";`
