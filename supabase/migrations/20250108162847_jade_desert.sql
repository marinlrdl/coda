/*
  # Add file support to orders

  1. Changes
    - Add files column to store file metadata
    - Add storage bucket for order files
*/

-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name)
VALUES ('order-files', 'order-files')
ON CONFLICT (id) DO NOTHING;

-- Add RLS policy for storage bucket
CREATE POLICY "Users can upload order files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-files');

CREATE POLICY "Users can read order files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'order-files');

-- Add files column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]';
