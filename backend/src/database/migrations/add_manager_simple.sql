-- Simple migration to add manager-student hierarchy
-- Works with TypeORM's existing schema

-- Add managed_by column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'managed_by'
    ) THEN
        ALTER TABLE users ADD COLUMN managed_by UUID;
        ALTER TABLE users ADD CONSTRAINT fk_users_managed_by 
            FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add added_by column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'added_by'
    ) THEN
        ALTER TABLE users ADD COLUMN added_by VARCHAR(20) DEFAULT 'self';
    END IF;
END $$;

-- Create indexes (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_managed_by'
    ) THEN
        CREATE INDEX idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_added_by'
    ) THEN
        CREATE INDEX idx_users_added_by ON users(added_by);
    END IF;
END $$;

-- Update existing users
UPDATE users SET added_by = 'self' WHERE added_by IS NULL;

-- Add comments
COMMENT ON COLUMN users.managed_by IS 'ID of the manager who added this student (NULL for self-registered users)';
COMMENT ON COLUMN users.added_by IS 'How user was added: self (registered), manager (added by manager), admin (added by admin)';

-- Show success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added columns: managed_by, added_by';
    RAISE NOTICE 'Manager role can now be assigned via role column (already exists)';
END $$;

