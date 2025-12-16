-- Add Manager-Student Hierarchy
-- This migration adds support for managers to add students

-- Step 1: Try to add 'manager' to user_role enum (will fail silently if already exists)
DO $$ 
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add managed_by column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'managed_by'
    ) THEN
        ALTER TABLE users ADD COLUMN managed_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Create user_added_by enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_added_by') THEN
        CREATE TYPE user_added_by AS ENUM ('self', 'manager', 'admin');
    END IF;
END $$;

-- Step 4: Add added_by column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'added_by'
    ) THEN
        ALTER TABLE users ADD COLUMN added_by user_added_by DEFAULT 'self';
    END IF;
END $$;

-- Step 5: Create indexes (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_managed_by'
    ) THEN
        CREATE INDEX idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role'
    ) THEN
        CREATE INDEX idx_users_role ON users(role);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_added_by'
    ) THEN
        CREATE INDEX idx_users_added_by ON users(added_by);
    END IF;
END $$;

-- Step 6: Update existing users (safe to run multiple times)
UPDATE users SET added_by = 'self' WHERE added_by IS NULL;

-- Add comments
COMMENT ON COLUMN users.managed_by IS 'ID of the manager who added this student';
COMMENT ON COLUMN users.added_by IS 'How this user was added: self (registered), manager (added by manager), admin (added by admin)';

