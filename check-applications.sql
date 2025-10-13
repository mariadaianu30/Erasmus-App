-- Check applications in the database
-- This script helps debug why applications aren't showing in dashboard

-- Check if applications table exists and has data
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_applications,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications
FROM applications;

-- Show recent applications with details
SELECT 
    a.id,
    a.status,
    a.created_at,
    a.participant_id,
    e.title as event_title,
    e.organization_name,
    p.first_name,
    p.last_name,
    p.user_type
FROM applications a
LEFT JOIN events e ON a.event_id = e.id
LEFT JOIN profiles p ON a.participant_id = p.id
ORDER BY a.created_at DESC
LIMIT 10;

-- Check if there are any applications for the current user
-- (This will show all applications, you can filter by user ID)
SELECT 
    'Applications found:' as status,
    COUNT(*) as count
FROM applications;

SELECT 'Applications check completed!' as result;


