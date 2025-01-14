/*
  # Fix Order Status Type Dependencies

  1. Changes
    - Drop dependent tables and constraints
    - Recreate tables with text type
    - Restore data and constraints

  2. Security
    - Maintain existing RLS policies
*/

-- First, temporarily store the data
CREATE TEMP TABLE temp_status_history AS
SELECT * FROM status_history;

-- Drop dependent tables
DROP TABLE status_history;

-- Now we can safely drop the type
DROP TYPE IF EXISTS order_status;

-- Recreate status_history table with text type
CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  old_status text CHECK (old_status IN ('new', 'in_progress', 'review', 'completed')),
  new_status text CHECK (new_status IN ('new', 'in_progress', 'review', 'completed')),
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text
);

-- Restore the data
INSERT INTO status_history
SELECT * FROM temp_status_history;

-- Drop temporary table
DROP TABLE temp_status_history;

-- Enable RLS
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Recreate policies
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

-- Update the status change trigger
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Validate status transition
    IF NEW.status NOT IN ('new', 'in_progress', 'review', 'completed') THEN
      RAISE EXCEPTION 'Invalid status value: %', NEW.status;
    END IF;

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
