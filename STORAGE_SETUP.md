# Supabase Storage Setup for Event Photos

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"Storage"** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `event-photos`
   - **Public bucket**: ✅ Check this (so photos can be accessed publicly)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png`
6. Click **"Create bucket"**

## Step 2: Set Up Storage Policies (RLS)

After creating the bucket, you need to set up Row Level Security policies to allow uploads:

1. In the Storage section, click on the `event-photos` bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

### Policy 1: Allow authenticated users to upload files

- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**:
```sql
( bucket_id = 'event-photos' AND auth.role() = 'authenticated' )
```

### Policy 2: Allow public read access

- **Policy name**: `Allow public reads`
- **Allowed operation**: `SELECT`
- **Policy definition**:
```sql
( bucket_id = 'event-photos' )
```

### Policy 3: Allow users to update/delete their own files

- **Policy name**: `Allow users to manage their own files`
- **Allowed operation**: `UPDATE, DELETE`
- **Policy definition**:
```sql
( bucket_id = 'event-photos' AND auth.uid()::text = (storage.foldername(name))[1] )
```

This policy allows users to update/delete files in folders named with their user ID.

## Step 3: Verify Setup

After setting up the bucket and policies, try uploading a photo when creating an event. The photo should:
- Upload successfully
- Display a preview before submission
- Be accessible via a public URL after the event is created

## Troubleshooting

If you encounter errors:

1. **"Bucket not found"**: Make sure the bucket name is exactly `event-photos` (case-sensitive)
2. **"Permission denied"**: Check that the RLS policies are set up correctly
3. **"File too large"**: Adjust the file size limit in bucket settings or reduce the image size
4. **"Invalid file type"**: Make sure you're uploading JPG or PNG files only

