-- ============================================
-- FigureIt Database Setup Script
-- ============================================

-- 1. Create user_profiles table to extend auth.users with role information
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create assets table for image and video metadata
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    filename TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video')),
    asset_status TEXT NOT NULL DEFAULT 'inventory' CHECK (asset_status IN ('sold', 'inventory')),
    category TEXT,
    title TEXT,
    description TEXT,
    price DECIMAL(10, 2),
    asset_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2b. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_approved ON public.user_profiles(is_approved);

CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON public.assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_asset_status ON public.assets(asset_status);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_category ON public.categories(category);

-- 4. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Create function to auto-create user profile on signup
-- This is now only used when admin creates users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, is_approved)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, TRUE) -- Auto-approve since admin is creating
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies for user_profiles table

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update user profiles (for approval)
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Create RLS Policies for assets table

-- Policy: Users can view their own assets
CREATE POLICY "Users can view own assets"
    ON public.assets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admins can view all assets
CREATE POLICY "Admins can view all assets"
    ON public.assets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Approved users can insert their own assets
CREATE POLICY "Approved users can insert own assets"
    ON public.assets
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_approved = TRUE
        )
    );

-- Policy: Users can update their own assets
CREATE POLICY "Users can update own assets"
    ON public.assets
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own assets
CREATE POLICY "Users can delete own assets"
    ON public.assets
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Admins can delete any assets
CREATE POLICY "Admins can delete any assets"
    ON public.assets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Create RLS Policies for categories table

-- Policy: Approved users can view all categories
CREATE POLICY "Approved users can view all categories"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_approved = TRUE
        )
    );

-- Policy: Approved users can create categories
CREATE POLICY "Approved users can create categories"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_approved = TRUE
        )
    );

-- ============================================
-- Storage Bucket Setup
-- ============================================

-- Note: Storage bucket creation must be done via Supabase Dashboard or API
-- Here's the configuration you need:

-- Bucket Name: FigureIt_Assets
-- Public: false (private)
-- File size limit: 50MB (adjust as needed)
-- Allowed MIME types: image/*, video/*

-- To create the bucket via SQL (if you have the necessary privileges):
-- This is typically done through the Supabase Dashboard under Storage

-- Storage RLS Policies
-- These policies should be added in the Supabase Dashboard under Storage > Policies

-- Policy 1: Users can upload files to their own folder
-- Path pattern: {user_id}/*
-- SELECT: authenticated users can view their own files
-- INSERT: authenticated users can upload to their own folder
-- UPDATE: authenticated users can update their own files
-- DELETE: authenticated users can delete their own files

-- ============================================
-- Create First Admin User
-- ============================================
-- This is a manual step to create the very first admin account
-- Run this AFTER you create your first user through Supabase Auth UI

-- Step 1: Create user in Supabase Dashboard (Authentication > Users > Add User)
-- Email: admin@figureit.com
-- Password: (set a secure temporary password)

-- Step 2: Run this command to make them admin (replace the email)
/*
UPDATE public.user_profiles
SET role = 'admin',
    is_approved = TRUE
WHERE email = 'admin@figureit.com';
*/

-- Alternative: Use this function if the profile doesn't exist yet
CREATE OR REPLACE FUNCTION create_first_admin(admin_email TEXT, admin_password TEXT, admin_name TEXT)
RETURNS TEXT AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Note: This function requires service_role key, run in Supabase SQL Editor
    -- Create auth user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', admin_name, 'role', 'admin', 'is_approved', true),
        NOW(),
        NOW(),
        '',
        ''
    )
    RETURNING id INTO new_user_id;
    
    RETURN 'Admin user created with ID: ' || new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Admin Functions for User Management
-- ============================================

CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT, admin_name TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
    
    IF user_id IS NULL THEN
        RETURN 'User not found. Please create the user account first through authentication.';
    END IF;
    
    -- Update user profile to admin
    UPDATE public.user_profiles
    SET role = 'admin',
        is_approved = TRUE,
        full_name = admin_name
    WHERE id = user_id;
    
    RETURN 'User ' || admin_email || ' has been granted admin privileges.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.user_profiles IS 'Extended user information with roles and approval status';
COMMENT ON COLUMN public.user_profiles.id IS 'Reference to auth.users id';
COMMENT ON COLUMN public.user_profiles.email IS 'User email address';
COMMENT ON COLUMN public.user_profiles.full_name IS 'User full name';
COMMENT ON COLUMN public.user_profiles.role IS 'User role: admin or user';
COMMENT ON COLUMN public.user_profiles.is_approved IS 'Whether user is approved by admin to upload assets';

COMMENT ON TABLE public.assets IS 'Stores metadata for uploaded images and videos';
COMMENT ON COLUMN public.assets.id IS 'Unique identifier for the asset';
COMMENT ON COLUMN public.assets.user_id IS 'Reference to the user who owns this asset';
COMMENT ON COLUMN public.assets.filename IS 'Original filename of the uploaded asset';
COMMENT ON COLUMN public.assets.asset_type IS 'Type of asset: image or video';
COMMENT ON COLUMN public.assets.asset_status IS 'Status: sold or inventory';
COMMENT ON COLUMN public.assets.category IS 'Category/collection of the asset';
COMMENT ON COLUMN public.assets.title IS 'Display title for the asset';
COMMENT ON COLUMN public.assets.description IS 'Detailed description of the asset';
COMMENT ON COLUMN public.assets.price IS 'Price in currency (e.g., CAD)';
COMMENT ON COLUMN public.assets.asset_url IS 'Full URL to the asset in storage bucket';
COMMENT ON COLUMN public.assets.created_at IS 'Timestamp when the asset was created';
COMMENT ON COLUMN public.assets.updated_at IS 'Timestamp when the asset was last updated';
