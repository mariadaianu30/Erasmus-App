-- ============================================
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR
-- Copy everything below and paste into Supabase
-- ============================================

-- Step 1: Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
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

-- Step 4: Create SELECT policy for public
CREATE POLICY "Allow public to read published events" ON events
    FOR SELECT
    TO public
    USING (
        is_published = true
    );

-- Step 5: Create SELECT policy for organizations
CREATE POLICY "Allow organizations to read their own events" ON events
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Step 6: Create UPDATE policy
CREATE POLICY "Allow organizations to update their events" ON events
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = organization_id
    )
    WITH CHECK (
        auth.uid() = organization_id
    );

-- Step 7: Create DELETE policy
CREATE POLICY "Allow organizations to delete their events" ON events
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Step 8: Grant permissions
GRANT ALL ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- Step 9: Verify
SELECT 
    '✅ DONE! Policies created:' as status,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policy_exists
FROM pg_policies 
WHERE tablename = 'events';

SELECT '🎉 Refresh browser, log out/in, then try creating an event!' as next_step;

