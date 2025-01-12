/*
  # Update order status types

  1. Changes
    - Update order status types to include new workflow states
    - Add new status check constraint
    - Update existing orders to use new status types

  2. Security
    - Maintains existing RLS policies
*/

-- Update order status check constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('waiting', 'in_progress', 'revision_asked', 'revision_progress', 'completed'));

-- Update existing orders to use new status
UPDATE orders 
SET status = 'in_progress' 
WHERE status NOT IN ('waiting', 'in_progress', 'revision_asked', 'revision_progress', 'completed');