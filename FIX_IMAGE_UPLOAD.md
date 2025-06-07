# Fix Image Upload Issues

To fix the image upload functionality, you need to:

1. **Add the missing image_url column to the events table**
2. **Create the event-images storage bucket**

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Add image_url column
1. Go to your Supabase dashboard
2. Navigate to Table Editor → events table
3. Click "Add column"
4. Set:
   - Name: `image_url`
   - Type: `text`
   - Click Save

### Step 2: Create storage bucket
1. Go to Storage in your Supabase dashboard
2. Click "Create bucket"
3. Set:
   - Name: `event-images`
   - Public: ✅ (check this)
   - Click Create

## Option 2: Using SQL

Run this SQL in your Supabase SQL editor:

```sql
-- Add image_url column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket (run in SQL editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;
```

## Option 3: Quick Fix (if you can't modify the database)

If you can't add the column right now, you can temporarily remove image_url from the event creation:

1. Comment out the image_url line in EventCreate.jsx (around line 145)
2. This will allow events to be created without images

## Verify Everything Works

After applying the fixes:
1. Try creating a new event with an image
2. The image should upload successfully
3. The event should be created with the image URL stored

The EventCreate component has already been updated to use the correct storage bucket name.