-- QUICK FIX: Populate organization details for existing events
-- Run this simple script to fix the missing organization names

-- Step 1: Update all events with organization details from profiles
UPDATE events 
SET 
    organization_name = p.organization_name,
    organization_website = p.website
FROM profiles p
WHERE events.organization_id = p.id 
  AND p.user_type = 'organization';

-- Step 2: Show results
SELECT 
    'Updated events:' as status,
    COUNT(*) as total_events,
    COUNT(CASE WHEN organization_name IS NOT NULL THEN 1 END) as events_with_org_name,
    COUNT(CASE WHEN organization_website IS NOT NULL THEN 1 END) as events_with_org_website
FROM events;

-- Step 3: Show sample events with organization details
SELECT 
    title,
    organization_name,
    organization_website
FROM events 
WHERE organization_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

SELECT 'Quick fix completed! Events should now show organization details.' as result;


