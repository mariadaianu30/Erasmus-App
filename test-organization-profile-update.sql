-- Test Organization Profile Update
-- This script checks for any constraints that might be causing profile update issues

-- Check current organization profiles
SELECT 
    id,
    organization_name,
    first_name,
    last_name,
    bio,
    location,
    website,
    user_type
FROM profiles 
WHERE user_type = 'organization';

-- Check constraints on profiles table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- Check if there are any triggers on profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

SELECT 'Organization profile update test completed!' as status;


