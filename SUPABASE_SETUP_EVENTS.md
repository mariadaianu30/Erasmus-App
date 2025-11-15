# ⚠️ IMPORTANT: Supabase Setup Required for Event Creation

## You MUST complete these steps before creating events!

### Step 1: Run the Event Fields Migration

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"** to create a new SQL query
5. Copy the **ENTIRE** contents of `migrations/add_event_fields.sql`
6. Paste it into the SQL Editor
7. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
8. You should see a success message: "Success. No rows returned"

**This migration adds all the new event fields to your database.**

---

### Step 2: Set Up Row Level Security (RLS) Policies for Events Table

**This is CRITICAL - without these policies, event creation will fail or hang!**

#### ⚡ QUICK FIX: Use the SQL Script (Recommended)

1. Go to Supabase → **SQL Editor**
2. Open the file `FIX_RLS_POLICIES.sql` in your project
3. Copy the **ENTIRE** contents
4. Paste into SQL Editor
5. Click **"Run"**
6. You should see: "RLS policies set up successfully!"

This will automatically create all 4 required policies.

---

#### Alternative: Manual Setup via UI

If you prefer using the UI:

1. In Supabase, go to **"Table Editor"** → select `events` table → **"Policies"** tab
2. Make sure **Row Level Security (RLS)** is **ENABLED** (toggle should be ON)

**Policy 1: Allow organizations to INSERT (create) events**
- Click **"New Policy"** → **"Create a policy from scratch"**
- **Policy name**: `Allow organizations to create events`
- **Allowed operation**: `INSERT`
- **Policy definition**: `(auth.uid() = organization_id)`
- Click **"Save policy"**

**Policy 2: Allow public to SELECT (read) published events**
- Click **"New Policy"** → **"Create a policy from scratch"**
- **Policy name**: `Allow public to read published events`
- **Allowed operation**: `SELECT`
- **Policy definition**: `(is_published = true)`
- Click **"Save policy"**

**Policy 3: Allow organizations to UPDATE their own events**
- Click **"New Policy"** → **"Create a policy from scratch"**
- **Policy name**: `Allow organizations to update their events`
- **Allowed operation**: `UPDATE`
- **Policy definition**: `(auth.uid() = organization_id)`
- Click **"Save policy"**

**Policy 4: Allow organizations to DELETE their own events**
- Click **"New Policy"** → **"Create a policy from scratch"**
- **Policy name**: `Allow organizations to delete their events`
- **Allowed operation**: `DELETE`
- **Policy definition**: `(auth.uid() = organization_id)`
- Click **"Save policy"**

---

### Step 3: Verify the Setup

**Option 1: Use the Check Script (Easiest)**
1. Open `CHECK_RLS_POLICIES.sql` in your project
2. Copy and run it in Supabase SQL Editor
3. Check the results

**Option 2: Manual Verification**

Run this query in SQL Editor:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('event_type', 'venue_place', 'city', 'country', 'short_description', 'full_description', 'photo_url', 'is_funded', 'target_groups', 'group_size', 'working_language', 'participation_fee', 'participation_fee_reason', 'accommodation_food_details', 'transport_details')
ORDER BY column_name;

-- Check RLS policies
SELECT 
    policyname,
    cmd as operation,
    qual as policy_definition
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY cmd, policyname;
```

**You should see:**
- ✅ All the new columns listed (15 columns)
- ✅ At least 4-5 policies:
  - `Allow organizations to create events` (INSERT)
  - `Allow public to read published events` (SELECT)
  - `Allow organizations to read their own events` (SELECT)
  - `Allow organizations to update their events` (UPDATE)
  - `Allow organizations to delete their events` (DELETE)

---

## ⚠️ Common Issues

### Issue: "Request timed out" or form hangs
**Solution**: 
1. Run `FIX_RLS_POLICIES.sql` in Supabase SQL Editor
2. Run `VERIFY_SETUP.sql` to confirm policies exist
3. Make sure you're logged in as an **organization** (not participant) in your web app
4. Refresh browser and try again

### Issue: "NOT LOGGED IN" message in CHECK_RLS_POLICIES.sql
**This is NORMAL!** SQL Editor runs as anonymous user. Your web app runs as authenticated user, so it will work when you're logged in. Just make sure the INSERT policy exists (check the policy list above).

### Issue: "Permission denied" or "PGRST301"
**Solution**: Make sure you're logged in as an organization (not a participant) and RLS policies allow INSERT

### Issue: "Invalid data" or constraint errors
**Solution**: Make sure the migration ran successfully and all columns exist

### Issue: Event type not in allowed list
**Solution**: Check that the `event_type` value matches one of the allowed values in the CHECK constraint

---

## ✅ After Completing These Steps

1. **Refresh your browser** (or restart the dev server)
2. **Log out and log back in** as an organization
3. Try creating an event again

If you still have issues, check the browser console for specific error messages.

