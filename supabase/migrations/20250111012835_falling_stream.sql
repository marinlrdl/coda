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