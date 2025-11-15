-- Migration: Create projects table for organization partnerships
-- This table stores partnership opportunities between organizations

-- Step 1: Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Basic information
  project_title TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT,
  
  -- Partner search details
  searching_partners_countries TEXT[] NOT NULL DEFAULT '{}', -- Array of countries
  begin_date DATE,
  end_date DATE,
  deadline_for_partner_request DATE,
  number_of_partners_needed INTEGER DEFAULT 1,
  
  -- Descriptions
  short_description TEXT,
  full_description TEXT,
  
  -- Project type and tags
  project_type TEXT, -- What type of projects do you want to do
  tags TEXT[] DEFAULT '{}', -- Array of tags
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true
);

-- Step 2: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline_for_partner_request);

-- Step 4: Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Allow organizations to create their own projects
CREATE POLICY "Allow organizations to create projects" ON projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = organization_id
    );

-- Allow public to read published projects
CREATE POLICY "Allow public to read published projects" ON projects
    FOR SELECT
    TO public
    USING (
        is_published = true AND is_active = true
    );

-- Allow organizations to read their own projects
CREATE POLICY "Allow organizations to read their own projects" ON projects
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Allow organizations to update their own projects
CREATE POLICY "Allow organizations to update their projects" ON projects
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = organization_id
    )
    WITH CHECK (
        auth.uid() = organization_id
    );

-- Allow organizations to delete their own projects
CREATE POLICY "Allow organizations to delete their projects" ON projects
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = organization_id
    );

-- Step 6: Grant permissions
GRANT ALL ON projects TO authenticated;
GRANT SELECT ON projects TO anon;

-- Step 7: Add comment
COMMENT ON TABLE projects IS 'Partnership opportunities posted by organizations';

-- Success message
SELECT '✅ Projects table created successfully!' as result;

