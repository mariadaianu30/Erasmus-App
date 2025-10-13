-- Fix foreign key relationships for applications table
-- This script fixes the missing foreign key constraints that prevent proper joins

-- Step 1: Check current foreign key constraints on applications table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'applications';

-- Step 2: Check if the foreign key constraints exist
DO $$
DECLARE
    participant_fk_exists BOOLEAN;
    event_fk_exists BOOLEAN;
BEGIN
    -- Check if participant_id foreign key exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_participant_id_fkey'
        AND table_name = 'applications'
    ) INTO participant_fk_exists;
    
    -- Check if event_id foreign key exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_event_id_fkey'
        AND table_name = 'applications'
    ) INTO event_fk_exists;
    
    RAISE NOTICE 'Participant FK exists: %, Event FK exists: %', participant_fk_exists, event_fk_exists;
    
    -- Add participant_id foreign key if missing
    IF NOT participant_fk_exists THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_participant_id_fkey 
        FOREIGN KEY (participant_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added participant_id foreign key constraint';
    ELSE
        RAISE NOTICE 'Participant_id foreign key already exists';
    END IF;
    
    -- Add event_id foreign key if missing
    IF NOT event_fk_exists THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added event_id foreign key constraint';
    ELSE
        RAISE NOTICE 'Event_id foreign key already exists';
    END IF;
END $$;

-- Step 3: Verify the foreign keys were created
SELECT 
    'Foreign key constraints after fix:' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'applications'
ORDER BY tc.constraint_name;

-- Step 4: Test the relationship by querying applications with profiles
SELECT 
    'Testing applications-profiles relationship:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as applications_with_profile
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id;

-- Step 5: Test the relationship by querying applications with events
SELECT 
    'Testing applications-events relationship:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as applications_with_event
FROM applications a
LEFT JOIN events e ON a.event_id = e.id;

-- Step 6: Show a sample of applications with joined data
SELECT 
    a.id as application_id,
    a.status,
    a.created_at,
    p.first_name,
    p.last_name,
    au.email,
    e.title as event_title,
    e.organization_name
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
LEFT JOIN auth.users au ON a.participant_id = au.id
LEFT JOIN events e ON a.event_id = e.id
ORDER BY a.created_at DESC
LIMIT 5;

SELECT 'Foreign key relationships fixed successfully!' as result;
