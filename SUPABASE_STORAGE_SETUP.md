# Supabase Storage Setup for Question Images

This document provides instructions for setting up the Supabase Storage bucket to store question images.

## 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `question-images`
   - **Public bucket**: ✅ Enable (so images can be accessed via public URLs)
   - **File size limit**: 5 MB (optional, can be configured)
   - **Allowed MIME types**: `image/*` (optional, can be configured)
5. Click **Create bucket**

## 2. Set Up Storage Policies (RLS)

Navigate to the **Policies** tab in the Storage section and add the following policies:

### Policy 1: Allow Teachers to Upload Images

```sql
CREATE POLICY "Teachers can upload question images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'question-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM classrooms
    WHERE teacher_id = auth.uid()
  )
);
```

**What this does**: Allows authenticated users to upload images only to folders corresponding to classrooms they teach.

### Policy 2: Allow Teachers to Delete Their Images

```sql
CREATE POLICY "Teachers can delete their question images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'question-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM classrooms
    WHERE teacher_id = auth.uid()
  )
);
```

**What this does**: Allows teachers to delete images from classrooms they own.

### Policy 3: Allow Public Read Access

```sql
CREATE POLICY "Anyone can view question images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images');
```

**What this does**: Allows anyone (including unauthenticated users) to view/download images. This is needed for students to see question images.

**Alternative**: If you want only authenticated users (students and teachers) to view images:

```sql
CREATE POLICY "Authenticated users can view question images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'question-images');
```

## 3. Update Database Schema

Update the `questions` table to store image URLs as text instead of binary data:

```sql
-- If your image column is currently storing base64/binary data:
-- First, back up existing data if needed
-- Then alter the column to ensure it's text type

ALTER TABLE questions
ALTER COLUMN image TYPE text;

-- Add a comment to document the change
COMMENT ON COLUMN questions.image IS 'Public URL to question image stored in Supabase Storage';
```

## 4. Optional: Migrate Existing Images

If you have existing questions with base64-encoded images, you'll need to migrate them to Supabase Storage. Here's a recommended approach:

1. **Create a migration script** (can be run client-side or as a Supabase Edge Function):

```typescript
// Example migration function (run this once)
async function migrateImagesToStorage() {
  // 1. Fetch all questions with base64 images
  const { data: questions } = await supabase
    .from('questions')
    .select('id, image, classroom_id')
    .not('image', 'is', null)
    .like('image', 'data:image%') // base64 images start with this

  for (const question of questions || []) {
    try {
      // 2. Convert base64 to File
      const response = await fetch(question.image)
      const blob = await response.blob()
      const file = new File([blob], `${question.id}.png`, { type: 'image/png' })

      // 3. Upload to storage
      const imageUrl = await questionService.uploadQuestionImage(
        file,
        question.classroom_id,
        question.id
      )

      // 4. Update database with new URL
      await supabase
        .from('questions')
        .update({ image: imageUrl })
        .eq('id', question.id)

      console.log(`Migrated image for question ${question.id}`)
    } catch (error) {
      console.error(`Failed to migrate question ${question.id}:`, error)
    }
  }
}
```

2. **Run the migration** once from your browser console or as a one-time script.

## 5. Folder Structure

Images will be organized in the bucket as follows:

```
question-images/
├── {classroom-id-1}/
│   ├── {question-id-1}-{timestamp}.jpg
│   ├── {question-id-2}-{timestamp}.png
│   └── ...
├── {classroom-id-2}/
│   ├── {question-id-3}-{timestamp}.jpg
│   └── ...
└── ...
```

This structure:
- Organizes images by classroom for easier management
- Uses unique question IDs + timestamps to prevent naming conflicts
- Makes it easy to apply RLS policies based on classroom ownership

## 6. Verify Setup

Test the implementation by:

1. Creating a new question with an image
2. Verifying the image appears in Storage under the correct folder
3. Confirming the image displays correctly in the UI
4. Testing image deletion when deleting a question
5. Checking that only teachers can upload/delete images for their classrooms

## 7. Monitoring and Maintenance

- **Storage Limits**: Free tier includes 1 GB of storage. Monitor usage in the Supabase dashboard.
- **Bandwidth**: Free tier includes 2 GB egress per month. Monitor if you have many users.
- **Cleanup**: Consider implementing a cleanup job to remove orphaned images (images with no corresponding question record).

## Troubleshooting

### Images not uploading
- Check browser console for errors
- Verify the bucket exists and is named `question-images`
- Confirm RLS policies are correctly applied
- Check file size (must be < 5MB)

### Images not displaying
- Verify the bucket is set to **Public**
- Check that the public read policy is enabled
- Inspect the image URL in the database (should be a valid Supabase Storage URL)

### Permission errors
- Ensure the user is authenticated
- Verify the user owns the classroom they're trying to upload to
- Check that RLS policies match your application's logic

---

**Note**: After completing these steps, your application will store question images in Supabase Storage instead of as base64 in the database, which is more efficient and scalable.
