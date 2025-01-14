/*
  # Update user roles

  1. Changes
    - Update roles for freelancer and admin users
*/

UPDATE profiles 
SET role = 'freelancer' 
WHERE email = 'freelancer@example.com';

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
