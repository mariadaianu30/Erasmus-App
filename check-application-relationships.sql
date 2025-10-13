-- Check application relationships and identify orphaned data
-- This script helps identify why profiles or events might be null in the dashboard

-- Step 1: Check all applications and their relationships
SELECT 
    'Application Relationships Overview:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN a.participant_id IS NOT NULL THEN 1 END) as apps_with_participant_id,
    COUNT(CASE WHEN a.event_id IS NOT NULL THEN 1 END) as apps_with_event_id,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as apps_with_profile,
    COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as apps_with_event
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
LEFT JOIN events e ON a.event_id = e.id;

-- Step 2: Show applications with missing profiles
SELECT 
    'Applications with missing profiles:' as info,
    a.id as application_id,
    a.participant_id,
    a.event_id,
    a.status,
    a.created_at
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
WHERE p.id IS NULL;

-- Step 3: Show applications with missing events
SELECT 
    'Applications with missing events:' as info,
    a.id as application_id,
    a.participant_id,
    a.event_id,
    a.status,
    a.created_at
FROM applications a
LEFT JOIN events e ON a.event_id = e.id
WHERE e.id IS NULL;

-- Step 4: Show applications with both profiles and events (working ones)
SELECT 
    'Working applications (with both profile and event):' as info,
    a.id as application_id,
    a.status,
    a.created_at,
    p.first_name,
    p.last_name,
    e.title as event_title,
    e.organization_name
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
LEFT JOIN events e ON a.event_id = e.id
WHERE p.id IS NOT NULL AND e.id IS NOT NULL
ORDER BY a.created_at DESC
LIMIT 10;

-- Step 5: Check if there are any profiles without corresponding auth.users
SELECT 
    'Profiles without auth.users:' as info,
    COUNT(*) as count
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Step 6: Check participant_id values in applications
SELECT 
    'Sample participant_ids in applications:' as info,
    DISTINCT a.participant_id,
    COUNT(*) as application_count
FROM applications a
GROUP BY a.participant_id
ORDER BY application_count DESC
LIMIT 10;

-- Step 7: Check if participant_ids in applications exist in profiles
SELECT 
    'Participant IDs not in profiles table:' as info,
    a.participant_id,
    COUNT(*) as application_count
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
WHERE p.id IS NULL
GROUP BY a.participant_id;

SELECT 'Application relationships check completed!' as result;


