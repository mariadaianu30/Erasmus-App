-- TEMPORARY FIX: More permissive policy for testing
-- This will allow ANY authenticated user to create events
-- Run this if the normal policy isn't working

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow organizations to create events" ON events;

-- Create a more permissive INSERT policy (for testing)
CREATE POLICY "Allow organizations to create events" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- This allows ANY authenticated user to insert

-- Verify it was created
SELECT 
    'Temporary permissive policy created' as status,
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'events' 
AND cmd = 'INSERT';

-- Now try creating an event in your app
-- If this works, the issue is with the policy condition (auth.uid() = organization_id)
-- If this still doesn't work, there's a different problem

