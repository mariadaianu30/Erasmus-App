-- Diagnose Organization Issue
-- This script will show us what's actually in your database

-- 1. Check what events exist and their IDs
SELECT 
    id,
    title,
    category,
    organization_name,
    organization_website,
    created_at
FROM events 
ORDER BY created_at DESC;

-- 2. Check if organization columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('organization_name', 'organization_website');

-- 3. Check if organization_view exists and what it contains
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'organization_view';

-- 4. If organization_view exists, show its content
SELECT * FROM organization_view;

-- 5. Count events by organization
SELECT 
    organization_name,
    COUNT(*) as event_count
FROM events 
WHERE organization_name IS NOT NULL
GROUP BY organization_name;

-- 6. Show events without organization names
SELECT 
    id,
    title,
    category
FROM events 
WHERE organization_name IS NULL;

SELECT 'Diagnosis completed!' as status;
