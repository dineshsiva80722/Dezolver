-- Add Manager-Student Hierarchy
-- This migration adds support for managers to add students

-- Add 'manager' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

-- Add managed_by column to track which manager added which student
ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add added_by column to track how user was added (self/manager/admin)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_added_by') THEN
        CREATE TYPE user_added_by AS ENUM ('self', 'manager', 'admin');
    END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS added_by user_added_by DEFAULT 'self';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_added_by ON users(added_by);

-- Update existing users to have added_by as 'self'
UPDATE users SET added_by = 'self' WHERE added_by IS NULL;

COMMENT ON COLUMN users.managed_by IS 'ID of the manager who added this student';
COMMENT ON COLUMN users.added_by IS 'How this user was added: self (registered), manager (added by manager), admin (added by admin)';

