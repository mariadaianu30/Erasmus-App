-- Check Actual Organization Names in Database
-- This will show us exactly what organization names exist

-- Check organization names in events table
SELECT DISTINCT 
    organization_name,
    COUNT(*) as event_count
FROM events 
WHERE organization_name IS NOT NULL
GROUP BY organization_name
ORDER BY organization_name;

-- Check organization names in organization_view (if it exists)
SELECT * FROM organization_view;

-- Show sample events with their organization names
SELECT 
    title,
    organization_name,
    organization_website
FROM events 
WHERE organization_name IS NOT NULL
ORDER BY organization_name, title;

SELECT 'Organization names check completed!' as status;
