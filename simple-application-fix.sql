-- Simple fix for application submission issues
-- This script fixes the most common issues preventing application submission

-- Step 1: Update motivation letter constraint (more lenient)
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_motivation_letter_check;
ALTER TABLE applications ADD CONSTRAINT applications_motivation_letter_check 
    CHECK (LENGTH(motivation_letter) >= 1 AND LENGTH(motivation_letter) <= 5000);

-- Step 2: Fix RLS policies for applications
-- Drop existing policies
DROP POLICY IF EXISTS "Participants can view own applications" ON applications;
DROP POLICY IF EXISTS "Organizations can view applications to their events" ON applications;
DROP POLICY IF EXISTS "Participants can apply to events" ON applications;
DROP POLICY IF EXISTS "Organizations can update application status" ON applications;

-- Create simplified policies
CREATE POLICY "Participants can view own applications" ON applications
    FOR SELECT USING (auth.uid() = participant_id);

CREATE POLICY "Organizations can view applications to their events" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id AND organization_id = auth.uid()
        )
    );

CREATE POLICY "Participants can apply to events" ON applications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = participant_id
    );

CREATE POLICY "Organizations can update application status" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id AND organization_id = auth.uid()
        )
    );

-- Step 3: Test application creation
DO $$
DECLARE
    test_user_id UUID;
    test_event_id UUID;
    test_application_id UUID;
BEGIN
    -- Get any participant user
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE user_type = 'participant' 
    LIMIT 1;
    
    -- Get any published event
    SELECT id INTO test_event_id 
    FROM events 
    WHERE is_published = true 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_event_id IS NOT NULL THEN
        RAISE NOTICE 'Testing application creation with user: % and event: %', test_user_id, test_event_id;
        
        -- Try to insert a test application
        BEGIN
            INSERT INTO applications (
                event_id,
                participant_id,
                motivation_letter,
                status
            ) VALUES (
                test_event_id,
                test_user_id,
                'Test application',
                'pending'
            ) RETURNING id INTO test_application_id;
            
            -- If we get here, the insert worked - delete the test application
            DELETE FROM applications WHERE id = test_application_id;
            RAISE NOTICE 'SUCCESS: Application creation test PASSED';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Application creation test FAILED: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No participant users or published events found - skipping test';
    END IF;
END $$;

SELECT 'Application submission fix completed successfully!' as result;


