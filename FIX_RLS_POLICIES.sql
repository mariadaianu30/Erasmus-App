-- Fix RLS Policies for Events Table
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Enable RLS if not already enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on events table (to recreate them cleanly)
-- This ensures we don't have conflicts with existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'events') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON events';
    END LOOP;
END $$;

-- Step 3: Create INSERT policy (allows organizations to create events)
CREATE POLICY "Allow organizations to create events" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = organization_id
    );

-- Step 4: Create SELECT policy (allows public to read published events)
CREATE POLICY "Allow public to read published events" ON events
    FOR SELECT
    TO public
    USING (
        is_published = true
    );

-- Step 5: Create SELECT policy for organizations to see their own events (even if not published)
CREATE POLICY "Allow organizations to read their own events" ON events
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Step 6: Create UPDATE policy (allows organizations to update their own events)
CREATE POLICY "Allow organizations to update their events" ON events
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = organization_id
    )
    WITH CHECK (
        auth.uid() = organization_id
    );

-- Step 7: Create DELETE policy (allows organizations to delete their own events)
CREATE POLICY "Allow organizations to delete their events" ON events
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Step 8: Verify policies were created
SELECT 
    'Policies Created:' as status,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;

-- Step 9: Grant necessary permissions
GRANT ALL ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- Success message
SELECT 'RLS policies set up successfully! You can now create events.' as result;

