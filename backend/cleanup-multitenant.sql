-- Cleanup Multi-tenant Database Changes
-- Revert back to simple single-tenant structure

-- Remove organization-related columns from users
ALTER TABLE users DROP COLUMN IF EXISTS tier;
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE users DROP COLUMN IF EXISTS is_organization_owner;
ALTER TABLE users DROP COLUMN IF EXISTS invited_by_id;
ALTER TABLE users DROP COLUMN IF EXISTS invitation_accepted_at;

-- Revert role enum to original values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'problem_setter', 'moderator'));

-- Update existing users to use simple roles
UPDATE users SET role = 'admin' WHERE role IN ('platform_admin', 'organization_manager', 'hr_manager');
UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'problem_setter', 'moderator');

-- Drop organization-related tables (optional - keeping data for reference)
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;

-- Remove organization-related indexes
DROP INDEX IF EXISTS idx_users_organization_id;
DROP INDEX IF EXISTS idx_users_tier;
DROP INDEX IF EXISTS idx_users_role_tier;

-- Clean up any organization references in other tables
-- (No organization_id foreign keys in main tables, so nothing to clean)

-- Verify the cleanup
SELECT 
    username, 
    role,
    CASE 
        WHEN role = 'admin' THEN 'Administrator'
        WHEN role = 'user' THEN 'Regular User'
        WHEN role = 'problem_setter' THEN 'Problem Setter'
        WHEN role = 'moderator' THEN 'Moderator'
        ELSE 'Unknown Role'
    END as role_description
FROM users 
WHERE is_active = true
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'moderator' THEN 2
        WHEN 'problem_setter' THEN 3
        WHEN 'user' THEN 4
        ELSE 5
    END,
    username;