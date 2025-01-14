/*
  # Update Storage Bucket MIME Types

  1. Changes
    - Update allowed MIME types for order-files bucket
    - Add all necessary ZIP file MIME types
    - Ensure consistent file type handling

  2. Security
    - Maintain existing RLS policies
    - Keep file size limits
*/

-- Update storage bucket configuration with comprehensive MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Audio files
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/x-wav',
  
  -- ZIP files (all common MIME types)
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/octet-stream',
  
  -- Additional compressed formats
  'application/x-compressed',
  'multipart/x-zip'
]
WHERE id = 'order-files';
