-- Populate database with sample data to make home page statistics meaningful
-- This script adds sample events, applications, and ensures we have good stats to display

-- Step 1: Check current statistics
SELECT 
    'Current Statistics:' as info,
    (SELECT COUNT(*) FROM events WHERE is_published = true) as published_events,
    (SELECT COUNT(*) FROM events WHERE is_published = true AND start_date >= NOW()) as upcoming_events,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'organization') as organizations,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'participant') as participants,
    (SELECT COUNT(*) FROM applications) as total_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'accepted') as accepted_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications;

-- Step 2: Ensure we have some sample organizations (if not already present)
-- These should already exist from previous setup, but let's verify
SELECT 
    'Sample Organizations Check:' as info,
    COUNT(*) as org_count,
    STRING_AGG(organization_name, ', ') as organization_names
FROM profiles 
WHERE user_type = 'organization' 
AND organization_name IS NOT NULL;

-- Step 3: Check sample events
SELECT 
    'Sample Events Check:' as info,
    COUNT(*) as event_count,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_count,
    COUNT(CASE WHEN start_date >= NOW() THEN 1 END) as upcoming_count
FROM events;

-- Step 4: Check applications
SELECT 
    'Applications Status:' as info,
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

-- Step 5: If we need more applications for better statistics, create some sample ones
-- (This will only create applications if there are events and participants available)
DO $$
DECLARE
    sample_event_id UUID;
    sample_participant_id UUID;
    app_count INTEGER;
BEGIN
    -- Check if we have enough applications
    SELECT COUNT(*) INTO app_count FROM applications;
    
    IF app_count < 5 THEN
        -- Get a sample event
        SELECT id INTO sample_event_id 
        FROM events 
        WHERE is_published = true 
        LIMIT 1;
        
        -- Get a sample participant
        SELECT id INTO sample_participant_id 
        FROM profiles 
        WHERE user_type = 'participant' 
        LIMIT 1;
        
        IF sample_event_id IS NOT NULL AND sample_participant_id IS NOT NULL THEN
            -- Create some sample applications with different statuses
            INSERT INTO applications (event_id, participant_id, motivation_letter, status, created_at)
            VALUES 
                (sample_event_id, sample_participant_id, 'I am very interested in this opportunity because it aligns with my career goals.', 'accepted', NOW() - INTERVAL '5 days'),
                (sample_event_id, sample_participant_id, 'This opportunity seems perfect for developing my skills.', 'pending', NOW() - INTERVAL '2 days'),
                (sample_event_id, sample_participant_id, 'I would love to participate in this event.', 'accepted', NOW() - INTERVAL '1 day');
            
            RAISE NOTICE 'Created 3 sample applications for better statistics';
        ELSE
            RAISE NOTICE 'No sample event or participant found - cannot create sample applications';
        END IF;
    ELSE
        RAISE NOTICE 'Sufficient applications already exist (% applications)', app_count;
    END IF;
END $$;

-- Step 6: Final statistics check
SELECT 
    'Final Statistics for Home Page:' as info,
    (SELECT COUNT(*) FROM events WHERE is_published = true) as published_events,
    (SELECT COUNT(*) FROM events WHERE is_published = true AND start_date >= NOW()) as upcoming_events,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'organization') as organizations,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'participant') as participants,
    (SELECT COUNT(*) FROM applications) as total_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'accepted') as accepted_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications;

-- Step 7: Calculate acceptance rate
SELECT 
    'Acceptance Rate:' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM applications) > 0 THEN
            ROUND(
                (SELECT COUNT(*) FROM applications WHERE status = 'accepted')::numeric / 
                (SELECT COUNT(*) FROM applications)::numeric * 100, 
                1
            ) || '%'
        ELSE 'N/A'
    END as acceptance_rate;

SELECT 'Home page statistics population completed!' as result;


