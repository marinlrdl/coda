-- Update project assignments status check constraint
ALTER TABLE project_assignments 
DROP CONSTRAINT IF EXISTS project_assignments_status_check;

ALTER TABLE project_assignments 
ADD CONSTRAINT project_assignments_status_check 
CHECK (status IN ('in_progress', 'revision', 'completed'));

-- Update existing assignments to use new status
UPDATE project_assignments 
SET status = 'in_progress' 
WHERE status NOT IN ('in_progress', 'revision', 'completed');

-- Update orders status check constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('not_assigned', 'in_progress', 'revision', 'completed'));

-- Update existing orders to use new status
UPDATE orders 
SET status = 'not_assigned' 
WHERE status NOT IN ('not_assigned', 'in_progress', 'revision', 'completed');