-- Certificate Templates Table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    background_url VARCHAR(500),
    logo_url VARCHAR(500),
    watermark_url VARCHAR(500),
    template_config JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    learner_id UUID NOT NULL REFERENCES users(id),
    instructor_id UUID REFERENCES users(id),
    template_id UUID NOT NULL REFERENCES certificate_templates(id),
    course_name VARCHAR(255) NOT NULL,
    problem_id UUID REFERENCES problems(id),
    contest_id UUID REFERENCES contests(id),
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('course_completion', 'assessment_pass', 'contest_completion', 'problem_solved', 'manual_approval')),
    status VARCHAR(50) DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'downloaded', 'revoked')),
    pdf_url VARCHAR(500),
    image_url VARCHAR(500),
    qr_code_url VARCHAR(500),
    verification_url VARCHAR(500) NOT NULL,
    completion_date TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_reason TEXT,
    revoked_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    manager_id UUID REFERENCES employees(id),
    hire_date DATE NOT NULL,
    employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    work_hours_per_week DECIMAL(5,2) DEFAULT 40,
    payment_frequency VARCHAR(50) DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'bi_weekly', 'weekly')),
    basic_salary DECIMAL(10,2) NOT NULL,
    salary_components JSON,
    deductions JSON,
    tax_preferences JSON,
    bank_details JSON,
    is_active BOOLEAN DEFAULT TRUE,
    termination_date DATE,
    termination_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Cycles Table
CREATE TABLE IF NOT EXISTS payroll_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('monthly', 'bi_weekly', 'weekly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    cut_off_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'processing', 'completed', 'cancelled')),
    total_employees INTEGER DEFAULT 0,
    processed_employees INTEGER DEFAULT 0,
    total_gross_amount DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net_amount DECIMAL(15,2) DEFAULT 0,
    created_by_id UUID NOT NULL REFERENCES users(id),
    processed_by_id UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Records Table
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id VARCHAR(50) UNIQUE NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    working_days DECIMAL(5,2) NOT NULL,
    days_worked DECIMAL(5,2) NOT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    leave_days DECIMAL(5,2) DEFAULT 0,
    basic_salary DECIMAL(10,2) NOT NULL,
    earnings JSON NOT NULL,
    gross_salary DECIMAL(10,2) NOT NULL,
    deductions JSON NOT NULL,
    total_deductions DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid', 'cancelled')),
    processed_by_id UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    payment_date TIMESTAMP,
    payment_reference VARCHAR(255),
    salary_slip_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, pay_period_start)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_learner_id ON certificates(learner_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_payroll_id ON payroll_records(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_pay_period ON payroll_records(pay_period_start, pay_period_end);

-- Insert default certificate template
INSERT INTO certificate_templates (
    id,
    name,
    description,
    template_config,
    is_default,
    is_active,
    created_by_id
) VALUES (
    uuid_generate_v4(),
    'Default Certificate Template',
    'Default template for course completion certificates',
    '{
        "layout": {
            "width": 800,
            "height": 600,
            "orientation": "landscape"
        },
        "placeholders": {
            "learnerName": {
                "x": 400,
                "y": 200,
                "fontSize": 36,
                "fontFamily": "Arial",
                "color": "#000000"
            },
            "courseName": {
                "x": 400,
                "y": 280,
                "fontSize": 24,
                "fontFamily": "Arial",
                "color": "#333333"
            },
            "completionDate": {
                "x": 400,
                "y": 350,
                "fontSize": 18,
                "fontFamily": "Arial",
                "color": "#666666"
            },
            "instructorName": {
                "x": 200,
                "y": 500,
                "fontSize": 16,
                "fontFamily": "Arial",
                "color": "#666666"
            },
            "certificateId": {
                "x": 600,
                "y": 500,
                "fontSize": 12,
                "fontFamily": "Arial",
                "color": "#999999"
            },
            "qrCode": {
                "x": 700,
                "y": 450,
                "size": 80
            }
        },
        "fonts": ["Arial", "Times New Roman", "Helvetica"],
        "language": "en",
        "colors": {
            "primary": "#007bff",
            "secondary": "#6c757d",
            "text": "#000000"
        }
    }',
    TRUE,
    TRUE,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;