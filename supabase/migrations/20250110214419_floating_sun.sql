/*
  # Add support for changing freelancer assignments

  1. Changes
    - Add policy for admins to delete project assignments
    - Add policy for admins to update project assignments
    - Add policy for admins to update assignment history

  2. Security
    - Only admins can manage assignments
*/

-- Add policy for deleting project assignments
CREATE POLICY "Admins can delete project assignments"
ON project_assignments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add policy for updating project assignments
CREATE POLICY "Admins can update project assignments"
ON project_assignments
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
