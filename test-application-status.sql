-- Test application status functionality
-- This script verifies that accept/reject functionality works correctly

-- Step 1: Check current application statuses
SELECT 
    'Current Application Statuses:' as info,
    status,
    COUNT(*) as count
FROM applications
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'accepted' THEN 2
        WHEN 'rejected' THEN 3
    END;

-- Step 2: Show applications that can be tested (pending ones)
SELECT 
    'Pending Applications Available for Testing:' as info,
    a.id as application_id,
    a.status,
    a.created_at,
    p.first_name,
    p.last_name,
    e.title as event_title,
    e.organization_name
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
LEFT JOIN events e ON a.event_id = e.id
WHERE a.status = 'pending'
ORDER BY a.created_at DESC
LIMIT 5;

-- Step 3: Test updating an application status (if any pending exist)
DO $$
DECLARE
    test_app_id UUID;
    original_status application_status;
BEGIN
    -- Find a pending application to test with
    SELECT id, status INTO test_app_id, original_status
    FROM applications 
    WHERE status = 'pending' 
    LIMIT 1;
    
    IF test_app_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with application ID: % (original status: %)', test_app_id, original_status;
        
        -- Test accepting the application
        UPDATE applications 
        SET status = 'accepted'::application_status 
        WHERE id = test_app_id;
        
        RAISE NOTICE 'Application accepted successfully!';
        
        -- Verify the update
        IF (SELECT status FROM applications WHERE id = test_app_id) = 'accepted' THEN
            RAISE NOTICE 'Status update verified: application is now accepted';
        ELSE
            RAISE NOTICE 'ERROR: Status update failed!';
        END IF;
        
        -- Reject the application
        UPDATE applications 
        SET status = 'rejected'::application_status 
        WHERE id = test_app_id;
        
        RAISE NOTICE 'Application rejected successfully!';
        
        -- Verify the rejection
        IF (SELECT status FROM applications WHERE id = test_app_id) = 'rejected' THEN
            RAISE NOTICE 'Status update verified: application is now rejected';
        ELSE
            RAISE NOTICE 'ERROR: Status update failed!';
        END IF;
        
        -- Restore original status
        UPDATE applications 
        SET status = original_status 
        WHERE id = test_app_id;
        
        RAISE NOTICE 'Original status restored: %', original_status;
        
    ELSE
        RAISE NOTICE 'No pending applications found for testing';
    END IF;
END $$;

-- Step 4: Show final application statuses
SELECT 
    'Final Application Statuses:' as info,
    status,
    COUNT(*) as count
FROM applications
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'accepted' THEN 2
        WHEN 'rejected' THEN 3
    END;

-- Step 5: Show how participants can see their status
SELECT 
    'How Participants See Their Applications:' as info,
    a.id as application_id,
    a.status,
    CASE 
        WHEN a.status = 'pending' THEN 'Under Review'
        WHEN a.status = 'accepted' THEN 'Accepted!'
        WHEN a.status = 'rejected' THEN 'Not Selected'
        ELSE 'Unknown Status'
    END as participant_view,
    p.first_name,
    p.last_name,
    e.title as event_title,
    a.created_at
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
LEFT JOIN events e ON a.event_id = e.id
ORDER BY a.created_at DESC
LIMIT 10;

SELECT 'Application status functionality test completed!' as result;
