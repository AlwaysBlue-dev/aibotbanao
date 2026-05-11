-- Run this in your Supabase dashboard → SQL Editor
-- Creates the "avatars" storage bucket and sets RLS policies

-- 1. Create bucket (public so avatars are viewable without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to read avatars (public bucket)
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 3. Authenticated users can upload their own avatar
--    File path must be: {user-id}.{ext}  (e.g.  abc-123.jpg)
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- 4. Authenticated users can update/replace their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );
