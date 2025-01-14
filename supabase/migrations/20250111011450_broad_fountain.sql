/*
  # Fix Status History Table and Status Tracking

  1. Changes
    - Create status_history table with correct column names
    - Update order status constraints
    - Create trigger for status change tracking

  2. Security
    - Enable RLS
    - Add appropriate policies
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_status_change ON orders;

-- Drop and recreate status_history table
DROP TABLE IF EXISTS status_history;
CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  previous_status text CHECK (previous_status IS NULL OR previous_status IN ('new', 'in_progress', 'review', 'completed')),
  current_status text NOT NULL CHECK (current_status IN ('new', 'in_progress', 'review', 'completed')),
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text
);

-- Enable RLS
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing status history
CREATE POLICY "Users can view status history"
ON status_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = status_history.order_id
    AND (
      orders.client_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);

-- Update orders table status constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('new', 'in_progress', 'review', 'completed'));

-- Update existing orders to use valid status values
UPDATE orders
SET status = CASE
  WHEN status NOT IN ('new', 'in_progress', 'review', 'completed') THEN 'new'
  ELSE status
END;

-- Create trigger function to log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO status_history (
      order_id,
      previous_status,
      current_status,
      changed_by
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      auth.uid()
    );

    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
CREATE TRIGGER on_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();
