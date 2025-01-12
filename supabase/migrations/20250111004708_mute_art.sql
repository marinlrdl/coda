/*
  # Fix Order Status Values

  1. Changes
    - Update order status values to match frontend expectations
    - Convert existing statuses to new format
    - Update status check constraint

  2. Security
    - Maintain existing RLS policies
*/

-- First, update existing orders to use new status values
UPDATE orders
SET status = CASE
  WHEN status = 'waiting' THEN 'new'
  WHEN status = 'revision_asked' OR status = 'revision_progress' THEN 'review'
  ELSE status
END;

-- Update the status check constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('new', 'in_progress', 'review', 'completed'));