-- Simple fix for event creation timeout issues
-- This script creates a more permissive RLS policy

-- Temporarily disable RLS to test
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Test if we can insert without RLS
DO $$
DECLARE
    test_user_id UUID;
    test_event_id UUID;
BEGIN
    -- Get any organization user
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE user_type = 'organization' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing event creation with user: %', test_user_id;
        
        -- Try to insert a test event
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
                'Test Event - No RLS',
                'This is a test event created with RLS disabled.',
                NOW() + INTERVAL '1 day',
                NOW() + INTERVAL '2 days',
                'Test Location',
                10,
                'Technology',
                test_user_id,
                false
            ) RETURNING id INTO test_event_id;
            
            -- Delete the test event
            DELETE FROM events WHERE id = test_event_id;
            RAISE NOTICE 'SUCCESS: Event creation works without RLS';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Event creation failed even without RLS: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No organization users found';
    END IF;
END $$;

-- Re-enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create a very simple, permissive policy
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Organizations can view own events" ON events;
DROP POLICY IF EXISTS "Organizations can insert events" ON events;
DROP POLICY IF EXISTS "Organizations can update own events" ON events;
DROP POLICY IF EXISTS "Organizations can delete own events" ON events;

-- Simple policies
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (is_published = true);

CREATE POLICY "Organizations can manage events" ON events
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    );

-- Test the new policies
DO $$
DECLARE
    test_user_id UUID;
    test_event_id UUID;
BEGIN
    -- Get any organization user
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE user_type = 'organization' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing event creation with new policies and user: %', test_user_id;
        
        -- Try to insert a test event
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
                'Test Event - New Policy',
                'This is a test event created with the new permissive policy.',
                NOW() + INTERVAL '1 day',
                NOW() + INTERVAL '2 days',
                'Test Location',
                10,
                'Technology',
                test_user_id,
                false
            ) RETURNING id INTO test_event_id;
            
            -- Delete the test event
            DELETE FROM events WHERE id = test_event_id;
            RAISE NOTICE 'SUCCESS: Event creation works with new policy';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Event creation failed with new policy: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No organization users found';
    END IF;
END $$;

SELECT 'Simple event creation fix completed!' as status;


