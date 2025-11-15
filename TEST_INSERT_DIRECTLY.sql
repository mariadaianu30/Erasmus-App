-- Test if INSERT actually works
-- This will help us see what's blocking

-- First, let's see what user you're logged in as (in the app, not SQL Editor)
-- This won't work in SQL Editor, but shows what we need to check

-- Check the INSERT policy details
SELECT 
    'INSERT Policy Details:' as info,
    policyname,
    cmd,
    roles,
    with_check as policy_condition
FROM pg_policies 
WHERE tablename = 'events' 
AND cmd = 'INSERT';

-- Check if RLS is enabled
SELECT 
    'RLS Status:' as info,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'events';

-- Try to see what would happen (this won't actually insert, just shows the policy)
-- The policy should check: auth.uid() = organization_id
-- So when you create an event, make sure eventData.organization_id = your user.id

SELECT 
    'IMPORTANT CHECK:' as info,
    'When creating event, organization_id in the data MUST equal your user.id (auth.uid())' as requirement,
    'Check the browser console for: "Organization ID in eventData:" and "User ID:" - they must match!' as action;

