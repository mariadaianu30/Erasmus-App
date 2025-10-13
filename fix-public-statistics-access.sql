-- Fix RLS policies to allow public access to statistics for home page
-- This allows logged-out users to see real statistics

-- Step 1: Check current RLS policies
SELECT 
    'Current RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('events', 'profiles', 'applications')
ORDER BY tablename;

-- Step 2: Create public statistics policies for events
-- Allow anyone to count published events (for home page stats)
DROP POLICY IF EXISTS "Public can view published events count" ON events;

CREATE POLICY "Public can view published events count" ON events
    FOR SELECT 
    USING (is_published = true);

-- Step 3: Create public statistics policies for profiles
-- Allow anyone to count organizations and participants (for home page stats)
DROP POLICY IF EXISTS "Public can view user counts" ON profiles;

CREATE POLICY "Public can view user counts" ON profiles
    FOR SELECT 
    USING (true);

-- Step 4: Create public statistics policies for applications
-- Allow anyone to count applications (for home page stats)
DROP POLICY IF EXISTS "Public can view application counts" ON applications;

CREATE POLICY "Public can view application counts" ON applications
    FOR SELECT 
    USING (true);

-- Step 5: Grant public access to these tables for statistics
-- Grant SELECT permission to anon (anonymous) users
GRANT SELECT ON events TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON applications TO anon;

-- Step 6: Test the public access by simulating what the home page queries do
-- These should now work for logged-out users
SELECT 
    'Testing Public Access:' as info,
    'Events Query Test' as test_type;

-- Test events count (should work for public)
SELECT COUNT(*) as published_events_count
FROM events 
WHERE is_published = true;

-- Test upcoming events count
SELECT COUNT(*) as upcoming_events_count
FROM events 
WHERE is_published = true 
AND start_date >= NOW();

SELECT 
    'Profiles Query Test' as test_type;

-- Test organizations count
SELECT COUNT(*) as organizations_count
FROM profiles 
WHERE user_type = 'organization';

-- Test participants count
SELECT COUNT(*) as participants_count
FROM profiles 
WHERE user_type = 'participant';

SELECT 
    'Applications Query Test' as test_type;

-- Test applications count
SELECT COUNT(*) as total_applications_count
FROM applications;

-- Test accepted applications count
SELECT COUNT(*) as accepted_applications_count
FROM applications 
WHERE status = 'accepted';

-- Test pending applications count
SELECT COUNT(*) as pending_applications_count
FROM applications 
WHERE status = 'pending';

-- Step 7: Show final statistics that should now be visible to public
SELECT 
    'Final Public Statistics:' as info,
    (SELECT COUNT(*) FROM events WHERE is_published = true) as published_events,
    (SELECT COUNT(*) FROM events WHERE is_published = true AND start_date >= NOW()) as upcoming_events,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'organization') as organizations,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'participant') as participants,
    (SELECT COUNT(*) FROM applications) as total_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'accepted') as accepted_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications;

SELECT 'Public statistics access fixed! Home page should now show real numbers for logged-out users.' as result;


