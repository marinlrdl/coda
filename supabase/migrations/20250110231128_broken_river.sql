-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can manage status history" ON status_history;
DROP POLICY IF EXISTS "Clients can view status history for their orders" ON status_history;

-- Create status enum type
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'new',
    'in_progress', 
    'review',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create status_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text
);

-- Enable RLS
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Update orders table
ALTER TABLE orders 
ALTER COLUMN status TYPE text;

UPDATE orders 
SET status = 'new' 
WHERE status NOT IN ('new', 'in_progress', 'review', 'completed');

ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('new', 'in_progress', 'review', 'completed'));

-- Create trigger function for status history
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO status_history (
      order_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_status_change ON orders;
CREATE TRIGGER on_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- Add policies for status_history
CREATE POLICY "Admins can manage status history"
  ON status_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can view status history for their orders"
  ON status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = status_history.order_id
      AND orders.client_id = auth.uid()
    )
  );