-- Common Queries for Asset Categories

-- ============================================
-- VIEWING DATA
-- ============================================

-- Get all categories for a specific asset
SELECT c.id, c.category, ac.created_at
FROM asset_categories ac
JOIN categories c ON ac.category_id = c.id
WHERE ac.asset_id = 'ASSET_UUID_HERE'
ORDER BY c.category;

-- Get all assets with their categories (aggregated)
SELECT 
    a.id,
    a.title,
    a.asset_type,
    STRING_AGG(c.category, ', ' ORDER BY c.category) as categories
FROM assets a
LEFT JOIN asset_categories ac ON a.id = ac.asset_id
LEFT JOIN categories c ON ac.category_id = c.id
GROUP BY a.id, a.title, a.asset_type
ORDER BY a.created_at DESC;

-- Count assets per category
SELECT 
    c.category,
    COUNT(DISTINCT ac.asset_id) as asset_count
FROM categories c
LEFT JOIN asset_categories ac ON c.id = ac.category_id
GROUP BY c.id, c.category
ORDER BY asset_count DESC, c.category;

-- Find assets with multiple categories
SELECT 
    a.id,
    a.title,
    COUNT(ac.category_id) as category_count
FROM assets a
JOIN asset_categories ac ON a.id = ac.asset_id
GROUP BY a.id, a.title
HAVING COUNT(ac.category_id) > 1
ORDER BY category_count DESC;

-- Find assets without any categories
SELECT a.id, a.title, a.asset_type, a.created_at
FROM assets a
LEFT JOIN asset_categories ac ON a.id = ac.asset_id
WHERE ac.id IS NULL
ORDER BY a.created_at DESC;

-- Find unused categories (no assets)
SELECT c.id, c.category, c.created_at
FROM categories c
LEFT JOIN asset_categories ac ON c.id = ac.category_id
WHERE ac.id IS NULL
ORDER BY c.category;

-- ============================================
-- ADDING/UPDATING DATA
-- ============================================

-- Add a category to an asset
INSERT INTO asset_categories (asset_id, category_id)
VALUES ('ASSET_UUID_HERE', 'CATEGORY_UUID_HERE')
ON CONFLICT (asset_id, category_id) DO NOTHING;

-- Add multiple categories to an asset (bulk)
INSERT INTO asset_categories (asset_id, category_id)
VALUES 
    ('ASSET_UUID_HERE', 'CATEGORY_1_UUID'),
    ('ASSET_UUID_HERE', 'CATEGORY_2_UUID'),
    ('ASSET_UUID_HERE', 'CATEGORY_3_UUID')
ON CONFLICT (asset_id, category_id) DO NOTHING;

-- Remove a category from an asset
DELETE FROM asset_categories
WHERE asset_id = 'ASSET_UUID_HERE'
AND category_id = 'CATEGORY_UUID_HERE';

-- Remove all categories from an asset
DELETE FROM asset_categories
WHERE asset_id = 'ASSET_UUID_HERE';

-- Replace all categories for an asset (transaction)
BEGIN;
DELETE FROM asset_categories WHERE asset_id = 'ASSET_UUID_HERE';
INSERT INTO asset_categories (asset_id, category_id)
VALUES 
    ('ASSET_UUID_HERE', 'NEW_CATEGORY_1_UUID'),
    ('ASSET_UUID_HERE', 'NEW_CATEGORY_2_UUID');
COMMIT;

-- ============================================
-- FILTERING ASSETS
-- ============================================

-- Find all assets in a specific category
SELECT DISTINCT a.*
FROM assets a
JOIN asset_categories ac ON a.id = ac.asset_id
JOIN categories c ON ac.category_id = c.id
WHERE c.category = 'CATEGORY_NAME_HERE'
ORDER BY a.created_at DESC;

-- Find assets that have ALL of specified categories (AND logic)
SELECT a.*
FROM assets a
WHERE EXISTS (
    SELECT 1 FROM asset_categories ac1
    JOIN categories c1 ON ac1.category_id = c1.id
    WHERE ac1.asset_id = a.id AND c1.category = 'Category1'
)
AND EXISTS (
    SELECT 1 FROM asset_categories ac2
    JOIN categories c2 ON ac2.category_id = c2.id
    WHERE ac2.asset_id = a.id AND c2.category = 'Category2'
)
ORDER BY a.created_at DESC;

