# 🚨 URGENT: Fix Event Creation Timeout

## The Problem
Your event creation is timing out because **RLS policies are missing**. The database is blocking the insert.

## The Solution (2 minutes)

### Step 1: Open Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run This Script
1. Click **"New query"**
2. Copy the **ENTIRE** contents of `FIX_RLS_POLICIES.sql`
3. Paste into SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. You should see: **"RLS policies set up successfully!"**

### Step 3: Verify
1. Run `VERIFY_SETUP.sql` in SQL Editor
2. Check that you see: **"✅ INSERT policy exists"**

### Step 4: Test
1. **Refresh your browser** (Ctrl+Shift+R)
2. **Log out and log back in** as an organization
3. Try creating an event

---

## If You Still Get Timeout

Check the browser console. You should now see a clear error message after 30 seconds that says:
**"TIMEOUT: Database request took longer than 30 seconds. This means RLS policies are not set up. Please run FIX_RLS_POLICIES.sql in Supabase SQL Editor."**

This confirms it's an RLS issue. Make sure you:
1. ✅ Ran `FIX_RLS_POLICIES.sql` completely
2. ✅ Saw the success message
3. ✅ Verified with `VERIFY_SETUP.sql` that INSERT policy exists
4. ✅ Refreshed browser and logged back in

---

## Still Not Working?

Check the Network tab in browser DevTools:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try creating an event
4. Look for the request to `/rest/v1/events`
5. Check the status code:
   - **403** = RLS blocking (run FIX_RLS_POLICIES.sql)
   - **401** = Not logged in (log in as organization)
   - **Pending** = Request hanging (RLS issue)

