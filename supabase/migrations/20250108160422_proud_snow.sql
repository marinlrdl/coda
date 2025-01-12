/*
  # Create test orders and data

  1. New Data
    - Creates test orders for different users
    - Assigns orders to freelancer
    - Sets different statuses
*/

-- Create orders for the client
INSERT INTO orders (client_id, freelancer_id, title, service_type, music_style, status, price, description)
SELECT 
  (SELECT id FROM profiles WHERE email = 'client@example.com'),
  (SELECT id FROM profiles WHERE email = 'freelancer@example.com'),
  'Pop Song Mix',
  'mixing',
  'pop',
  'in_progress',
  299,
  'Modern pop song needs professional mixing'
WHERE NOT EXISTS (
  SELECT 1 FROM orders WHERE title = 'Pop Song Mix'
);

INSERT INTO orders (client_id, freelancer_id, title, service_type, music_style, status, price, description)
SELECT 
  (SELECT id FROM profiles WHERE email = 'client@example.com'),
  (SELECT id FROM profiles WHERE email = 'freelancer@example.com'),
  'Rock Album Master',
  'mastering',
  'rock',
  'review',
  199,
  'Full album mastering needed'
WHERE NOT EXISTS (
  SELECT 1 FROM orders WHERE title = 'Rock Album Master'
);

INSERT INTO orders (client_id, freelancer_id, title, service_type, music_style, status, price, description)
SELECT 
  (SELECT id FROM profiles WHERE email = 'client@example.com'),
  (SELECT id FROM profiles WHERE email = 'freelancer@example.com'),
  'EDM Track Mix',
  'mixing',
  'electronic',
  'completed',
  299,
  'Electronic dance track mixing'
WHERE NOT EXISTS (
  SELECT 1 FROM orders WHERE title = 'EDM Track Mix'
);