/*
  # Remove freelancer functionality

  1. Changes
    - Drop dependent policies first
    - Remove status constraints temporarily
    - Update statuses
    - Add new constraints
    - Remove freelancer role and related columns

  2. Data Preservation
    - Convert existing freelancers to clients
    - Update order statuses safely
    - Preserve order history
*/

-- First, drop all dependent policies
DROP POLICY IF EXISTS "Freelancers can read assigned orders" ON orders;
DROP POLICY IF EXISTS "Users can read revisions for their orders" ON revisions;
DROP POLICY IF EXISTS "Freelancers can create revisions for their orders" ON revisions;
DROP POLICY IF EXISTS "Freelancers can view revisions for their orders" ON revisions;
DROP POLICY IF EXISTS "Freelancers can create revisions" ON revisions;

-- Temporarily remove status constraint to allow updates
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Update existing order statuses
UPDATE orders 
SET status = 'in_progress' 
WHERE status IN ('review', 'pending');

-- Add new status constraint
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('in_progress', 'completed'));

-- Convert freelancers to clients
UPDATE profiles 
SET role = 'client' 
WHERE role = 'freelancer';

-- Update role check constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('client', 'admin'));

-- Now we can safely remove freelancer_id
ALTER TABLE orders 
DROP COLUMN IF EXISTS freelancer_id;

-- Create new simplified policies for revisions
CREATE POLICY "Clients can view their order revisions"
ON revisions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = revisions.order_id
    AND orders.client_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all revisions"
ON revisions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);