/*
  # Add deadline field and update order status

  1. Changes
    - Add deadline field to orders table
    - Update order status check constraint
    - Add index for faster sorting by deadline
*/

-- Add deadline field to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS deadline timestamptz;

-- Create index for deadline sorting
CREATE INDEX IF NOT EXISTS orders_deadline_idx ON orders(deadline);

-- Update order status check constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('in_progress', 'completed'));