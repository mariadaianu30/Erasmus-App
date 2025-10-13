-- Insert Sample Organizations into Profiles Table
-- This will add the 3 sample organizations as actual user profiles

-- Insert Technical University of Munich
INSERT INTO profiles (
    id,
    user_type,
    organization_name,
    location,
    bio,
    website,
    first_name,
    last_name,
    birth_date
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'organization',
    'Technical University of Munich',
    'Munich, Germany',
    'Leading technical university in Germany, offering world-class education in engineering, technology, and innovation.',
    'https://www.tum.de',
    'Technical',
    'University',
    '1990-01-01'::date
) ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- Insert Student Theater Group
INSERT INTO profiles (
    id,
    user_type,
    organization_name,
    location,
    bio,
    website,
    first_name,
    last_name,
    birth_date
) VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'organization',
    'Student Theater Group',
    'Munich, Germany',
    'Dynamic student theater company creating innovative performances and fostering artistic talent among young people.',
    'https://student-theater-munich.de',
    'Student',
    'Theater',
    '1990-01-01'::date
) ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- Insert Youth Impact NGO
INSERT INTO profiles (
    id,
    user_type,
    organization_name,
    location,
    bio,
    website,
    first_name,
    last_name,
    birth_date
) VALUES (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'organization',
    'Youth Impact NGO',
    'Munich, Germany',
    'Non-profit organization dedicated to empowering young people and creating positive social change in communities.',
    'https://youth-impact.org',
    'Youth',
    'Impact',
    '1990-01-01'::date
) ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- Update events to link to these organization profiles
UPDATE events 
SET organization_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE organization_name = 'Technical University of Munich';

UPDATE events 
SET organization_id = '22222222-2222-2222-2222-222222222222'::uuid
WHERE organization_name = 'Student Theater Group';

UPDATE events 
SET organization_id = '33333333-3333-3333-3333-333333333333'::uuid
WHERE organization_name = 'Youth Impact NGO';

-- Verify the results
SELECT 
    organization_name,
    user_type,
    location,
    bio
FROM profiles 
WHERE user_type = 'organization'
ORDER BY organization_name;

SELECT 'Sample organizations inserted successfully!' as status;
