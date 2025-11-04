-- Migration to remove category column from assets table
-- This should be run AFTER the asset_categories junction table is created
-- and existing data is migrated (if any)

-- Step 1: Drop the old category column from assets table
-- WARNING: Make sure to migrate existing data first if you have any!
ALTER TABLE public.assets DROP COLUMN IF EXISTS category;

-- Optional: If you want to migrate existing category data before dropping the column,
-- uncomment and run this section first:

/*
-- Migrate existing category data to junction table
INSERT INTO public.asset_categories (asset_id, category_id)
SELECT 
    a.id as asset_id,
    c.id as category_id
FROM public.assets a
INNER JOIN public.categories c ON a.category = c.category
WHERE a.category IS NOT NULL AND a.category != '';
*/
