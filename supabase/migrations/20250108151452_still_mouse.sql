/*
  # Fix profile policies

  1. Changes
    - Simplify policies to prevent recursion
    - Maintain security while allowing proper access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on role" ON profiles;

-- Create simplified policies
CREATE POLICY "Allow users to insert their own profile"
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read profiles"
ON profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow users to update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
