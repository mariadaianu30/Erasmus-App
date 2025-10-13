-- =====================================================
-- ERASMUS+ CONNECT - COMPLETE DATABASE SETUP
-- =====================================================
-- This is the ONLY SQL file you need to set up the database
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create custom types
CREATE TYPE user_type AS ENUM ('participant', 'organization');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Step 3: Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_type user_type NOT NULL,
    
    -- Common fields
    first_name TEXT,
    last_name TEXT,
    bio TEXT,
    location TEXT,
    
    -- Participant-specific fields
    birth_date DATE CHECK (birth_date <= CURRENT_DATE AND birth_date >= CURRENT_DATE - INTERVAL '120 years'),
    
    -- Organization-specific fields
    organization_name TEXT,
    website TEXT,
    
    -- Constraints
    CONSTRAINT profiles_participant_check CHECK (
        (user_type = 'participant' AND birth_date IS NOT NULL) OR 
        (user_type = 'organization' AND organization_name IS NOT NULL)
    ),
    
    CONSTRAINT profiles_name_check CHECK (
        (user_type = 'participant' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
        (user_type = 'organization' AND organization_name IS NOT NULL)
    )
);

-- Step 4: Create events table (with nullable organization_id)
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 200),
    description TEXT NOT NULL CHECK (LENGTH(description) >= 10 AND LENGTH(description) <= 2000),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL CHECK (LENGTH(location) >= 3 AND LENGTH(location) <= 200),
    max_participants INTEGER NOT NULL CHECK (max_participants > 0 AND max_participants <= 1000),
    category TEXT NOT NULL CHECK (LENGTH(category) >= 2 AND LENGTH(category) <= 50),
    organization_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Made nullable
    is_published BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT events_date_check CHECK (end_date > start_date),
    CONSTRAINT events_future_check CHECK (start_date > NOW())
);

-- Step 5: Create applications table
CREATE TABLE applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    motivation_letter TEXT NOT NULL CHECK (LENGTH(motivation_letter) >= 200 AND LENGTH(motivation_letter) <= 2000),
    status application_status DEFAULT 'pending',
    
    -- Ensure one application per participant per event
    UNIQUE(event_id, participant_id)
);

-- Step 6: Create indexes for performance
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_organization_name ON profiles(organization_name) WHERE user_type = 'organization';
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_birth_date ON profiles(birth_date);

CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_end_date ON events(end_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_is_published ON events(is_published);
CREATE INDEX idx_events_date_range ON events(start_date, end_date);

CREATE INDEX idx_applications_event_id ON applications(event_id);
CREATE INDEX idx_applications_participant_id ON applications(participant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);

-- Step 7: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 10: RLS Policies for profiles table
-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 11: RLS Policies for events table
-- Everyone can view published events
CREATE POLICY "Published events are viewable by everyone" ON events
    FOR SELECT USING (is_published = true);

-- Organizations can view their own events (published or not)
CREATE POLICY "Organizations can view own events" ON events
    FOR SELECT USING (
        auth.uid() = organization_id
    );

-- Organizations can insert their own events
CREATE POLICY "Organizations can insert own events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() = organization_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'organization'
        )
    );

-- Organizations can update their own events
CREATE POLICY "Organizations can update own events" ON events
    FOR UPDATE USING (
        auth.uid() = organization_id
    );

-- Organizations can delete their own events
CREATE POLICY "Organizations can delete own events" ON events
    FOR DELETE USING (
        auth.uid() = organization_id
    );

-- Step 12: RLS Policies for applications table
-- Participants can view their own applications
CREATE POLICY "Participants can view own applications" ON applications
    FOR SELECT USING (auth.uid() = participant_id);

-- Organizations can view applications to their events
CREATE POLICY "Organizations can view applications to their events" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id AND organization_id = auth.uid()
        )
    );

-- Participants can insert applications to events
CREATE POLICY "Participants can apply to events" ON applications
    FOR INSERT WITH CHECK (
        auth.uid() = participant_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'participant'
        ) AND
        EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id AND is_published = true
        )
    );

-- Organizations can update application status for their events
CREATE POLICY "Organizations can update application status" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id AND organization_id = auth.uid()
        )
    );

