-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_status_change ON orders;

-- Drop and recreate orders table
DROP TABLE IF EXISTS orders CASCADE;

-- Recreate orders table with updated constraints
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

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
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

-- Create trigger function
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

-- Create trigger
CREATE TRIGGER on_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();