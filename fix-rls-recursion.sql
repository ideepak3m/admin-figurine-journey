-- Fix for infinite recursion in RLS policies
-- Run this script to fix the "infinite recursion detected in policy for relation user_profiles" error

-- Step 1: Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can delete any assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can view all asset categories" ON public.asset_categories;

-- Step 2: Create a security definer function to check if user is admin
-- This breaks the recursion by bypassing RLS when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the policies using the function instead of subquery

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (public.is_admin());

-- Policy: Admins can update user profiles (for approval)
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles
    FOR UPDATE
    USING (public.is_admin());

-- Policy: Admins can view all assets
CREATE POLICY "Admins can view all assets"
    ON public.assets
    FOR SELECT
    USING (public.is_admin());

-- Policy: Admins can delete any assets
CREATE POLICY "Admins can delete any assets"
    ON public.assets
    FOR DELETE
    USING (public.is_admin());

-- Policy: Admins can view all asset-category associations
CREATE POLICY "Admins can view all asset categories"
    ON public.asset_categories
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
