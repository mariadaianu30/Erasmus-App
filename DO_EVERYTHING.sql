-- ============================================
-- COMPLETE FIX FOR EVENT CREATION
-- Copy this ENTIRE file and run it in Supabase SQL Editor
-- ============================================

-- Step 1: Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (to avoid conflicts)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'events') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON events';
    END LOOP;
END $$;

-- Step 3: Create INSERT policy (CRITICAL - allows organizations to create events)
CREATE POLICY "Allow organizations to create events" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = organization_id
    );

-- Step 4: Create SELECT policy for public (allows anyone to read published events)
CREATE POLICY "Allow public to read published events" ON events
    FOR SELECT
    TO public
    USING (
        is_published = true
    );

-- Step 5: Create SELECT policy for organizations (allows orgs to see their own events)
CREATE POLICY "Allow organizations to read their own events" ON events
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Step 6: Create UPDATE policy (allows organizations to update their events)
CREATE POLICY "Allow organizations to update their events" ON events
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = organization_id
    )
    WITH CHECK (
        auth.uid() = organization_id
    );

-- Step 7: Create DELETE policy (allows organizations to delete their events)
CREATE POLICY "Allow organizations to delete their events" ON events
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Step 8: Grant permissions
GRANT ALL ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- Step 9: Verify everything was created
SELECT 
    '✅ SETUP COMPLETE!' as status,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    CASE 
        WHEN COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) > 0 THEN '✅ INSERT policy exists - You can now create events!'
        ELSE '❌ INSERT policy missing - Something went wrong'
    END as result
FROM pg_policies 
WHERE tablename = 'events';

-- Final message
SELECT '🎉 All done! Refresh your browser, log out and log back in, then try creating an event.' as next_steps;

