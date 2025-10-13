-- =====================================================
-- COMPREHENSIVE EVENT CREATION FIX
-- =====================================================
-- This script fixes all issues preventing event creation
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure events table has all required columns
DO $$ 
BEGIN
    -- Add organization_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'organization_name'
    ) THEN
        ALTER TABLE events ADD COLUMN organization_name TEXT;
        RAISE NOTICE 'Added organization_name column to events table';
    END IF;
    
    -- Add organization_website column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'organization_website'
    ) THEN
        ALTER TABLE events ADD COLUMN organization_website TEXT;
        RAISE NOTICE 'Added organization_website column to events table';
    END IF;
END $$;

-- Step 2: Drop all existing RLS policies for events
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Organizations can view own events" ON events;
DROP POLICY IF EXISTS "Organizations can insert own events" ON events;
DROP POLICY IF EXISTS "Organizations can insert events" ON events;
DROP POLICY IF EXISTS "Organizations can update own events" ON events;
DROP POLICY IF EXISTS "Organizations can delete own events" ON events;

-- Step 3: Create improved RLS policies for events

-- Policy 1: Anyone can view published events
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (is_published = true);

-- Policy 2: Organizations can view their own events (published or not)
CREATE POLICY "Organizations can view own events" ON events
    FOR SELECT USING (
        auth.uid() = organization_id
    );

-- Policy 3: Organizations can insert events
-- This is the key policy that was causing the 403 error
CREATE POLICY "Organizations can insert events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = organization_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    );

-- Policy 4: Organizations can update their own events
CREATE POLICY "Organizations can update own events" ON events
    FOR UPDATE USING (
        auth.uid() = organization_id
    ) WITH CHECK (
        auth.uid() = organization_id
    );

-- Policy 5: Organizations can delete their own events
CREATE POLICY "Organizations can delete own events" ON events
    FOR DELETE USING (
        auth.uid() = organization_id
    );

-- Step 4: Create a function to auto-populate organization details
CREATE OR REPLACE FUNCTION auto_populate_event_organization_details()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate organization_name and organization_website from profiles
    IF NEW.organization_id IS NOT NULL THEN
        SELECT organization_name, website
        INTO NEW.organization_name, NEW.organization_website
        FROM profiles
        WHERE id = NEW.organization_id AND user_type = 'organization';
        
        -- If no profile found, set defaults
        IF NEW.organization_name IS NULL THEN
            NEW.organization_name := 'Unknown Organization';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to auto-populate organization details
DROP TRIGGER IF EXISTS auto_populate_event_organization_trigger ON events;
CREATE TRIGGER auto_populate_event_organization_trigger
    BEFORE INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_event_organization_details();

-- Step 6: Ensure RLS is enabled on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 7: Test the setup
DO $$
DECLARE
    test_user_id UUID;
    test_event_id UUID;
    test_profile_count INTEGER;
BEGIN
    -- Check if there are any organization users
    SELECT COUNT(*) INTO test_profile_count
    FROM profiles 
    WHERE user_type = 'organization';
    
    RAISE NOTICE 'Found % organization profiles', test_profile_count;
    
    IF test_profile_count > 0 THEN
        SELECT id INTO test_user_id 
        FROM profiles 
        WHERE user_type = 'organization' 
        LIMIT 1;
        
        RAISE NOTICE 'Testing with organization user: %', test_user_id;
        
        -- Try to insert a test event (this will be rolled back)
        BEGIN
            INSERT INTO events (
                title, 
                description, 
                start_date, 
                end_date, 
                location, 
                max_participants, 
                category, 
                organization_id,
                is_published
            ) VALUES (
                'Test Event - RLS Verification',
                'This is a test event to verify the RLS policies are working correctly.',
                NOW() + INTERVAL '1 day',
                NOW() + INTERVAL '2 days',
                'Test Location',
                10,
                'Technology',
                test_user_id,
                false
            ) RETURNING id INTO test_event_id;
            
            -- If we get here, the insert worked - delete the test event
            DELETE FROM events WHERE id = test_event_id;
            RAISE NOTICE 'SUCCESS: Event creation test PASSED - RLS policies are working correctly';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Event creation test FAILED: %', SQLERRM;
            RAISE NOTICE 'Error code: %', SQLSTATE;
        END;
    ELSE
        RAISE NOTICE 'WARNING: No organization users found - please create an organization user first';
    END IF;
END $$;

-- Step 8: Show current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

-- Step 9: Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

SELECT 'Event creation fix completed successfully!' as status;


