/*
  # Fix Status History Table Structure

  1. Changes
    - Ensure status_history table has correct columns
    - Add proper constraints
    - Update trigger function

  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity
*/

-- First, check if the table exists and create it if not
CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  old_status text CHECK (old_status IS NULL OR old_status IN ('new', 'in_progress', 'review', 'completed')),
  new_status text NOT NULL CHECK (new_status IN ('new', 'in_progress', 'review', 'completed')),
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text
);

-- Enable RLS if not already enabled
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Recreate the policy
DROP POLICY IF EXISTS "Users can view status history" ON status_history;
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

-- Update the status change trigger function
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Log the status change
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

    -- Update the order's updated_at timestamp
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_status_change ON orders;
CREATE TRIGGER on_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();
