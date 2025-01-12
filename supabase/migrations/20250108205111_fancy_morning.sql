/*
  # Update storage policies
  
  1. Changes
    - Drop existing policies
    - Recreate policies with correct settings
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read order files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload order files" ON storage.objects;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  true,
  524288000,
  ARRAY[
    'audio/wav',
    'audio/mpeg',
    'application/zip',
    'application/x-rar-compressed'
  ]
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Recreate policies
CREATE POLICY "Anyone can read order files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'order-files');

CREATE POLICY "Authenticated users can upload order files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-files');