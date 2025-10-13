-- Create Organizations (Simple Solution)
-- This script creates organization profiles and links events without foreign key issues

-- Step 1: Temporarily disable the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

-- Step 2: Insert organization profiles directly
INSERT INTO profiles (id, user_type, first_name, last_name, organization_name, bio, location, website, birth_date)
VALUES 
-- Technical University of Munich
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'organization',
    'TU',
    'Munich',
    'Technical University of Munich',
    'Leading technical university in Germany, offering world-class education in engineering, technology, and innovation.',
    'Munich, Germany',
    'https://www.tum.de',
    '1900-01-01'::date
),
-- Student Theater Group  
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'organization',
    'Student',
    'Theater',
    'Student Theater Group',
    'Dynamic student theater company creating innovative performances and fostering artistic talent among young people.',
    'Munich, Germany',
    'https://student-theater-munich.de',
    '1900-01-01'::date
),
-- Youth Impact NGO
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
    'organization',
    'Youth',
    'Impact',
    'Youth Impact NGO',
    'Non-profit organization dedicated to empowering young people and creating positive social change in communities.',
    'Munich, Germany',
    'https://youth-impact.org',
    '1900-01-01'::date
)
ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    website = EXCLUDED.website;

-- Step 3: Link events to organizations
-- Technology events -> Technical University of Munich
UPDATE events 
SET organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
WHERE id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,  -- AI & Machine Learning Workshop
    '11111111-1111-1111-1111-111111111112'::uuid,  -- Sustainable Engineering Conference
    '11111111-1111-1111-1111-111111111113'::uuid   -- Student Entrepreneurship Bootcamp
);

-- Arts events -> Student Theater Group
UPDATE events 
SET organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
WHERE id IN (
    '22222222-2222-2222-2222-222222222221'::uuid,  -- Romeo and Juliet
    '22222222-2222-2222-2222-222222222222'::uuid,  -- Theater Workshop
    '22222222-2222-2222-2222-222222222223'::uuid   -- Student Film Festival
);

-- Social Impact events -> Youth Impact NGO
UPDATE events 
SET organization_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
WHERE id IN (
    '33333333-3333-3333-3333-333333333331'::uuid,  -- Community Garden Initiative
    '33333333-3333-3333-3333-333333333332'::uuid,  -- Youth Leadership Summit
    '33333333-3333-3333-3333-333333333333'::uuid   -- Digital Literacy for Seniors
);

-- Step 4: Re-enable the foreign key constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Verify the results
SELECT 
    e.title,
    e.category,
    p.organization_name,
    p.website
FROM events e
LEFT JOIN profiles p ON e.organization_id = p.id
ORDER BY e.category, e.title;

-- Step 6: Check organizations count
SELECT COUNT(*) as organization_count FROM profiles WHERE user_type = 'organization';

SELECT 'Organizations created successfully! Check the organizations page now.' as status;

