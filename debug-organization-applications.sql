-- Debug organization applications
-- This script helps understand why organizations don't see applications

-- Step 1: Check all events and their organization relationships
SELECT 
    'Events with organization details:' as info,
    COUNT(*) as total_events,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as events_with_org_id,
    COUNT(CASE WHEN organization_name IS NOT NULL THEN 1 END) as events_with_org_name
FROM events;

-- Step 2: Show sample events with organization details
SELECT 
    e.id as event_id,
    e.title,
    e.organization_id,
    e.organization_name,
    e.is_published,
    p.user_type as org_user_type,
    p.organization_name as profile_org_name
FROM events e
LEFT JOIN profiles p ON e.organization_id = p.id
ORDER BY e.created_at DESC
LIMIT 5;

-- Step 3: Check applications and their relationships
SELECT 
    'Applications overview:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_apps
FROM applications;

-- Step 4: Show applications with event and organization details
SELECT 
    a.id as application_id,
    a.status,
    a.created_at,
    e.title as event_title,
    e.organization_id as event_org_id,
    e.organization_name as event_org_name,
    p.first_name,
    p.last_name,
    p.user_type as applicant_type
FROM applications a
LEFT JOIN events e ON a.event_id = e.id
LEFT JOIN profiles p ON a.participant_id = p.id
ORDER BY a.created_at DESC
LIMIT 10;

-- Step 5: Check if there are any applications for organization events
SELECT 
    'Applications for organization events:' as info,
    COUNT(*) as count
FROM applications a
JOIN events e ON a.event_id = e.id
WHERE e.organization_id IS NOT NULL;

-- Step 6: Test the exact query that the organization dashboard uses
-- (Replace 'YOUR_ORG_USER_ID' with an actual organization user ID)
DO $$
DECLARE
    org_user_id UUID;
    org_event_ids UUID[];
    app_count INTEGER;
BEGIN
    -- Get an organization user
    SELECT id INTO org_user_id 
    FROM profiles 
    WHERE user_type = 'organization' 
    LIMIT 1;
    
    IF org_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with organization user: %', org_user_id;
        
        -- Get organization events
        SELECT ARRAY_AGG(id) INTO org_event_ids
        FROM events 
        WHERE organization_id = org_user_id;
        
        RAISE NOTICE 'Organization has % events: %', 
            COALESCE(array_length(org_event_ids, 1), 0), 
            org_event_ids;
        
        -- Count applications for these events
        SELECT COUNT(*) INTO app_count
        FROM applications 
        WHERE event_id = ANY(org_event_ids);
        
        RAISE NOTICE 'Found % applications for organization events', app_count;
    ELSE
        RAISE NOTICE 'No organization users found';
    END IF;
END $$;

SELECT 'Organization applications debug completed!' as result;


