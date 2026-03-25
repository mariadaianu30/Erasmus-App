-- Migration: Add project_email column to projects table
-- Run this in Supabase SQL Editor to add the project_email field

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_email TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN projects.project_email IS 'Email for project-related inquiries (defaults to organization email)';

