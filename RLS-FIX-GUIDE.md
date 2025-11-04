# RLS Infinite Recursion Fix

## Problem
Error: `infinite recursion detected in policy for relation "user_profiles"`

This happens when RLS policies on `user_profiles` table try to check the same `user_profiles` table to determine if a user is an admin, creating a circular dependency.

## Root Cause
The following policy pattern causes recursion:

```sql
-- BAD: This causes infinite recursion!
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles  -- ← Checks same table!
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

When PostgreSQL evaluates this policy:
1. User tries to SELECT from `user_profiles`
2. Policy checks if user is admin by querying `user_profiles`
3. That query triggers the policy again
4. Infinite loop! 🔄

## Solution
Create a `SECURITY DEFINER` function that bypasses RLS when checking admin status:

```sql
-- GOOD: Function bypasses RLS
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

-- Now use the function in policies
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (public.is_admin());  -- ← No recursion!
```

`SECURITY DEFINER` runs the function with the permissions of the function owner (usually a superuser), bypassing RLS and breaking the recursion.

## How to Apply the Fix

### Option 1: Run the Quick Fix Script
```bash
# In Supabase SQL Editor, run:
fix-rls-recursion.sql
```

This script:
1. Drops all problematic policies
2. Creates the `is_admin()` function
3. Recreates policies using the function

### Option 2: Manual Fix
1. Open Supabase SQL Editor
2. Copy and paste the contents of `fix-rls-recursion.sql`
3. Execute the script
4. Refresh your app

## Verification

After applying the fix, test:
1. ✅ Categories page loads without errors
2. ✅ Can fetch categories from database
3. ✅ No "infinite recursion" errors in console
4. ✅ Admin users can still view all profiles
5. ✅ Regular users can only view their own profile

## Files Updated

1. **fix-rls-recursion.sql** (NEW)
   - Quick fix script to apply to existing database

2. **supabase-setup.sql** (UPDATED)
   - Added `is_admin()` function before RLS policies
   - Updated all admin policies to use `public.is_admin()`
   - Prevents issue in fresh database setups

## Technical Details

### Why SECURITY DEFINER Works

- **Normal function**: Runs with caller's permissions (subject to RLS)
- **SECURITY DEFINER**: Runs with owner's permissions (bypasses RLS)

The function owner is typically the database superuser who created it, so it has full access to all tables without RLS restrictions.

### Security Considerations

The `is_admin()` function is safe because:
- ✅ Only reads data (doesn't modify)
- ✅ Only checks current user (`auth.uid()`)
- ✅ Only returns boolean (no data leakage)
- ✅ Simple logic (hard to exploit)

### Performance Impact

- **Minimal**: Function is very simple (single EXISTS query)
- **Cacheable**: PostgreSQL can inline simple functions
- **No N+1 queries**: Function runs once per policy check

## Common Mistakes to Avoid

❌ **Don't do this:**
```sql
-- Checking same table in its own policy
CREATE POLICY "policy_name" ON table_a
USING (EXISTS (SELECT 1 FROM table_a WHERE ...));
```

✅ **Do this instead:**
```sql
-- Use a SECURITY DEFINER function
CREATE POLICY "policy_name" ON table_a
USING (public.helper_function());
```

## Related Files

- `supabase-setup.sql` - Main database schema (now includes fix)
- `fix-rls-recursion.sql` - Apply fix to existing database
- `MIGRATION-GUIDE.md` - Overall migration documentation
