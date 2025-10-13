-- Quick database connection test
-- Run this in Supabase SQL Editor to check if everything is working

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'events', 'applications')
ORDER BY table_name;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'events', 'applications')
AND schemaname = 'public';

-- Check current policies on events table
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

-- Check if there are any organization users
SELECT 
    COUNT(*) as organization_count
FROM profiles 
WHERE user_type = 'organization';

-- Test a simple query (should work for anyone)
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_events
FROM events;

SELECT 'Database connection test completed successfully!' as status;


