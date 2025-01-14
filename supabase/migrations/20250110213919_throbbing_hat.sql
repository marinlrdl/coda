/*
  # Fix assignment history RLS policies

  1. Changes
    - Add INSERT policy for assignment history table to allow admins to create history records
    - Add UPDATE policy for assignment history table to allow admins to update history records

  2. Security
    - Only admins can insert/update assignment history records
    - Maintains existing read-only policy for authenticated users
*/

-- Add INSERT policy for assignment history
CREATE POLICY "Admins can insert assignment history"
ON assignment_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add UPDATE policy for assignment history
CREATE POLICY "Admins can update assignment history"
ON assignment_history
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
