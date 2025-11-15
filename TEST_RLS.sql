-- Test if RLS policies are working correctly
-- Run this to see what's happening

-- 1. Check current user (will be NULL in SQL Editor, but check anyway)
SELECT 
    'Current Auth Context:' as test,
    auth.uid() as user_id,
    auth.role() as role;

-- 2. List all policies with details
SELECT 
    'All Policies:' as test,
    policyname,
    cmd as operation,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;

-- 3. Check if INSERT policy specifically exists and is correct
SELECT 
    'INSERT Policy Check:' as test,
    policyname,
    cmd,
    roles,
    with_check as policy_condition,
    CASE 
        WHEN with_check LIKE '%auth.uid()%' AND with_check LIKE '%organization_id%' THEN '✅ Policy looks correct'
        ELSE '⚠️ Policy condition might be wrong'
    END as status
FROM pg_policies 
WHERE tablename = 'events' 
AND cmd = 'INSERT';

-- 4. Test if we can see the events table structure
SELECT 
    'Table Structure:' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('id', 'organization_id', 'title', 'description', 'is_published')
ORDER BY ordinal_position;

-- 5. Check RLS status
SELECT 
    'RLS Status:' as test,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'events';

