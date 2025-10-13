-- Fix RLS policies for event creation
-- This script ensures organizations can create events properly

-- First, let's check if the events table has the organization_name and organization_website columns
-- If not, add them
DO $$ 
BEGIN
    -- Add organization_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'organization_name'
    ) THEN
        ALTER TABLE events ADD COLUMN organization_name TEXT;
    END IF;
    
    -- Add organization_website column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'organization_website'
    ) THEN
        ALTER TABLE events ADD COLUMN organization_website TEXT;
    END IF;
END $$;

-- Drop existing RLS policies for events
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Organizations can insert own events" ON events;
DROP POLICY IF EXISTS "Organizations can update own events" ON events;
DROP POLICY IF EXISTS "Organizations can delete own events" ON events;

-- Create improved RLS policies for events

-- 1. Anyone can view published events
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (is_published = true);

-- 2. Organizations can view their own events (published or not)
CREATE POLICY "Organizations can view own events" ON events
    FOR SELECT USING (
        auth.uid() = organization_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    );

-- 3. Organizations can insert events
CREATE POLICY "Organizations can insert events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    );

-- 4. Organizations can update their own events
CREATE POLICY "Organizations can update own events" ON events
    FOR UPDATE USING (
        auth.uid() = organization_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    );

-- 5. Organizations can delete their own events
CREATE POLICY "Organizations can delete own events" ON events
    FOR DELETE USING (
        auth.uid() = organization_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    );

-- Create a function to auto-populate organization details when creating events
CREATE OR REPLACE FUNCTION auto_populate_event_organization_details()
RETURNS TRIGGER AS $$
BEGIN
    -- If organization_id is set but organization_name is not, populate from profile
    IF NEW.organization_id IS NOT NULL AND NEW.organization_name IS NULL THEN
        SELECT organization_name, website
        INTO NEW.organization_name, NEW.organization_website
        FROM profiles
        WHERE id = NEW.organization_id AND user_type = 'organization';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-populate organization details
DROP TRIGGER IF EXISTS auto_populate_event_organization_trigger ON events;
CREATE TRIGGER auto_populate_event_organization_trigger
    BEFORE INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_event_organization_details();

-- Test the setup by checking if we can create a test event
-- This will help us verify the policies are working
DO $$
DECLARE
    test_user_id UUID;
    test_event_id UUID;
BEGIN
    -- Check if there are any organization users
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE user_type = 'organization' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found organization user: %', test_user_id;
        
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
                'Test Event - Will be deleted',
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
            RAISE NOTICE 'Event creation test PASSED - RLS policies are working correctly';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Event creation test FAILED: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No organization users found - skipping test';
    END IF;
END $$;

SELECT 'Event creation RLS policies fixed successfully!' as status;


