-- Add cv_url column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Create storage bucket for CVs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the cvs bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'cvs');

CREATE POLICY "Authenticated users can upload CVs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'cvs' AND auth.role() = 'authenticated');
