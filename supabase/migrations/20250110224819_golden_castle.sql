/*
  # Add status tracking columns
  
  1. Changes
    - Add status_updated_at column to track when status was last updated
    - Add status_updated_by column to track who updated the status
    - Add trigger to automatically update status_updated_at
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add status tracking columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS status_updated_by uuid REFERENCES profiles(id);

-- Create trigger to update status_updated_at
CREATE OR REPLACE FUNCTION update_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to orders table
DROP TRIGGER IF EXISTS update_order_status_timestamp ON orders;
CREATE TRIGGER update_order_status_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_status_timestamp();

-- Update existing orders with current timestamp
UPDATE orders 
SET status_updated_at = updated_at 
WHERE status_updated_at IS NULL;
