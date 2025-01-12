/*
  # Add Freelancer Management System
  
  1. New Tables
    - freelancers: Store external freelancer information
    - project_assignments: Track project-freelancer assignments
    - assignment_history: Log status changes and assignment history
  
  2. Changes
    - Add tracking for freelancers without using roles
    - Enable assignment history logging
    - Add project analytics support
*/

-- Create freelancers table
CREATE TABLE IF NOT EXISTS freelancers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  full_name text NOT NULL,
  email text,
  fiverr_profile text,
  notes text,
  active boolean DEFAULT true
);

-- Create project assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  freelancer_id uuid REFERENCES freelancers(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  notes text,
  UNIQUE(order_id) -- One active assignment per order
);

-- Create assignment history table
CREATE TABLE IF NOT EXISTS assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  project_assignment_id uuid REFERENCES project_assignments(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  notes text
);

-- Enable RLS
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for freelancers table
CREATE POLICY "Admins can manage freelancers"
ON freelancers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create policies for project assignments
CREATE POLICY "Admins can manage project assignments"
ON project_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create policies for assignment history
CREATE POLICY "Admins can view assignment history"
ON assignment_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create updated_at triggers
CREATE TRIGGER handle_freelancers_updated_at
  BEFORE UPDATE ON freelancers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_project_assignments_updated_at
  BEFORE UPDATE ON project_assignments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create trigger to log assignment history
CREATE OR REPLACE FUNCTION log_assignment_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO assignment_history (project_assignment_id, status, notes)
    VALUES (NEW.id, NEW.status, NEW.notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_assignment_change
  AFTER INSERT OR UPDATE ON project_assignments
  FOR EACH ROW
  EXECUTE FUNCTION log_assignment_history();