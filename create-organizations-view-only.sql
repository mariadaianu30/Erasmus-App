-- Create Organizations View Only (Simple Version)
-- This creates just the organization view without modifying the events table
-- Use this if you want to keep the events table unchanged

-- Step 1: Create organization view from existing events data
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

-- Step 2: Test the view
SELECT * FROM organization_view;

SELECT 'Organization view created successfully!' as status;


