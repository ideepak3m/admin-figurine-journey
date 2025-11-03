# Supabase Setup Instructions for FigureIt

## Prerequisites
- Supabase account created
- FigureIt project created in Supabase

## Step 1: Run Database Setup Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase-setup.sql`
5. Click **Run** to execute the script

This will create:
- `assets` table with all required columns
- Indexes for performance
- Auto-update trigger for `updated_at`
- RLS policies for SELECT, INSERT, UPDATE, DELETE

## Step 2: Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **Create a new bucket**
3. Configure the bucket:
   - **Name**: `FigureIt_Assets`
   - **Public**: `OFF` (keep private)
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
     - `image/webp`
     - `video/mp4`
     - `video/quicktime`
4. Click **Create bucket**

## Step 3: Add Storage Policies

1. After creating the bucket, click on **FigureIt_Assets**
2. Go to **Policies** tab
3. Click **New Policy**
4. For each policy in `supabase-storage-policies.sql`:
   - Create a new policy
   - Select the operation (SELECT, INSERT, UPDATE, or DELETE)
   - Copy the policy definition
   - Save the policy

You should create 4 policies total:
- Users can view own files (SELECT)
- Users can upload to own folder (INSERT)
- Users can update own files (UPDATE)
- Users can delete own files (DELETE)

## Step 4: Enable Authentication

1. Go to **Authentication** > **Providers** in Supabase Dashboard
2. Enable **Email** provider
3. Configure email templates if needed
4. Optional: Enable other providers (Google, GitHub, etc.)

## Step 5: Get Your Credentials

1. Go to **Settings** > **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
3. Create `.env` file in your project root:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Step 6: Test the Setup

1. Start your app: `npm run dev`
2. Navigate to the login page
3. Create a test user account
4. Try uploading an image or video
5. Verify the file appears in Storage under `FigureIt_Assets/{user_id}/`

## File Organization Structure

Files will be stored as:
```
FigureIt_Assets/
  └── {user_id}/
      ├── images/
      │   ├── photo1.jpg
      │   └── photo2.png
      └── videos/
          ├── video1.mp4
          └── video2.mov
```

## Database Schema

### assets Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| filename | TEXT | Original filename |
| asset_type | TEXT | 'image' or 'video' |
| asset_status | TEXT | 'sold' or 'inventory' |
| category | TEXT | Asset category |
| title | TEXT | Display title |
| description | TEXT | Asset description |
| price | DECIMAL(10,2) | Price in currency |
| asset_url | TEXT | Full URL to storage |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Security Notes

1. **Private Storage**: The bucket is private, so only authenticated users can access files
2. **User Isolation**: RLS policies ensure users can only see/modify their own data
3. **Dual Security**: user_id is stored in both storage path and database for double protection
4. **Authentication Required**: All operations require a valid auth token

## Troubleshooting

- **Can't upload files**: Check storage policies are correctly applied
- **Can't see files**: Verify RLS policies on assets table
- **401 errors**: Ensure user is logged in and token is valid
- **File too large**: Check bucket size limit (default 50MB)
