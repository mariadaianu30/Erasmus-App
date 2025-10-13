-- Check the current state of event organization details
-- Run this to see what's missing

-- Show all events with their organization details
SELECT 
    e.id,
    e.title,
    e.organization_id,
    e.organization_name,
    e.organization_website,
    e.is_published,
    p.organization_name as profile_org_name,
    p.website as profile_website,
    p.user_type
FROM events e
LEFT JOIN profiles p ON e.organization_id = p.id
ORDER BY e.created_at DESC;

-- Count events with missing organization details
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN organization_name IS NULL THEN 1 END) as missing_org_name,
    COUNT(CASE WHEN organization_website IS NULL THEN 1 END) as missing_org_website,
    COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as missing_org_id
FROM events;

-- Show events that need organization details populated
SELECT 
    'Events missing organization details:' as status,
    COUNT(*) as count
FROM events 
WHERE organization_id IS NOT NULL 
  AND (organization_name IS NULL OR organization_website IS NULL);

SELECT 'Organization details check completed!' as result;


