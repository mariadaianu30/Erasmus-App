-- Check Current RLS Policies for Events Table
-- Run this in Supabase SQL Editor to see what policies exist

-- 1. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'events';

-- 2. List all existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;

-- 3. Check if you can insert (this will show what's blocking)
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
SELECT 
    'Your User ID:' as info,
    id,
    email,
    raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email = (SELECT email FROM auth.users LIMIT 1);

-- 4. Test if INSERT would work (simulation)
-- NOTE: SQL Editor runs as anonymous user, so auth.uid() will be NULL here
-- This is NORMAL! Your web app runs as authenticated user, so it will work.
SELECT 
    'RLS Check Simulation:' as info,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '⚠️ SQL Editor is anonymous (this is normal) - Your web app will be authenticated'
        ELSE '✅ Logged in - Check if policy allows INSERT'
    END as status,
    'Important: Check if INSERT policy exists above!' as note;

