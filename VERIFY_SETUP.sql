-- Verify RLS Setup for Events Table
-- Run this to check if everything is configured correctly

-- 1. Check if RLS is enabled
SELECT 
    'RLS Status:' as check_type,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED - Enable it now!'
    END as status
FROM pg_tables 
WHERE tablename = 'events';

-- 2. List all policies (this is what matters)
SELECT 
    'Policy Check:' as check_type,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Required for creating events'
        WHEN cmd = 'SELECT' THEN '✅ Required for viewing events'
        WHEN cmd = 'UPDATE' THEN '✅ Required for editing events'
        WHEN cmd = 'DELETE' THEN '✅ Required for deleting events'
        ELSE 'Other'
    END as purpose
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY 
    CASE cmd
        WHEN 'INSERT' THEN 1
        WHEN 'SELECT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
    END,
    policyname;

-- 3. Check if INSERT policy exists (most important!)
SELECT 
    'INSERT Policy Check:' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ INSERT policy exists'
        ELSE '❌ NO INSERT POLICY - Run FIX_RLS_POLICIES.sql NOW!'
    END as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'events' 
AND cmd = 'INSERT';

-- 4. Summary
SELECT 
    'Summary:' as check_type,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
    CASE 
        WHEN COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) > 0 THEN '✅ Ready to create events'
        ELSE '❌ Run FIX_RLS_POLICIES.sql first!'
    END as ready_status
FROM pg_policies 
WHERE tablename = 'events';

-- Note: The "NOT LOGGED IN" message in CHECK_RLS_POLICIES.sql is NORMAL
-- SQL Editor runs as anonymous user. Your web app runs as authenticated user.
-- As long as the INSERT policy exists above, it will work when you're logged in!

