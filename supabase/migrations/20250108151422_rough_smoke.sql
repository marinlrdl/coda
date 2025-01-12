/*
  # Fix authentication policies

  1. Changes
    - Add policy to allow profile creation during registration
    - Update existing profile policies for better security
  
  2. Security
    - Enable profile creation for authenticated users
    - Maintain read/update restrictions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users only" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  -- Users can read their own profile
  auth.uid() = id
  OR 
  -- Freelancers can read client profiles for their orders
  EXISTS (
    SELECT 1 FROM orders 
    WHERE (orders.client_id = profiles.id AND orders.freelancer_id = auth.uid())
    OR (orders.freelancer_id = profiles.id AND orders.client_id = auth.uid())
  )
  OR
  -- Admins can read all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable update for users based on role" 
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);