/*
  # Initial Schema Setup for Coda Platform

  1. Tables
    - profiles: User profiles for clients, freelancers, and admins
    - orders: Audio mixing/mastering orders
    - revisions: Order revisions and feedback

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'freelancer', 'admin')),
  avatar_url text,
  music_styles text[]
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  freelancer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed')),
  service_type text NOT NULL CHECK (service_type IN ('mixing', 'mastering')),
  music_style text NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0)
);

-- Create revisions table
CREATE TABLE IF NOT EXISTS revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback text,
  file_url text NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Orders policies
CREATE POLICY "Clients can read their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Freelancers can read assigned orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (freelancer_id = auth.uid());

CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Clients can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'client'
    )
  );

-- Revisions policies
CREATE POLICY "Users can read revisions for their orders"
  ON revisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = revisions.order_id
      AND (orders.client_id = auth.uid() OR orders.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Freelancers can create revisions for their orders"
  ON revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.freelancer_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();