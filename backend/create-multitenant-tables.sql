-- Multi-tenant Enterprise Architecture Tables

-- Organizations Table (Tenant management)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(255) NOT NULL,
    company_size VARCHAR(50) DEFAULT 'small',
    contact_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    address JSON,
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise', 'unlimited')),
    status VARCHAR(50) DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'expired', 'trial')),
    user_limit INTEGER NOT NULL,
    current_users INTEGER DEFAULT 0,
    manager_limit INTEGER DEFAULT 1,
    current_managers INTEGER DEFAULT 0,
    trial_start_date DATE,
    trial_end_date DATE,
    subscription_start_date DATE,
    subscription_end_date DATE,
    features_enabled JSON NOT NULL,
    billing_info JSON,
    settings JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table (Licensing and billing)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise', 'unlimited')),
    status VARCHAR(50) DEFAULT 'trialing' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
    billing_cycle VARCHAR(50) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'annually')),
    user_limit INTEGER NOT NULL,
    manager_limit INTEGER DEFAULT 1,
    price_per_user DECIMAL(10,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    trial_end_date DATE,
    next_billing_date DATE,
    auto_renewal BOOLEAN DEFAULT TRUE,
    features JSON NOT NULL,
    payment_info JSON,
    usage_metrics JSON,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update Users table for multi-tenant support
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'user' CHECK (tier IN ('platform', 'manager', 'user'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_organization_owner BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invited_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP;

-- Update role enum to include new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('platform_admin', 'organization_manager', 'hr_manager', 'user', 'admin', 'problem_setter', 'moderator'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_org_code ON organizations(org_code);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_role_tier ON users(role, tier);

-- Create default TechFolks platform organization (for platform admins)
INSERT INTO organizations (
    org_code,
    name,
    description,
    industry,
    company_size,
    contact_email,
    plan,
    status,
    user_limit,
    current_users,
    manager_limit,
    features_enabled,
    settings
) VALUES (
    'PLATFORM',
    'TechFolks Platform',
    'Internal platform administration',
    'Technology',
    'enterprise',
    'admin@techfolks.com',
    'unlimited',
    'active',
    -1,
    1,
    -1,
    '{
        "hr_management": true,
        "payroll_processing": true,
        "certificate_automation": true,
        "advanced_analytics": true,
        "api_access": true,
        "custom_branding": true,
        "sso_integration": true,
        "bulk_operations": true
    }',
    '{
        "allow_self_registration": false,
        "require_email_verification": true,
        "password_policy": {
            "min_length": 8,
            "require_uppercase": true,
            "require_lowercase": true,
            "require_numbers": true,
            "require_symbols": false
        },
        "session_timeout": 604800000,
        "max_login_attempts": 5
    }'
) ON CONFLICT (org_code) DO NOTHING;

-- Update existing admin user to be platform admin
UPDATE users 
SET 
    role = 'platform_admin',
    tier = 'platform',
    organization_id = (SELECT id FROM organizations WHERE org_code = 'PLATFORM'),
    is_organization_owner = TRUE
WHERE role = 'admin' AND username = 'admin';

-- Create sample organization for testing
INSERT INTO organizations (
    org_code,
    name,
    description,
    industry,
    company_size,
    contact_email,
    plan,
    status,
    user_limit,
    current_users,
    manager_limit,
    features_enabled,
    settings
) VALUES (
    'DEMO001',
    'Demo Corporation',
    'Sample organization for testing multi-tenant features',
    'Software Development',
    'medium',
    'manager@democorp.com',
    'professional',
    'active',
    100,
    0,
    3,
    '{
        "hr_management": true,
        "payroll_processing": true,
        "certificate_automation": true,
        "advanced_analytics": true,
        "api_access": false,
        "custom_branding": false,
        "sso_integration": false,
        "bulk_operations": true
    }',
    '{
        "allow_self_registration": true,
        "require_email_verification": true,
        "password_policy": {
            "min_length": 8,
            "require_uppercase": true,
            "require_lowercase": true,
            "require_numbers": true,
            "require_symbols": false
        },
        "session_timeout": 604800000,
        "max_login_attempts": 5
    }'
) ON CONFLICT (org_code) DO NOTHING;

-- Create sample subscription for demo organization
INSERT INTO subscriptions (
    subscription_id,
    organization_id,
    plan,
    status,
    billing_cycle,
    user_limit,
    manager_limit,
    price_per_user,
    base_price,
    total_amount,
    start_date,
    end_date,
    trial_end_date,
    features,
    usage_metrics,
    created_by_id
) VALUES (
    'SUB-DEMO-001',
    (SELECT id FROM organizations WHERE org_code = 'DEMO001'),
    'professional',
    'active',
    'monthly',
    100,
    3,
    100.00,
    9999.00,
    9999.00,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    NULL,
    '{
        "hr_management": true,
        "payroll_processing": true,
        "certificate_automation": true,
        "advanced_analytics": true,
        "api_access": false,
        "custom_branding": false,
        "sso_integration": false,
        "bulk_operations": true,
        "priority_support": true,
        "data_export": true
    }',
    '{
        "active_users": 0,
        "certificates_generated": 0,
        "payroll_cycles_processed": 0,
        "api_calls_month": 0,
        "storage_used_mb": 0
    }',
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
) ON CONFLICT (subscription_id) DO NOTHING;

-- Create demo organization manager
INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    tier,
    organization_id,
    is_organization_owner,
    is_verified,
    is_active,
    rating,
    max_rating
) VALUES (
    'democorp_manager',
    'manager@democorp.com',
    '$2b$10$CY/eys1eACXckTNubQws2OZExAE6SRuVHH6jeV3Fl1Jly.J3oKPHu', -- password: admin123
    'Demo Corporation Manager',
    'organization_manager',
    'manager',
    (SELECT id FROM organizations WHERE org_code = 'DEMO001'),
    TRUE,
    TRUE,
    TRUE,
    1500,
    1500
) ON CONFLICT (username) DO NOTHING;

-- Create demo regular user
INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    tier,
    organization_id,
    is_organization_owner,
    is_verified,
    is_active,
    invited_by_id,
    invitation_accepted_at,
    rating,
    max_rating
) VALUES (
    'demouser',
    'user@democorp.com',
    '$2b$10$CY/eys1eACXckTNubQws2OZExAE6SRuVHH6jeV3Fl1Jly.J3oKPHu', -- password: admin123
    'Demo User',
    'user',
    'user',
    (SELECT id FROM organizations WHERE org_code = 'DEMO001'),
    FALSE,
    TRUE,
    TRUE,
    (SELECT id FROM users WHERE username = 'democorp_manager'),
    CURRENT_TIMESTAMP,
    1200,
    1200
) ON CONFLICT (username) DO NOTHING;

-- Update organization user counts
UPDATE organizations 
SET 
    current_users = (
        SELECT COUNT(*) FROM users 
        WHERE organization_id = organizations.id AND is_active = TRUE
    ),
    current_managers = (
        SELECT COUNT(*) FROM users 
        WHERE organization_id = organizations.id AND tier = 'manager' AND is_active = TRUE
    );

-- Create constraints for data integrity
ALTER TABLE organizations 
ADD CONSTRAINT chk_current_users_within_limit 
CHECK (user_limit = -1 OR current_users <= user_limit);

ALTER TABLE organizations 
ADD CONSTRAINT chk_current_managers_within_limit 
CHECK (manager_limit = -1 OR current_managers <= manager_limit);