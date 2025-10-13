-- Create Organizations for Sample Events
-- This script creates organization profiles and links events to them
-- 
-- IMPORTANT: You need to manually create 3 user accounts first through the app:
-- 1. Register as "Organization" with these emails:
--    - tech-university@example.com
--    - student-theater@example.com  
--    - youth-ngo@example.com
-- 2. Then run this script to update their profiles and link events

-- Step 1: Create organization profiles (run this AFTER creating the user accounts)
UPDATE profiles 
SET 
    organization_name = 'Technical University of Munich',
    bio = 'Leading technical university in Germany, offering world-class education in engineering, technology, and innovation.',
    location = 'Munich, Germany',
    website = 'https://www.tum.de'
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'tech-university@example.com'
);

UPDATE profiles 
SET 
    organization_name = 'Student Theater Group',
    bio = 'Dynamic student theater company creating innovative performances and fostering artistic talent among young people.',
    location = 'Munich, Germany',
    website = 'https://student-theater-munich.de'
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'student-theater@example.com'
);

UPDATE profiles 
SET 
    organization_name = 'Youth Impact NGO',
    bio = 'Non-profit organization dedicated to empowering young people and creating positive social change in communities.',
    location = 'Munich, Germany',
    website = 'https://youth-impact.org'
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'youth-ngo@example.com'
);

-- Step 2: Link events to organizations
-- Technology events -> Technical University of Munich
UPDATE events 
SET organization_id = (
    SELECT id FROM auth.users 
    WHERE email = 'tech-university@example.com'
)
WHERE id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,  -- AI & Machine Learning Workshop
    '11111111-1111-1111-1111-111111111112'::uuid,  -- Sustainable Engineering Conference
    '11111111-1111-1111-1111-111111111113'::uuid   -- Student Entrepreneurship Bootcamp
);

-- Arts events -> Student Theater Group
UPDATE events 
SET organization_id = (
    SELECT id FROM auth.users 
    WHERE email = 'student-theater@example.com'
)
WHERE id IN (
    '22222222-2222-2222-2222-222222222221'::uuid,  -- Romeo and Juliet
    '22222222-2222-2222-2222-222222222222'::uuid,  -- Theater Workshop
    '22222222-2222-2222-2222-222222222223'::uuid   -- Student Film Festival
);

-- Social Impact events -> Youth Impact NGO
UPDATE events 
SET organization_id = (
    SELECT id FROM auth.users 
    WHERE email = 'youth-ngo@example.com'
)
WHERE id IN (
    '33333333-3333-3333-3333-333333333331'::uuid,  -- Community Garden Initiative
    '33333333-3333-3333-3333-333333333332'::uuid,  -- Youth Leadership Summit
    '33333333-3333-3333-3333-333333333333'::uuid   -- Digital Literacy for Seniors
);

-- Step 3: Verify the results
SELECT 
    e.title,
    e.category,
    p.organization_name,
    p.website
FROM events e
LEFT JOIN profiles p ON e.organization_id = p.id
ORDER BY e.category, e.title;

SELECT 'Organizations created and events linked successfully!' as status;