-- Step 13: Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, user_type, first_name, last_name, birth_date)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'participant')::user_type,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        COALESCE(
            (NEW.raw_user_meta_data->>'birth_date')::date,
            CURRENT_DATE - INTERVAL '18 years'
        )
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 15: Create utility functions for statistics
CREATE OR REPLACE FUNCTION get_event_stats(event_uuid UUID)
RETURNS TABLE (
    total_applications BIGINT,
    pending_applications BIGINT,
    accepted_applications BIGINT,
    rejected_applications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_applications,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applications
    FROM applications
    WHERE event_id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_application_stats(user_uuid UUID)
RETURNS TABLE (
    total_applications BIGINT,
    pending_applications BIGINT,
    accepted_applications BIGINT,
    rejected_applications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_applications,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applications
    FROM applications
    WHERE participant_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 16: Insert sample events data
INSERT INTO events (
    id,
    title,
    description,
    start_date,
    end_date,
    location,
    max_participants,
    category,
    organization_id,
    is_published,
    created_at,
    updated_at
) VALUES 
-- Sample Events with Future Dates (2026)
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'AI & Machine Learning Workshop for Beginners',
    'Join us for an intensive 3-day workshop on Artificial Intelligence and Machine Learning fundamentals. This hands-on program is designed for students and young professionals who want to dive into the world of AI.',
    '2026-03-15 09:00:00+00'::timestamptz,
    '2026-03-17 17:00:00+00'::timestamptz,
    'Technical University of Munich, Munich, Germany',
    50,
    'Technology',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-1111-1111-111111111112'::uuid,
    'Sustainable Engineering Conference',
    'Explore the latest innovations in sustainable engineering and green technology. This conference brings together industry leaders, researchers, and students.',
    '2026-04-20 08:30:00+00'::timestamptz,
    '2026-04-22 16:30:00+00'::timestamptz,
    'TUM Campus Garching, Garching, Germany',
    200,
    'Engineering',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '11111111-1111-1111-1111-111111111113'::uuid,
    'Student Entrepreneurship Bootcamp',
    'Learn how to turn your innovative ideas into successful startups. This intensive bootcamp covers business planning, funding, marketing, and leadership skills.',
    '2026-05-10 09:00:00+00'::timestamptz,
    '2026-05-12 17:00:00+00'::timestamptz,
    'Entrepreneurship Center, Munich, Germany',
    30,
    'Business',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '22222222-2222-2222-2222-222222222221'::uuid,
    'Romeo and Juliet - Student Theater Production',
    'Join our student theater group for a modern adaptation of Shakespeare\'s classic Romeo and Juliet. Open to all students interested in acting, directing, or stage management.',
    '2026-06-15 19:30:00+00'::timestamptz,
    '2026-06-15 22:00:00+00'::timestamptz,
    'Student Theater, University Campus, Munich, Germany',
    100,
    'Arts',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Theater Workshop: Acting Techniques',
    'Develop your acting skills with professional techniques and improvisation exercises. Perfect for beginners and intermediate actors.',
    '2026-07-20 10:00:00+00'::timestamptz,
    '2026-07-22 16:00:00+00'::timestamptz,
    'Drama Studio, Arts Building, Munich, Germany',
    25,
    'Arts',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '22222222-2222-2222-2222-222222222223'::uuid,
    'Student Film Festival',
    'Showcase your creative film projects and network with fellow student filmmakers. Includes workshops on cinematography, editing, and storytelling.',
    '2026-08-25 18:00:00+00'::timestamptz,
    '2026-08-27 20:00:00+00'::timestamptz,
    'Cinema Hall, University Campus, Munich, Germany',
    150,
    'Arts',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '33333333-3333-3333-3333-333333333331'::uuid,
    'Community Garden Initiative',
    'Join our environmental NGO in creating sustainable community gardens. Learn about urban farming, composting, and environmental conservation.',
    '2026-09-10 09:00:00+00'::timestamptz,
    '2026-09-10 17:00:00+00'::timestamptz,
    'Community Center, Munich, Germany',
    40,
    'Environment',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '33333333-3333-3333-3333-333333333332'::uuid,
    'Youth Leadership Summit',
    'Empower yourself with leadership skills and social responsibility. Connect with like-minded young leaders and learn about social impact.',
    '2026-10-15 08:00:00+00'::timestamptz,
    '2026-10-17 18:00:00+00'::timestamptz,
    'Youth Center, Munich, Germany',
    80,
    'Social Impact',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Digital Literacy for Seniors',
    'Help bridge the digital divide by teaching basic computer skills to senior citizens. A rewarding volunteer opportunity to make a difference.',
    '2026-11-20 14:00:00+00'::timestamptz,
    '2026-11-20 17:00:00+00'::timestamptz,
    'Senior Center, Munich, Germany',
    20,
    'Social Impact',
    NULL,
    true,
    NOW(),
    NOW()
);

-- Step 17: Add comment to organization_id column
COMMENT ON COLUMN events.organization_id IS 'Can be NULL initially. Will be populated when organizations are created through the app.';

-- Step 18: Success message
SELECT 'Erasmus+ Connect database setup completed successfully!' as status;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your database is now ready with:
-- ✅ All tables created (profiles, events, applications)
-- ✅ RLS policies configured for security
-- ✅ Triggers for user profile creation
-- ✅ 9 sample events with future dates
-- ✅ All necessary indexes for performance
-- ✅ Utility functions for statistics
-- =====================================================
-- Next steps:
-- 1. Disable email confirmation in Supabase Auth settings
-- 2. Start your Next.js application
-- 3. Register users through the app
-- 4. Create organization accounts to link with events
-- =====================================================

