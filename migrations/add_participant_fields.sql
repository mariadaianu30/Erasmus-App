-- Migration: Add new fields to profiles table for participants
-- This migration adds all the required participant-specific fields

-- Add new columns to profiles table for participants
ALTER TABLE profiles
  -- Basic participant info (some already exist, but ensuring they're there)
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS birthdate DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('female', 'male', 'undefined')),
  
  -- Location and citizenship
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS citizenships TEXT[], -- Array to support multiple citizenships
  ADD COLUMN IF NOT EXISTS residency_country TEXT,
  
  -- Role in project
  ADD COLUMN IF NOT EXISTS role_in_project TEXT CHECK (role_in_project IN (
    'participant',
    'group leader',
    'trainer or facilitator'
  )),
  
  -- Participant with fewer opportunities
  ADD COLUMN IF NOT EXISTS has_fewer_opportunities BOOLEAN DEFAULT false,
  
  -- Fewer opportunities categories (stored as JSONB to allow multiple selections)
  ADD COLUMN IF NOT EXISTS fewer_opportunities_categories JSONB DEFAULT '[]'::jsonb,
  
  -- Languages (stored as JSONB array with language and level)
  -- Format: [{"language": "English", "level": "B2"}, {"language": "Spanish", "level": "A1"}]
  ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
  
  -- Target group for participant (stored as JSONB array to allow multiple selections)
  ADD COLUMN IF NOT EXISTS participant_target_groups JSONB DEFAULT '[]'::jsonb;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_nationality ON profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_profiles_residency_country ON profiles(residency_country);
CREATE INDEX IF NOT EXISTS idx_profiles_role_in_project ON profiles(role_in_project);
CREATE INDEX IF NOT EXISTS idx_profiles_has_fewer_opportunities ON profiles(has_fewer_opportunities);

-- Add comment to document the table
COMMENT ON TABLE profiles IS 'User profiles including participants and organizations. Participants have additional fields for Erasmus+ applications.';

