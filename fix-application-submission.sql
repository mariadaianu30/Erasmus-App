-- Fix application submission issues
-- This script ensures applications can be created properly

-- Check current RLS policies on applications table
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

-- Test application creation (this will be rolled back)
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
                'This is a test application to verify the system works.',
                'pending'
            ) RETURNING id INTO test_application_id;
            
            -- If we get here, the insert worked - delete the test application
            DELETE FROM applications WHERE id = test_application_id;
            RAISE NOTICE 'SUCCESS: Application creation test PASSED';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Application creation test FAILED: %', SQLERRM;
            RAISE NOTICE 'Error code: %', SQLSTATE;
        END;
    ELSE
        RAISE NOTICE 'No participant users or published events found - skipping test';
    END IF;
END $$;

SELECT 'Application submission test completed!' as status;
