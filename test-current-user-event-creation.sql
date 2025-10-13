-- Test script to check if current user can create events
-- Run this in Supabase SQL Editor while logged in as an organization

-- Check current user info
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- Check if current user has a profile
SELECT 
    id,
    user_type,
    first_name,
    last_name,
    organization_name
FROM profiles 
WHERE id = auth.uid();

-- Check RLS policies on events table
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events' 
ORDER BY policyname;

-- Test event creation (this will be rolled back)
BEGIN;

-- Try to insert a test event
INSERT INTO events (
    title, 
    description, 
    start_date, 
    end_date, 
    location, 
    max_participants, 
    category, 
    organization_id,
    is_published
) VALUES (
    'Test Event - User Verification',
    'This is a test event to verify the current user can create events.',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    'Test Location',
    10,
    'Technology',
    auth.uid(),
    false
);

-- If we get here, the insert worked
SELECT 'SUCCESS: Event creation test PASSED!' as result;

-- Rollback the test insert
ROLLBACK;

-- Show any error details
SELECT 'Test completed - check results above' as status;


