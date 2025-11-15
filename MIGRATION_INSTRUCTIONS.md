# Database Migration Instructions

## ⚠️ IMPORTANT: Read SUPABASE_SETUP_EVENTS.md First!

**Before creating events, you MUST:**
1. Run the event fields migration (see below)
2. Set up RLS policies for the events table (see `SUPABASE_SETUP_EVENTS.md`)

Without these steps, event creation will fail or hang!

## How to Run Migrations in Supabase

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"** to create a new SQL query

### Step 2: Run the Event Fields Migration

1. Copy the entire contents of `migrations/add_event_fields.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
4. You should see a success message

### Step 3: Run the Participant Fields Migration

1. Copy the entire contents of `migrations/add_participant_fields.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
4. You should see a success message

### Step 4: Verify the Migrations

You can verify the migrations worked by running this query:

```sql
-- Check events table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Check profiles table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

## What These Migrations Do

### Events Table (`add_event_fields.sql`)
Adds the following fields:
- `event_type` - Type of event (Youth exchange, Training Course, etc.)
- `venue_place`, `city`, `country` - Location details
- `short_description`, `full_description` - Descriptions
- `photo_url` - Event photo
- `is_funded` - Whether the event is funded
- `target_groups` - JSONB array of target groups
- `group_size` - Group size
- `working_language` - Working language
- `participation_fee`, `participation_fee_reason` - Fee information
- `accommodation_food_details` - Accommodation details
- `transport_details` - Transport information

### Profiles Table (`add_participant_fields.sql`)
Adds the following fields for participants:
- `email` - Email address
- `birthdate` - Birth date
- `gender` - Gender (female/male/undefined)
- `nationality` - Nationality
- `citizenships` - Array of citizenships
- `residency_country` - Country of residence
- `role_in_project` - Role (participant/group leader/trainer + facilitator)
- `has_fewer_opportunities` - Boolean flag
- `fewer_opportunities_categories` - JSONB array of categories
- `languages` - JSONB array of languages with levels
- `participant_target_groups` - JSONB array of target groups

## Notes

- All new fields are **optional** (nullable), so existing data will continue to work
- The migrations use `IF NOT EXISTS` so they're safe to run multiple times
- Indexes are created for better query performance
- The `group_size` field is automatically populated from `max_participants` for existing events

## Troubleshooting

If you encounter any errors:

1. **Permission errors**: Make sure you're using the correct database role (usually `postgres` or `authenticator`)
2. **Column already exists**: This is fine - the `IF NOT EXISTS` clause handles this
3. **Check constraint errors**: Make sure the values match the allowed options in the CHECK constraints

## Alternative: Using Supabase CLI

If you prefer using the CLI:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

But the SQL Editor method is simpler for one-time migrations.

