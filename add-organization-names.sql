-- Add Organization Names to Events (Simplest Solution)
-- This script adds organization information directly to events without creating profiles

-- Step 1: Add organization_name column to events table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'organization_name') THEN
        ALTER TABLE events ADD COLUMN organization_name TEXT;
    END IF;
END $$;

-- Step 2: Add organization_website column to events table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'organization_website') THEN
        ALTER TABLE events ADD COLUMN organization_website TEXT;
    END IF;
END $$;

-- Step 3: Update events with organization information
-- Technology events -> Technical University of Munich
UPDATE events 
SET 
    organization_name = 'Technical University of Munich',
    organization_website = 'https://www.tum.de'
WHERE id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,  -- AI & Machine Learning Workshop
    '11111111-1111-1111-1111-111111111112'::uuid,  -- Sustainable Engineering Conference
    '11111111-1111-1111-1111-111111111113'::uuid   -- Student Entrepreneurship Bootcamp
);

-- Arts events -> Student Theater Group
UPDATE events 
SET 
    organization_name = 'Student Theater Group',
    organization_website = 'https://student-theater-munich.de'
WHERE id IN (
    '22222222-2222-2222-2222-222222222221'::uuid,  -- Romeo and Juliet
    '22222222-2222-2222-2222-222222222222'::uuid,  -- Theater Workshop
    '22222222-2222-2222-2222-222222222223'::uuid   -- Student Film Festival
);

-- Social Impact events -> Youth Impact NGO
UPDATE events 
SET 
    organization_name = 'Youth Impact NGO',
    organization_website = 'https://youth-impact.org'
WHERE id IN (
    '33333333-3333-3333-3333-333333333331'::uuid,  -- Community Garden Initiative
    '33333333-3333-3333-3333-333333333332'::uuid,  -- Youth Leadership Summit
    '33333333-3333-3333-3333-333333333333'::uuid   -- Digital Literacy for Seniors
);

-- Step 4: Create a view for organizations (so organizations page works)
CREATE OR REPLACE VIEW organization_view AS
SELECT DISTINCT
    organization_name,
    organization_website,
    'Munich, Germany' as location,
    CASE 
        WHEN organization_name = 'Technical University of Munich' THEN 'Leading technical university in Germany, offering world-class education in engineering, technology, and innovation.'
        WHEN organization_name = 'Student Theater Group' THEN 'Dynamic student theater company creating innovative performances and fostering artistic talent among young people.'
        WHEN organization_name = 'Youth Impact NGO' THEN 'Non-profit organization dedicated to empowering young people and creating positive social change in communities.'
        ELSE 'Organization description'
    END as bio
FROM events 
WHERE organization_name IS NOT NULL;

-- Step 5: Verify the results
SELECT 
    title,
    category,
    organization_name,
    organization_website
FROM events 
WHERE organization_name IS NOT NULL
ORDER BY category, title;

SELECT 'Organization names added to events successfully!' as status;
