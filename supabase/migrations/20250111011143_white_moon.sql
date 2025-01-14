/*
  # Update Storage Bucket Configuration

  1. Changes
    - Update allowed MIME types for order-files bucket
    - Add proper MIME type for ZIP files
    - Ensure consistent file type handling

  2. Security
    - Maintain existing RLS policies
    - Keep file size limits
*/

-- Update storage bucket configuration
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/octet-stream'
]
WHERE id = 'order-files';
