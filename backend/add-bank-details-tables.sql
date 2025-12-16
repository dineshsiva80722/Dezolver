-- Company Bank Details Table
CREATE TABLE IF NOT EXISTS company_bank_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255),
    branch_address VARCHAR(255),
    swift_code VARCHAR(20),
    account_type VARCHAR(50),
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    company_registration_number VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    additional_details JSON,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for company bank details
CREATE INDEX IF NOT EXISTS idx_company_bank_details_is_primary ON company_bank_details(is_primary);
CREATE INDEX IF NOT EXISTS idx_company_bank_details_is_active ON company_bank_details(is_active);
CREATE INDEX IF NOT EXISTS idx_company_bank_details_account_number ON company_bank_details(account_number);

-- Add constraint to ensure only one primary account
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_bank_details_unique_primary 
ON company_bank_details(is_primary) 
WHERE is_primary = TRUE AND is_active = TRUE;

-- Insert default company bank details (modify as needed)
INSERT INTO company_bank_details (
    company_name,
    account_holder_name,
    account_number,
    ifsc_code,
    bank_name,
    branch_name,
    account_type,
    pan_number,
    gst_number,
    is_primary,
    is_active,
    additional_details,
    created_by_id
) VALUES (
    'TechFolks Private Limited',
    'TechFolks Private Limited',
    '1234567890123456',
    'SBIN0001234',
    'State Bank of India',
    'Bangalore Main Branch',
    'Current Account',
    'ABCDE1234F',
    '29ABCDE1234F1Z5',
    TRUE,
    TRUE,
    '{
        "micr_code": "560002002",
        "contact_person": "Finance Manager",
        "phone_number": "+91-9876543210",
        "email": "finance@techfolks.com",
        "authorized_signatory": "CEO - John Doe"
    }',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;