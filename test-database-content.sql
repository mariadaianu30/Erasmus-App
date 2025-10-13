-- Test Database Content
-- This script shows what's currently in your database

-- Check if organization_name column exists in events table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'organization_name';

-- Check current events data
SELECT 
    id,
    title,
    organization_name,
    organization_website,
    category
FROM events 
ORDER BY title;

-- Check if organization_view exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'organization_view';

-- If organization_view exists, show its content
SELECT * FROM organization_view;

SELECT 'Database content check completed!' as status;
