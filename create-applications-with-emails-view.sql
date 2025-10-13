-- Create a view that includes applications with participant emails
-- This will make it easier to display complete application information

-- Step 1: Create a view that joins applications with profiles and auth.users
CREATE OR REPLACE VIEW applications_with_details AS
SELECT 
    a.id as application_id,
    a.event_id,
    a.participant_id,
    a.status,
    a.motivation_letter,
    a.created_at,
    p.first_name,
    p.last_name,
    p.user_type,
    au.email,
    e.title as event_title,
    e.organization_name,
    e.start_date,
    e.end_date,
    e.location,
    e.category
FROM applications a
LEFT JOIN profiles p ON a.participant_id = p.id
LEFT JOIN auth.users au ON a.participant_id = au.id
LEFT JOIN events e ON a.event_id = e.id;

-- Step 2: Grant access to the view for authenticated users
GRANT SELECT ON applications_with_details TO authenticated;

-- Step 3: Test the view
SELECT 
    'Applications with details view test:' as info,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as apps_with_names,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as apps_with_emails,
    COUNT(CASE WHEN event_title IS NOT NULL THEN 1 END) as apps_with_events
FROM applications_with_details;

-- Step 4: Show sample data from the view
SELECT 
    application_id,
    status,
    first_name,
    last_name,
    email,
    event_title,
    organization_name,
    created_at
FROM applications_with_details
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Applications with details view created successfully!' as result;


