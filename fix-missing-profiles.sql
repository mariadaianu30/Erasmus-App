-- Fix missing profile relationships for applications
-- This script identifies and fixes applications that show as "Unknown User"

-- Step 1: Check current state
SELECT 
    'Current Application-Profile Relationships:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as apps_with_profiles,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as apps_without_profiles
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id;

-- Step 2: Show applications without profiles
SELECT 
    'Applications showing as Unknown User:' as info,
    a.id as application_id,
    a.participant_id,
    a.status,
    a.created_at,
    'This participant_id has no corresponding profile' as issue
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
WHERE p.id IS NULL
ORDER BY a.created_at DESC;

-- Step 3: Check if these participant_ids exist in auth.users
SELECT 
    'Participant IDs in applications vs auth.users:' as info,
    a.participant_id,
    CASE WHEN au.id IS NOT NULL THEN 'EXISTS in auth.users' ELSE 'MISSING from auth.users' END as auth_status,
    CASE WHEN p.id IS NOT NULL THEN 'EXISTS in profiles' ELSE 'MISSING from profiles' END as profile_status
FROM applications a
LEFT JOIN auth.users au ON a.participant_id = au.id
LEFT JOIN profiles p ON a.participant_id = p.id
WHERE p.id IS NULL  -- Only show applications without profiles
ORDER BY a.created_at DESC;

-- Step 4: Create missing profiles for users that exist in auth.users but not in profiles
-- This will fix the "Unknown User" issue
INSERT INTO profiles (id, user_type, first_name, last_name, created_at, updated_at)
SELECT 
    au.id,
    'participant' as user_type,
    COALESCE(au.raw_user_meta_data->>'first_name', 'User') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', 'Name') as last_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles)
AND au.id IN (SELECT DISTINCT participant_id FROM applications WHERE participant_id IS NOT NULL);

-- Step 5: Verify the fix
SELECT 
    'After Profile Creation Fix:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as apps_with_profiles,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as apps_without_profiles
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id;

-- Step 6: Show sample of fixed applications
SELECT 
    'Sample of Fixed Applications:' as info,
    a.id as application_id,
    a.status,
    a.created_at,
    p.first_name,
    p.last_name,
    e.title as event_title
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
LEFT JOIN events e ON a.event_id = e.id
WHERE p.id IS NOT NULL
ORDER BY a.created_at DESC
LIMIT 5;

SELECT 'Missing profiles fix completed! Applications should no longer show as Unknown User.' as result;


