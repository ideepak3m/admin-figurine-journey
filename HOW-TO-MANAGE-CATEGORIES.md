# How to Add or Remove Categories from Images/Videos

## Overview
The **Manage Assets** page allows you to view all your uploaded images and videos, and easily add or remove categories from any asset after it's been uploaded.

## Accessing the Manage Assets Page

1. Navigate to **Manage Assets** in the sidebar (folder icon)
2. Or go directly to: `http://localhost:5173/manage-assets`

## Features

### 1. View All Your Assets
- **Grid View**: See all your uploaded images and videos in a card layout
- **Asset Preview**: Images and videos display with thumbnails
- **Asset Details**: Title, description, status (sold/inventory), price
- **Current Categories**: Each asset shows its assigned categories as blue chips

### 2. Filter Assets
Use the filter buttons at the top:
- **All**: Shows both images and videos
- **Images**: Shows only images
- **Videos**: Shows only videos

### 3. Edit Categories

**To Add or Remove Categories:**

1. **Click "Edit Categories"** button on any asset card
2. A modal window will open showing all available categories
3. **Check/Uncheck** categories:
   - ✅ **Checked** = Category is assigned to this asset
   - ☐ **Unchecked** = Category is not assigned
4. **Click "Save Changes"** to apply
5. Categories are instantly updated in the database

**Notes:**
- You must select **at least one category** (required)
- If you try to save with no categories, the Save button is disabled
- Click **Cancel** to close without saving changes

### 4. Delete Assets

**To Delete an Image or Video:**

1. Click the red **Delete** button on any asset card
2. Confirm the deletion in the popup dialog
3. The asset is deleted from:
   - ✅ Database (assets table)
   - ✅ Storage (FigureIt_Assets bucket)
   - ✅ Category associations (asset_categories table - auto-deleted via CASCADE)

**⚠️ Warning:** Deletion is permanent and cannot be undone!

## Example Workflow

### Scenario: Add categories to an already-uploaded image

1. Upload an image with only "FigureIt" category
2. Go to **Manage Assets** page
3. Find your image in the grid
4. Click **Edit Categories** button
5. Check additional categories (e.g., "Anime", "Action Figure")
6. Click **Save Changes**
7. The asset now has 3 categories: FigureIt, Anime, Action Figure

### Scenario: Remove a category from a video

1. Go to **Manage Assets** page
2. Filter by **Videos** (optional)
3. Find the video
4. Click **Edit Categories**
5. Uncheck the category you want to remove
6. Make sure at least one category remains checked
7. Click **Save Changes**

## Technical Details

### Database Operations

**When you edit categories:**

1. **Add Categories**: Inserts new rows into `asset_categories` table
   ```sql
   INSERT INTO asset_categories (asset_id, category_id)
   VALUES ('asset-uuid', 'category-uuid');
   ```

2. **Remove Categories**: Deletes rows from `asset_categories` table
   ```sql
   DELETE FROM asset_categories
   WHERE asset_id = 'asset-uuid' 
   AND category_id = 'category-uuid';
   ```

3. **Transaction**: All changes happen in a single operation (atomic)

### Data Fetching

The page uses a **JOIN query** to fetch assets with their categories:

```sql
SELECT assets.*, 
       asset_categories.category_id,
       categories.category
FROM assets
LEFT JOIN asset_categories ON assets.id = asset_categories.asset_id
LEFT JOIN categories ON asset_categories.category_id = categories.id
WHERE assets.user_id = 'your-user-id'
ORDER BY assets.created_at DESC;
```

### RLS Security

- ✅ Users can only see and edit their own assets
- ✅ Users can only add/remove categories from their own assets
- ✅ Admins can view all assets (but editing is restricted to owners)

## UI Components

### Asset Card
```
┌─────────────────────┐
│  [Image/Video]      │
│                     │
├─────────────────────┤
│ Title               │
│ Description...      │
│ Status: inventory   │ $99.00
│ 🔵 Cat1 🔵 Cat2    │
│ [Edit Categories]   │ [Delete]
└─────────────────────┘
```

### Edit Modal
```
┌──────────────────────────┐
│ Edit Categories          │
│ Asset: My Awesome Figure │
│                          │
│ ☑ FigureIt              │
│ ☑ Anime                 │
│ ☐ Action Figure         │
│ ☐ Collectible           │
│                          │
│ [Save Changes] [Cancel]  │
└──────────────────────────┘
```

## Keyboard Shortcuts

- **ESC**: Close edit modal (same as Cancel)
- **Enter**: Save changes (when modal is open)
- **Tab**: Navigate between checkboxes

## Tips & Best Practices

1. **Organize Before Upload**: While you CAN edit categories later, it's faster to select them during upload
2. **Use Filters**: When you have many assets, use type filters to find specific items quickly
3. **Bulk Operations**: For now, edit one asset at a time. Future feature may include bulk editing
4. **Category Strategy**: Keep category names consistent and meaningful
5. **Regular Cleanup**: Periodically review and remove unused categories from assets

## Troubleshooting

### "Failed to update categories"
- Check your internet connection
- Verify you're logged in
- Make sure you have at least one category selected

### "Failed to load assets"
- Refresh the page
- Check browser console for errors
- Verify database connection in Supabase

### Categories not showing after save
- Refresh the page
- Check if the category still exists in Categories page
- Verify RLS policies are correctly set up

## Future Enhancements

Planned features for the Manage Assets page:

- [ ] Bulk category editing (select multiple assets)
- [ ] Search/filter by category
- [ ] Sort options (date, name, price)
- [ ] Edit asset details (title, description, price, status)
- [ ] Pagination for large asset collections
- [ ] Download asset or get shareable link
- [ ] Asset statistics (views, downloads)
