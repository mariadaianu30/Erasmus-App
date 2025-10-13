-- Update character limits for events and applications
-- This script removes the 200 character minimum for motivation letters
-- and changes event description minimum from 50 to 20 characters

-- Step 1: Drop existing constraints on events table
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_description_check;

-- Step 2: Create new constraint for events description (minimum 20 characters)
ALTER TABLE events ADD CONSTRAINT events_description_check 
    CHECK (LENGTH(description) >= 20 AND LENGTH(description) <= 2000);

-- Step 3: Drop existing constraints on applications table
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_motivation_letter_check;

-- Step 4: Create new constraint for applications motivation letter (minimum 1 character)
ALTER TABLE applications ADD CONSTRAINT applications_motivation_letter_check 
    CHECK (LENGTH(motivation_letter) >= 1 AND LENGTH(motivation_letter) <= 2000);

-- Step 5: Verify the changes
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name IN ('events_description_check', 'applications_motivation_letter_check');

SELECT 'Character limits updated successfully!' as status;
