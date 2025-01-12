/*
  # Add revisions system
  
  1. New Tables
    - `revisions` table for tracking order revisions
      - id: Primary key
      - order_id: Reference to orders table
      - version: Revision version number
      - status: Current status (pending/approved/rejected)
      - feedback: Client feedback
      - files: Array of uploaded files
      
  2. Security
    - Enable RLS
    - Add policies for client and freelancer access
*/

-- Create revisions table
CREATE TABLE IF NOT EXISTS revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback text,
  files jsonb DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;

-- Policies for revisions
CREATE POLICY "Clients can view revisions for their orders"
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

CREATE POLICY "Freelancers can view revisions for their orders"
ON revisions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = revisions.order_id
    AND orders.freelancer_id = auth.uid()
  )
);

CREATE POLICY "Freelancers can create revisions"
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

-- Add trigger to update order status when revision is created
CREATE OR REPLACE FUNCTION handle_revision_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET status = 'review'
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_revision_insert
  AFTER INSERT ON revisions
  FOR EACH ROW
  EXECUTE FUNCTION handle_revision_insert();