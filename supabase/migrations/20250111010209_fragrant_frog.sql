/*
  # Fix Order Status Migration

  1. Changes
    - Create temporary tables with explicit column selection
    - Drop dependent objects
    - Recreate tables with proper structure
    - Restore data with explicit column mapping
    - Recreate triggers and policies

  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity during migration
*/

-- First, create temporary tables with explicit columns
CREATE TEMP TABLE temp_orders AS 
SELECT 
  id,
  created_at,
  updated_at,
  client_id,
  status,
  service_type,
  music_style,
  title,
  description,
  price,
  files,
  deadline
FROM orders;

CREATE TEMP TABLE temp_status_history AS 
SELECT 
  id,
  created_at,
  order_id,
  old_status,
  new_status,
  changed_by,
  notes
FROM status_history;

-- Drop dependent objects
DROP TRIGGER IF EXISTS on_status_change ON orders;
DROP TABLE status_history;
DROP TABLE orders CASCADE;

-- Now we can safely drop the type
DROP TYPE IF EXISTS order_status;

-- Recreate orders table with text type
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'review', 'completed')),
  service_type text NOT NULL CHECK (service_type IN ('mixing', 'mastering')),
  music_style text NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  files jsonb DEFAULT '[]',
  deadline timestamptz
);

-- Recreate status_history table with text type
CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  old_status text CHECK (old_status IS NULL OR old_status IN ('new', 'in_progress', 'review', 'completed')),
  new_status text NOT NULL CHECK (new_status IN ('new', 'in_progress', 'review', 'completed')),
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text
);

-- Restore data with explicit column mapping
INSERT INTO orders (
  id,
  created_at,
  updated_at,
  client_id,
  status,
  service_type,
  music_style,
  title,
  description,
  price,
  files,
  deadline
)
SELECT
  id,
  created_at,
  updated_at,
  client_id,
  status,
  service_type,
  music_style,
  title,
  description,
  price,
  files,
  deadline
FROM temp_orders;

INSERT INTO status_history (
  id,
  created_at,
  order_id,
  old_status,
  new_status,
  changed_by,
  notes
)
SELECT
  id,
  created_at,
  order_id,
  old_status,
  new_status,
  changed_by,
  notes
FROM temp_status_history;

-- Drop temporary tables
DROP TABLE temp_orders;
DROP TABLE temp_status_history;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Recreate policies for orders
CREATE POLICY "Users can read orders"
ON orders FOR SELECT
TO authenticated
USING (
  client_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Recreate policies for status_history
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

-- Recreate the status change trigger
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
CREATE TRIGGER on_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();
