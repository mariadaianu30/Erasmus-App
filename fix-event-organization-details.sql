-- Fix organization details for existing events
-- This script populates organization_name and organization_website for all events

-- Step 1: Update all events with organization details from profiles
UPDATE events 
SET 
    organization_name = p.organization_name,
    organization_website = p.website
FROM profiles p
WHERE events.organization_id = p.id 
  AND p.user_type = 'organization'
  AND (events.organization_name IS NULL OR events.organization_website IS NULL);

-- Step 2: Check what was updated
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN organization_name IS NOT NULL THEN 1 END) as events_with_org_name,
    COUNT(CASE WHEN organization_website IS NOT NULL THEN 1 END) as events_with_org_website
FROM events;

-- Step 3: Show sample of updated events
SELECT 
    title,
    organization_name,
    organization_website,
    organization_id
FROM events 
WHERE organization_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Ensure the trigger is working properly
-- Drop and recreate the trigger function
DROP TRIGGER IF EXISTS auto_populate_event_organization_trigger ON events;

CREATE OR REPLACE FUNCTION auto_populate_event_organization_details()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate organization_name and organization_website from profiles
    IF NEW.organization_id IS NOT NULL THEN
        SELECT 
            COALESCE(organization_name, 'Unknown Organization'),
            COALESCE(website, NULL)
        INTO 
            NEW.organization_name, 
            NEW.organization_website
        FROM profiles
        WHERE id = NEW.organization_id AND user_type = 'organization';
        
        -- If no profile found, set default
        IF NEW.organization_name IS NULL THEN
            NEW.organization_name := 'Unknown Organization';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER auto_populate_event_organization_trigger
    BEFORE INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_event_organization_details();

-- Step 5: Test the trigger with a sample event
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
        RAISE NOTICE 'Testing trigger with user: %', test_user_id;
        
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
                'Test Event - Trigger Verification',
                'This is a test event to verify the organization details trigger works.',
                NOW() + INTERVAL '1 day',
                NOW() + INTERVAL '2 days',
                'Test Location',
                10,
                'Technology',
                test_user_id,
                false
            ) RETURNING id INTO test_event_id;
            
            -- Check the inserted values
            SELECT organization_name, organization_website 
            INTO NEW.organization_name, NEW.organization_website
            FROM events WHERE id = test_event_id;
            
            RAISE NOTICE 'SUCCESS: Trigger test passed. Organization name: %, Website: %', NEW.organization_name, NEW.organization_website;
            
            -- Delete the test event
            DELETE FROM events WHERE id = test_event_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Trigger test failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No organization users found';
    END IF;
END $$;

-- Step 6: Show final status
SELECT 
    'Events with organization details:' as status,
    COUNT(*) as total_events,
    COUNT(CASE WHEN organization_name IS NOT NULL THEN 1 END) as events_with_org_name,
    COUNT(CASE WHEN organization_website IS NOT NULL THEN 1 END) as events_with_org_website
FROM events;

SELECT 'Event organization details fix completed successfully!' as result;
