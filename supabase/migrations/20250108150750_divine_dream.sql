-- Ensure proper RLS policies for orders table
CREATE POLICY "Clients can read their own orders"
ON orders FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Admins can read all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
