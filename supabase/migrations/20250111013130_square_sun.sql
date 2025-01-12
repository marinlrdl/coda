-- Drop existing policies for orders
DROP POLICY IF EXISTS "Users can read orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

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

CREATE POLICY "Clients can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  client_id = auth.uid()
);

CREATE POLICY "Clients can update their orders"
ON orders FOR UPDATE
TO authenticated
USING (
  client_id = auth.uid() AND
  status NOT IN ('completed')
)
WITH CHECK (
  client_id = auth.uid() AND
  status NOT IN ('completed')
);

CREATE POLICY "Admins can update any order"
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