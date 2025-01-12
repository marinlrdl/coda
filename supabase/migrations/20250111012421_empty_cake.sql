-- Drop existing policies for orders
DROP POLICY IF EXISTS "Users can read orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Clients can read their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;

-- Create comprehensive policies for orders
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

-- Drop existing policies for status_history
DROP POLICY IF EXISTS "Users can view status history" ON status_history;
DROP POLICY IF EXISTS "Admins can manage status history" ON status_history;
DROP POLICY IF EXISTS "Clients can view status history for their orders" ON status_history;

-- Create new policy for status_history
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
      previous_status,
      current_status,
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