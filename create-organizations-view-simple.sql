-- Create Organizations View (Simple Approach)
-- This creates a view that combines sample organizations with any existing organization profiles

-- Create or replace the organization view
CREATE OR REPLACE VIEW organization_view AS
-- Get organizations from profiles table (if any exist)
SELECT 
    id,
    organization_name,
    website as organization_website,
    location,
    bio,
    first_name,
    last_name,
    'profile' as source
FROM profiles 
WHERE user_type = 'organization'

UNION ALL

-- Add sample organizations (these will always appear)
SELECT 
    '11111111-1111-1111-1111-111111111111'::uuid as id,
    'Technical University of Munich' as organization_name,
    'https://www.tum.de' as organization_website,
    'Munich, Germany' as location,
    'Leading technical university in Germany, offering world-class education in engineering, technology, and innovation.' as bio,
    'Technical' as first_name,
    'University' as last_name,
    'sample' as source

UNION ALL

SELECT 
    '22222222-2222-2222-2222-222222222222'::uuid as id,
    'Student Theater Group' as organization_name,
    'https://student-theater-munich.de' as organization_website,
    'Munich, Germany' as location,
    'Dynamic student theater company creating innovative performances and fostering artistic talent among young people.' as bio,
    'Student' as first_name,
    'Theater' as last_name,
    'sample' as source

UNION ALL

SELECT 
    '33333333-3333-3333-3333-333333333333'::uuid as id,
    'Youth Impact NGO' as organization_name,
    'https://youth-impact.org' as organization_website,
    'Munich, Germany' as location,
    'Non-profit organization dedicated to empowering young people and creating positive social change in communities.' as bio,
    'Youth' as first_name,
    'Impact' as last_name,
    'sample' as source;

-- Test the view
SELECT * FROM organization_view ORDER BY organization_name;

SELECT 'Organizations view created successfully!' as status;