-- Find assets that have ANY of specified categories (OR logic)
SELECT DISTINCT a.*
FROM assets a
JOIN asset_categories ac ON a.id = ac.asset_id
JOIN categories c ON ac.category_id = c.id
WHERE c.category IN ('Category1', 'Category2', 'Category3')
ORDER BY a.created_at DESC;

-- ============================================
-- ANALYTICS
-- ============================================

-- Category usage statistics
SELECT 
    c.category,
    COUNT(DISTINCT ac.asset_id) as total_assets,
    COUNT(DISTINCT CASE WHEN a.asset_type = 'image' THEN a.id END) as images,
    COUNT(DISTINCT CASE WHEN a.asset_type = 'video' THEN a.id END) as videos,
    MIN(ac.created_at) as first_used,
    MAX(ac.created_at) as last_used
FROM categories c
LEFT JOIN asset_categories ac ON c.id = ac.category_id
LEFT JOIN assets a ON ac.asset_id = a.id
GROUP BY c.id, c.category
ORDER BY total_assets DESC;

-- User's category usage
SELECT 
    u.email,
    c.category,
    COUNT(DISTINCT a.id) as asset_count
FROM user_profiles u
JOIN categories c ON c.user_id = u.id
LEFT JOIN asset_categories ac ON ac.category_id = c.id
LEFT JOIN assets a ON ac.asset_id = a.id
GROUP BY u.id, u.email, c.id, c.category
ORDER BY u.email, asset_count DESC;

-- Most popular category combinations (assets with same category set)
SELECT 
    STRING_AGG(c.category, ', ' ORDER BY c.category) as category_combination,
    COUNT(*) as asset_count
FROM assets a
JOIN asset_categories ac ON a.id = ac.asset_id
JOIN categories c ON ac.category_id = c.id
GROUP BY a.id
HAVING COUNT(ac.category_id) > 1  -- Only combinations, not single categories
GROUP BY category_combination
ORDER BY asset_count DESC
LIMIT 10;

-- ============================================
-- MAINTENANCE
-- ============================================

-- Find and remove duplicate category assignments (shouldn't happen with UNIQUE constraint)
DELETE FROM asset_categories
WHERE id NOT IN (
    SELECT MIN(id)
    FROM asset_categories
    GROUP BY asset_id, category_id
);

-- Find assets with too many categories (potential data quality issue)
SELECT 
    a.id,
    a.title,
    COUNT(ac.category_id) as category_count
FROM assets a
JOIN asset_categories ac ON a.id = ac.asset_id
GROUP BY a.id, a.title
HAVING COUNT(ac.category_id) > 10  -- Adjust threshold as needed
ORDER BY category_count DESC;

-- Clean up orphaned asset_category records (shouldn't happen with CASCADE)
DELETE FROM asset_categories
WHERE asset_id NOT IN (SELECT id FROM assets)
OR category_id NOT IN (SELECT id FROM categories);

-- ============================================
-- MIGRATION HELPERS
-- ============================================

-- Copy category data from old column to junction table
INSERT INTO asset_categories (asset_id, category_id)
SELECT 
    a.id as asset_id,
    c.id as category_id
FROM assets a
JOIN categories c ON a.category = c.category
WHERE a.category IS NOT NULL 
AND a.category != ''
ON CONFLICT (asset_id, category_id) DO NOTHING;

-- Verify migration count
SELECT 
    'Old column with data' as source,
    COUNT(*) as count
FROM assets 
WHERE category IS NOT NULL AND category != ''
UNION ALL
SELECT 
    'New junction table' as source,
    COUNT(DISTINCT asset_id) as count
FROM asset_categories;

-- Check for categories in old column that don't exist in categories table
SELECT DISTINCT a.category
FROM assets a
WHERE a.category IS NOT NULL 
AND a.category != ''
AND NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.category = a.category
);
