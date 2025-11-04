# Migration Guide: Single Category to Many-to-Many Categories

This guide explains how to migrate from single category per asset to multiple categories per asset.

## Database Changes

### 1. New Junction Table
A new `asset_categories` junction table has been created to support many-to-many relationships:

```sql
CREATE TABLE public.asset_categories (
    id UUID PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asset_id, category_id)
);
```

### 2. RLS Policies
New Row Level Security policies have been added:
- Users can view asset-category associations for their own assets
- Admins can view all associations
- Users can add/remove categories from their own assets

### 3. Migration Steps

#### If you have NO existing data:
1. Run `supabase-setup.sql` to create all tables including `asset_categories`
2. Run `supabase-migration.sql` to remove the old `category` column from `assets` table
3. Deploy the updated app code

#### If you have existing data with categories:
1. Run the junction table creation from `supabase-setup.sql` (lines for asset_categories table)
2. **IMPORTANT**: Before dropping the old column, migrate existing data:
   ```sql
   -- Migrate existing category data to junction table
   INSERT INTO public.asset_categories (asset_id, category_id)
   SELECT 
       a.id as asset_id,
       c.id as category_id
   FROM public.assets a
   INNER JOIN public.categories c ON a.category = c.category
   WHERE a.category IS NOT NULL AND a.category != '';
   ```
3. Verify the migration was successful:
   ```sql
   -- Count how many assets have categories in the new table
   SELECT COUNT(DISTINCT asset_id) FROM public.asset_categories;
   
   -- This should match the count of assets with categories in the old column
   SELECT COUNT(*) FROM public.assets WHERE category IS NOT NULL AND category != '';
   ```
4. Once verified, run `supabase-migration.sql` to remove the old `category` column
5. Deploy the updated app code

## UI Changes

### Upload Forms (Images & Videos)
- **Before**: Single category dropdown
- **After**: Multi-select with visual chips/tags showing selected categories
- Users can now:
  - Select multiple categories from dropdown
  - See selected categories as blue chips with × to remove
  - Add new categories inline (Gmail-style)
  - Must select at least one category

### New Features
- Selected categories display as removable chips
- Dropdown shows checkmarks (✓) for already-selected categories
- Already-selected categories are disabled in dropdown to prevent duplicates
- Cancel button when adding new category inline

## Code Changes

### Modified Files
1. `supabase-setup.sql`
   - Added `asset_categories` junction table
   - Added RLS policies for junction table
   - Added indexes for performance

2. `src/pages/UploadImages.jsx`
   - Changed from single `category` to `selectedCategories` array
   - Updated `fetchCategories()` to fetch `id` and `category`
   - Added `removeCategory()` function
   - Updated `handleCategoryChange()` to toggle selection
   - Updated `handleSubmit()` to insert into junction table
   - New UI with category chips display

3. `src/pages/UploadVideos.jsx`
   - Same changes as UploadImages.jsx

### New Files
1. `supabase-migration.sql` - Migration script to drop old category column
2. `MIGRATION-GUIDE.md` - This file

## Testing Checklist

After migration, test the following:

- [ ] Upload new image with multiple categories
- [ ] Upload new video with multiple categories
- [ ] Verify categories are saved correctly in `asset_categories` table
- [ ] Add new category inline and verify it's auto-selected
- [ ] Remove selected category using × button
- [ ] Try to submit without selecting any category (should show validation error)
- [ ] Verify RLS policies work (users can only manage their own asset categories)

## Rollback Plan

If you need to rollback:

1. Add the `category` column back to assets table:
   ```sql
   ALTER TABLE public.assets ADD COLUMN category TEXT;
   ```

2. Migrate data back from junction table (takes first category only):
   ```sql
   UPDATE public.assets a
   SET category = c.category
   FROM (
       SELECT DISTINCT ON (ac.asset_id) ac.asset_id, cat.category
       FROM public.asset_categories ac
       INNER JOIN public.categories cat ON ac.category_id = cat.id
       ORDER BY ac.asset_id, ac.created_at
   ) c
   WHERE a.id = c.asset_id;
   ```

3. Deploy previous version of app code

## Future Enhancements

Possible improvements for the future:

1. **Asset Management Page**
   - View all uploaded assets in a grid/list
   - Edit existing asset categories
   - Bulk category operations

2. **Category Filtering**
   - Filter assets by multiple categories
   - Category-based asset organization

3. **Category Analytics**
   - Show how many assets per category
   - Most used categories
   - Unused categories

4. **Category Management**
   - Edit category names
   - Merge categories
   - Delete unused categories (with cascade handling)
