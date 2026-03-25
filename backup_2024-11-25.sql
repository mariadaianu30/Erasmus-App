-- ============================================
-- ERASMUS+ CONNECT DATABASE BACKUP
-- Date: November 25, 2024
-- ============================================
-- This file contains the complete database schema for the Erasmus+ Connect platform.
-- Use this file to restore your database if it breaks or needs to be recreated.
-- 
-- IMPORTANT: This backup includes schema definitions only, not actual data.
-- To restore data, you'll need to export/import data separately.
-- ============================================

-- ============================================
-- STEP 1: Create Custom Types/Enums
-- ============================================

-- User type enum
CREATE TYPE user_type AS ENUM ('participant', 'organization');

-- Application status enum
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Gender enum
CREATE TYPE gender_type AS ENUM ('female', 'male', 'undefined');

-- Role in project enum
CREATE TYPE role_in_project_type AS ENUM ('participant', 'group leader', 'trainer or facilitator');

-- Event type enum
CREATE TYPE event_type_enum AS ENUM (
  'Youth exchange',
  'Training Course',
  'Seminar',
  'Study visit',
  'Partnership - Building Activity',
  'Conference simpozion forum',
  'E-learning',
  'Other'
);

-- ============================================
-- STEP 2: Create Tables
-- ============================================

-- Note: If restoring to an existing database, run this first:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Profiles table (stores both participants and organizations)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_type user_type NOT NULL,
  
  -- Common fields
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  bio TEXT,
  location TEXT,
  organization_name TEXT,
  website TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Participant-specific fields
  birthdate DATE,
  gender gender_type,
  nationality TEXT,
  citizenships TEXT[],
  residency_country TEXT,
  role_in_project role_in_project_type,
  has_fewer_opportunities BOOLEAN DEFAULT FALSE,
  fewer_opportunities_categories JSONB,
  languages JSONB, -- Array format: [{"language": "English", "level": "B2"}]
  participant_target_groups JSONB
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Required fields
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER NOT NULL,
  category TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT TRUE,
  
  -- Erasmus+ specific fields
  event_type event_type_enum,
  venue_place TEXT,
  city TEXT,
  country TEXT,
  short_description TEXT,
  full_description TEXT,
  photo_url TEXT,
  is_funded BOOLEAN,
  target_groups JSONB, -- Array of target group strings
  group_size INTEGER,
  working_language TEXT,
  participation_fee DECIMAL(10, 2),
  participation_fee_reason TEXT,
  accommodation_food_details TEXT,
  transport_details TEXT
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  motivation_letter TEXT NOT NULL,
  status application_status DEFAULT 'pending',
  
  -- Ensure one application per participant per event
  UNIQUE(event_id, participant_id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  project_title TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name TEXT,
  project_email TEXT, -- Email for project-related inquiries (defaults to organization email)
  searching_partners_countries TEXT[] NOT NULL DEFAULT '{}',
  begin_date DATE,
  end_date DATE,
  deadline_for_partner_request DATE,
  number_of_partners_needed INTEGER NOT NULL DEFAULT 1,
  short_description TEXT,
  full_description TEXT,
  project_type TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT TRUE
);

-- ============================================
-- STEP 3: Create Indexes
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_name ON profiles(organization_name) WHERE user_type = 'organization';

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_event_id ON applications(event_id);
CREATE INDEX IF NOT EXISTS idx_applications_participant_id ON applications(participant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);

-- ============================================
-- STEP 4: Create Views
-- ============================================

-- Organization view (without hardcoded sample data)
CREATE OR REPLACE VIEW organization_view AS
SELECT 
  profiles.id,
  profiles.organization_name,
  profiles.website AS organization_website,
  profiles.location,
  profiles.bio,
  profiles.first_name,
  profiles.last_name,
  'profile'::text AS source,
  COALESCE(profiles.is_verified, false) AS is_verified
FROM profiles
WHERE (profiles.user_type = 'organization'::user_type);

-- ============================================
-- STEP 5: Create Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Create Triggers
-- ============================================

-- Trigger to auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on applications
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: Row Level Security (RLS) Policies
-- ============================================
-- NOTE: These are example policies. Adjust based on your actual security requirements.

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can view published organization profiles
CREATE POLICY "Anyone can view organization profiles"
  ON profiles FOR SELECT
  USING (user_type = 'organization');

-- Events policies
-- Anyone can view published events
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (is_published = true);

-- Organizations can create events
CREATE POLICY "Organizations can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'organization'
    )
  );

-- Organizations can update their own events
CREATE POLICY "Organizations can update own events"
  ON events FOR UPDATE
  USING (
    organization_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'organization'
    )
  );

-- Organizations can delete their own events
CREATE POLICY "Organizations can delete own events"
  ON events FOR DELETE
  USING (
    organization_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'organization'
    )
  );

-- Applications policies
-- Participants can create applications
CREATE POLICY "Participants can create applications"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'participant'
    )
    AND participant_id = auth.uid()
  );

-- Participants can view their own applications
CREATE POLICY "Participants can view own applications"
  ON applications FOR SELECT
  USING (participant_id = auth.uid());

-- Organizations can view applications for their events
CREATE POLICY "Organizations can view applications for their events"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = applications.event_id
      AND events.organization_id = auth.uid()
    )
  );

-- Organizations can update applications for their events
CREATE POLICY "Organizations can update applications for their events"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = applications.event_id
      AND events.organization_id = auth.uid()
    )
  );

-- Projects policies
-- Anyone can view published projects
CREATE POLICY "Anyone can view published projects"
  ON projects FOR SELECT
  USING (is_published = true);

-- Organizations can create projects
CREATE POLICY "Organizations can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'organization'
    )
    AND organization_id = auth.uid()
  );

-- Organizations can update their own projects
CREATE POLICY "Organizations can update own projects"
  ON projects FOR UPDATE
  USING (
    organization_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'organization'
    )
  );

-- Organizations can delete their own projects
CREATE POLICY "Organizations can delete own projects"
  ON projects FOR DELETE
  USING (
    organization_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'organization'
    )
  );

-- ============================================
-- STEP 8: Storage Buckets (if using Supabase Storage)
-- ============================================
-- Note: Storage buckets are created via Supabase Dashboard or API
-- Example bucket creation (run in Supabase Dashboard > Storage):
-- 
-- Bucket: event-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/jpg

-- ============================================
-- STEP 9: Organization Verification
-- ============================================
-- To verify an organization (admin only):
-- 
-- 1. Find the organization:
--    SELECT id, organization_name, email FROM profiles WHERE user_type = 'organization';
--
-- 2. Verify by ID:
--    UPDATE profiles
--    SET is_verified = TRUE
--    WHERE id = 'ORGANIZATION-UUID-HERE' AND user_type = 'organization';
--
-- 3. Verify by name:
--    UPDATE profiles
--    SET is_verified = TRUE
--    WHERE organization_name = 'Organization Name' AND user_type = 'organization';
--
-- 4. Unverify (if needed):
--    UPDATE profiles
--    SET is_verified = FALSE
--    WHERE id = 'ORGANIZATION-UUID-HERE' AND user_type = 'organization';

-- ============================================
-- RESTORATION INSTRUCTIONS
-- ============================================
-- To restore this database:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Run this entire script
-- 3. Verify tables, views, and policies were created
-- 4. Import your data if you have backups
-- 5. Test the application to ensure everything works
-- 
-- If you encounter errors:
-- - Check if types/enums already exist (DROP TYPE IF EXISTS ...)
-- - Check if tables already exist (DROP TABLE IF EXISTS ... CASCADE)
-- - Ensure you have proper permissions
-- ============================================

