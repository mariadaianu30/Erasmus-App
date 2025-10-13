-- Test Organization Verification Status
-- This script shows the verification status of all organizations

SELECT 
    organization_name,
    is_verified,
    source,
    CASE 
        WHEN is_verified = true THEN 'VERIFIED (Green Badge)'
        WHEN is_verified = false THEN 'UNVERIFIED (Yellow Badge)'
        ELSE 'UNKNOWN STATUS'
    END as status_display
FROM organization_view 
ORDER BY organization_name;

-- Count verified vs unverified
SELECT 
    COUNT(*) as total_organizations,
    SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_count,
    SUM(CASE WHEN is_verified = false THEN 1 ELSE 0 END) as unverified_count
FROM organization_view;

SELECT 'Organization verification test completed!' as status;
