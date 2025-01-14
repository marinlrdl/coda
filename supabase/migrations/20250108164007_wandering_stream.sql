/*
  # Storage setup for order files
  
  1. Changes
    - Create storage bucket for order files
    - Add storage policies for authenticated users
    - Update orders table to include files column
*/

-- Create storage bucket for order files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for storage bucket
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

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
