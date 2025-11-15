-- Migration: Add new fields to events table
-- This migration adds all the required fields for Erasmus+ events

-- Step 1: Temporarily drop the events_future_check constraint if it exists
-- This allows us to add columns even if there's existing data with past dates
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'events_future_check' 
        AND conrelid = 'events'::regclass
    ) THEN
        ALTER TABLE events DROP CONSTRAINT events_future_check;
    END IF;
END $$;

-- Step 2: Add new columns to events table
ALTER TABLE events
  -- Event type (enum-like, stored as text)
  ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN (
    'Youth exchange',
    'Training Course',
    'Seminar',
    'Study visit',
    'Partnership - Building Activity',
    'Conference simpozion forum',
    'E-learning',
    'Other'
  )),
  
  -- Venue place - city (separate from location)
  ADD COLUMN IF NOT EXISTS venue_place TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  
  -- Country
  ADD COLUMN IF NOT EXISTS country TEXT,
  
  -- Descriptions
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  
  -- Photo (URL or path)
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  
  -- Funded (Yes/No)
  ADD COLUMN IF NOT EXISTS is_funded BOOLEAN DEFAULT false,
  
  -- Target groups (stored as JSONB array to allow multiple selections)
  ADD COLUMN IF NOT EXISTS target_groups JSONB DEFAULT '[]'::jsonb,
  
  -- Group Size (renamed from max_participants, but keeping both for backward compatibility)
  ADD COLUMN IF NOT EXISTS group_size INTEGER,
  
  -- Working language
  ADD COLUMN IF NOT EXISTS working_language TEXT,
  
  -- Participation fee
  ADD COLUMN IF NOT EXISTS participation_fee DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS participation_fee_reason TEXT,
  
  -- Accommodation and food details
  ADD COLUMN IF NOT EXISTS accommodation_food_details TEXT,
  
  -- Transport details
  ADD COLUMN IF NOT EXISTS transport_details TEXT;

-- Update group_size to match max_participants for existing records
UPDATE events
SET group_size = max_participants
WHERE group_size IS NULL AND max_participants IS NOT NULL;

-- Create index on event_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Create index on country for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);

-- Add comment to document the table
COMMENT ON TABLE events IS 'Erasmus+ events with comprehensive details including type, location, funding, target groups, and logistics';

-- Step 3: Recreate the events_future_check constraint (optional - only if you want to enforce future dates)
-- This constraint is recreated to only apply to published events, allowing past events to exist
-- Uncomment the following lines if you want to re-enable this constraint:
/*
ALTER TABLE events
ADD CONSTRAINT events_future_check 
CHECK (
    NOT is_published OR start_date >= NOW()
);
*/

