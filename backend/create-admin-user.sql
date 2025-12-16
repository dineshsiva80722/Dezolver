-- Create or update admin user with phone number
-- Password: Admin123 (hashed)

-- First, check if admin2 exists and update phone_number
UPDATE users
SET phone_number = '+1234567890'
WHERE username = 'admin2' AND phone_number IS NULL;

-- If admin2 doesn't exist, create it
-- Password hash for 'Admin123' with bcrypt
INSERT INTO users (
  id,
  username,
  email,
  password_hash,
  full_name,
  phone_number,
  role,
  is_verified,
  is_active,
  rating,
  max_rating,
  problems_solved,
  contests_participated,
  contribution_points,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'admin2',
  'admin2@techfolks.com',
  '$2a$10$YourHashedPasswordHere', -- Will need to be replaced with actual hash
  'System Administrator',
  '+1234567890',
  'admin',
  true,
  true,
  1200,
  1200,
  0,
  0,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin2'
);

-- Alternative: Create a simple admin account (username: admin, password: Admin@123)
-- You'll need to run this with a proper bcrypt hash
-- For now, let's just update existing users to have a default phone number

-- Update all users without phone_number to have a default one
UPDATE users
SET phone_number = '+0000000000'
WHERE phone_number IS NULL OR phone_number = '';

SELECT username, email, phone_number, role
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC
LIMIT 5;
