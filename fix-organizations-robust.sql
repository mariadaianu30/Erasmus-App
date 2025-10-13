-- Fix Organizations - Robust Version
-- This script works regardless of actual event IDs in your database

-- Step 1: Add organization columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'organization_name') THEN
        ALTER TABLE events ADD COLUMN organization_name TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'organization_website') THEN
        ALTER TABLE events ADD COLUMN organization_website TEXT;
    END IF;
END $$;

-- Step 2: Update events by category (more reliable than UUIDs)
-- Technology events -> Technical University of Munich
UPDATE events 
SET 
    organization_name = 'Technical University of Munich',
    organization_website = 'https://www.tum.de'
WHERE category = 'Technology' 
AND organization_name IS NULL;

-- Arts/Culture events -> Student Theater Group  
UPDATE events 
SET 
    organization_name = 'Student Theater Group',
    organization_website = 'https://student-theater-munich.de'
WHERE category IN ('Arts', 'Culture', 'Entertainment') 
AND organization_name IS NULL;

-- Social Impact events -> Youth Impact NGO
UPDATE events 
SET 
    organization_name = 'Youth Impact NGO',
    organization_website = 'https://youth-impact.org'
WHERE category IN ('Social Impact', 'Community', 'Education', 'Volunteering') 
AND organization_name IS NULL;

-- Step 3: If any events still don't have organization names, assign them
-- Get the first few events and assign them to organizations
UPDATE events 
SET 
    organization_name = 'Technical University of Munich',
    organization_website = 'https://www.tum.de'
WHERE organization_name IS NULL
AND id IN (
    SELECT id FROM events 
    WHERE organization_name IS NULL 
    ORDER BY created_at ASC 
    LIMIT 3
);

UPDATE events 
SET 
    organization_name = 'Student Theater Group',
    organization_website = 'https://student-theater-munich.de'
WHERE organization_name IS NULL
AND id IN (
    SELECT id FROM events 
    WHERE organization_name IS NULL 
    ORDER BY created_at ASC 
    LIMIT 3
);

UPDATE events 
SET 
    organization_name = 'Youth Impact NGO',
    organization_website = 'https://youth-impact.org'
WHERE organization_name IS NULL
AND id IN (
    SELECT id FROM events 
    WHERE organization_name IS NULL 
    ORDER BY created_at ASC 
    LIMIT 3
);

-- Step 4: Create organization view
CREATE OR REPLACE VIEW organization_view AS
SELECT DISTINCT
    organization_name,
    organization_website,
    'Munich, Germany' as location,
    CASE 
        WHEN organization_name = 'Technical University of Munich' THEN 'Leading technical university in Germany, offering world-class education in engineering, technology, and innovation.'
        WHEN organization_name = 'Student Theater Group' THEN 'Dynamic student theater company creating innovative performances and fostering artistic talent among young people.'
        WHEN organization_name = 'Youth Impact NGO' THEN 'Non-profit organization dedicated to empowering young people and creating positive social change in communities.'
        ELSE 'Organization description not available'
    END as bio
FROM events 
WHERE organization_name IS NOT NULL;

-- Step 5: Verify results
SELECT 
    organization_name,
    COUNT(*) as event_count,
    organization_website
FROM events 
WHERE organization_name IS NOT NULL
GROUP BY organization_name, organization_website
ORDER BY organization_name;

SELECT 'Organizations fixed successfully!' as status;
