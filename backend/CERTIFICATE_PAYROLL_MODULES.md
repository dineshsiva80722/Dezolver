# Certificate Automation & Payroll Management Modules

## Overview

This document provides a comprehensive overview of the newly implemented Certificate Automation Module and Payroll Management Module for the TechFolks platform.

## 📜 Certificate Automation Module

### Features

#### 1. Certificate Templates
- **Template Management**: Create, update, and manage custom certificate templates
- **Dynamic Placeholders**: Support for learner name, course name, completion date, instructor name, certificate ID, and QR codes
- **Customization**: Upload backgrounds, logos, watermarks with configurable layouts
- **Multi-language Support**: Templates can be configured for different languages and fonts
- **Default Template System**: Set default templates with admin controls

#### 2. Automatic Certificate Generation
- **Trigger-based Generation**: Automatic generation on course completion, assessment pass, contest completion, problem solving, or manual approval
- **PDF Generation**: High-quality PDF certificates using PDFKit
- **QR Code Integration**: Unique QR codes for verification embedded in certificates
- **Batch Generation**: Generate certificates for multiple learners simultaneously
- **Unique Certificate IDs**: Each certificate gets a unique, verifiable ID

#### 3. Security & Verification
- **Public Verification**: Anyone can verify certificate authenticity using certificate ID or QR code
- **Verification API**: RESTful API endpoints for third-party verification
- **Tamper Protection**: Certificates cannot be edited after generation
- **Revocation System**: Admin ability to revoke certificates with reason tracking
- **Audit Trail**: Complete logging of certificate lifecycle events

#### 4. Delivery & Storage
- **Multiple Formats**: PDF (primary) with optional image format support
- **Cloud Storage**: Certificates stored securely with URL-based access
- **Email Notifications**: Automatic email delivery to learners with certificate attachments
- **Dashboard Integration**: Certificates accessible from learner dashboard
- **Download Tracking**: Track certificate downloads and access patterns

### API Endpoints

#### Certificate Management
- `POST /api/certificates/generate` - Generate single certificate
- `POST /api/certificates/batch-generate` - Generate multiple certificates
- `GET /api/certificates/my` - Get user's certificates
- `GET /api/certificates/verify/{certificateId}` - Verify certificate
- `GET /api/certificates/download/{certificateId}` - Download certificate
- `PATCH /api/certificates/{certificateId}/revoke` - Revoke certificate (Admin)
- `POST /api/certificates/{certificateId}/reissue` - Reissue certificate (Admin)
- `GET /api/certificates/search` - Search certificates

#### Template Management
- `GET /api/certificates/templates` - List templates
- `POST /api/certificates/templates` - Create template
- `GET /api/certificates/templates/{templateId}` - Get template
- `PATCH /api/certificates/templates/{templateId}` - Update template
- `PATCH /api/certificates/templates/{templateId}/set-default` - Set default template

### Database Schema

#### Certificate Template Entity
```typescript
- id: UUID (Primary Key)
- name: String (Template name)
- description: Text (Optional description)
- background_url: String (Background image URL)
- logo_url: String (Logo image URL)
- watermark_url: String (Watermark image URL)
- template_config: JSON (Layout and placeholder configuration)
- is_default: Boolean (Default template flag)
- is_active: Boolean (Active status)
- created_by_id: UUID (Creator reference)
- created_at: Timestamp
- updated_at: Timestamp
```

#### Certificate Entity
```typescript
- id: UUID (Primary Key)
- certificate_id: String (Unique certificate identifier)
- learner_id: UUID (Learner reference)
- instructor_id: UUID (Optional instructor reference)
- template_id: UUID (Template reference)
- course_name: String (Course/achievement name)
- problem_id: UUID (Optional problem reference)
- contest_id: UUID (Optional contest reference)
- trigger_type: Enum (Generation trigger)
- status: Enum (Certificate status)
- pdf_url: String (PDF file URL)
- image_url: String (Optional image URL)
- qr_code_url: String (QR code image URL)
- verification_url: String (Verification URL)
- completion_date: Date (Achievement completion date)
- is_revoked: Boolean (Revocation status)
- revoked_reason: Text (Optional revocation reason)
- download_count: Integer (Download tracking)
- metadata: JSON (Additional certificate data)
- created_at: Timestamp
- updated_at: Timestamp
```

---

## 💰 Payroll Management Module

### Features

#### 1. Employee Management
- **Complete Employee Profiles**: Job title, department, manager hierarchy, employment type
- **Salary Structure Management**: Basic salary, allowances, deductions, tax preferences
- **Bank Account Integration**: Secure storage of banking details for salary disbursement
- **Employment Timeline**: Hire date, termination management, employment history
- **Manager-Employee Relationships**: Hierarchical reporting structure

#### 2. Salary Calculation Engine
- **Automatic Calculations**: Comprehensive salary computation including all components
- **Tax Compliance**: Support for old and new tax regimes with automatic TDS calculation
- **Statutory Compliance**: PF, ESI, professional tax calculations
- **Proportional Calculations**: Handle partial months, leaves, overtime accurately
- **Custom Components**: Support for custom allowances and deductions

#### 3. Payroll Processing
- **Batch Processing**: Process payroll for multiple employees simultaneously
- **Multiple Pay Cycles**: Support for monthly, bi-weekly, and weekly payroll cycles
- **Approval Workflow**: Draft → Processed → Paid status management
- **Payment Integration**: Ready for banking API integration for bulk disbursement
- **Audit Trail**: Complete tracking of payroll processing activities

#### 4. Salary Slip Generation
- **Professional PDF Generation**: Detailed salary slips with company branding
- **Comprehensive Breakdown**: Clear earnings, deductions, and net pay sections
- **Indian Format Compliance**: Follows Indian payroll standards and formats
- **Number-to-Words Conversion**: Net salary amount in words for official documentation
- **Email Delivery**: Automatic email delivery of salary slips to employees

#### 5. Reporting & Analytics
- **Payroll Summary Reports**: Department-wise and period-wise summaries
- **Employee Compensation Analysis**: Total compensation calculations
- **Historical Data**: Complete payroll history for each employee
- **Export Capabilities**: Data export for integration with accounting systems

### API Endpoints

#### Employee Management
- `POST /api/employees` - Create employee record (Admin)
- `GET /api/employees` - List employees with filters
- `GET /api/employees/search` - Search employees
- `GET /api/employees/me` - Get my employee record
- `GET /api/employees/{employeeId}` - Get employee details
- `PATCH /api/employees/{employeeId}` - Update employee (Admin)
- `PATCH /api/employees/{employeeId}/terminate` - Terminate employee (Admin)
- `GET /api/employees/departments` - Get departments list
- `GET /api/employees/managers` - Get managers list

#### Payroll Management
- `POST /api/payroll/calculate` - Calculate payroll for employee (Admin)
- `POST /api/payroll/batch-calculate` - Batch payroll calculation (Admin)
- `PATCH /api/payroll/{payrollId}/process` - Process payroll (Admin)
- `PATCH /api/payroll/{payrollId}/mark-paid` - Mark as paid (Admin)
- `GET /api/payroll/employee/{employeeId}` - Get employee payrolls
- `GET /api/payroll/my` - Get my payroll records
- `GET /api/payroll/summary` - Get payroll summary (Admin)

#### Salary Slip Management
- `POST /api/payroll/{payrollId}/salary-slip/generate` - Generate salary slip (Admin)
- `POST /api/payroll/salary-slips/batch-generate` - Batch generate salary slips (Admin)
- `GET /api/payroll/{payrollId}/salary-slip/download` - Download salary slip

### Database Schema

#### Employee Entity
```typescript
- id: UUID (Primary Key)
- employee_id: String (Unique employee identifier)
- user_id: UUID (User reference)
- job_title: String (Job designation)
- department: String (Department name)
- manager_id: UUID (Optional manager reference)
- hire_date: Date (Employment start date)
- employment_type: Enum (Full-time, Part-time, Contract, Intern)
- work_hours_per_week: Decimal (Working hours)
- payment_frequency: Enum (Monthly, Bi-weekly, Weekly)
- basic_salary: Decimal (Base salary amount)
- salary_components: JSON (Allowances configuration)
- deductions: JSON (Deductions configuration)
- tax_preferences: JSON (Tax-related preferences)
- bank_details: JSON (Banking information)
- is_active: Boolean (Employment status)
- termination_date: Date (Optional termination date)
- created_at: Timestamp
- updated_at: Timestamp
```

#### Payroll Record Entity
```typescript
- id: UUID (Primary Key)
- payroll_id: String (Unique payroll identifier)
- employee_id: UUID (Employee reference)
- pay_period_start: Date (Payroll period start)
- pay_period_end: Date (Payroll period end)
- working_days: Decimal (Total working days)
- days_worked: Decimal (Actual days worked)
- overtime_hours: Decimal (Overtime hours)
- leave_days: Decimal (Leave days taken)
- basic_salary: Decimal (Basic salary for period)
- earnings: JSON (All earnings breakdown)
- gross_salary: Decimal (Total earnings)
- deductions: JSON (All deductions breakdown)
- total_deductions: Decimal (Total deductions)
- net_salary: Decimal (Final salary amount)
- status: Enum (Draft, Processed, Paid, Cancelled)
- processed_by_id: UUID (Processor reference)
- salary_slip_url: String (Salary slip PDF URL)
- created_at: Timestamp
- updated_at: Timestamp
```

---

## 🔧 Technical Implementation

### Dependencies Added
```json
{
  "puppeteer": "^24.20.0",
  "qrcode": "^1.5.4",
  "pdfkit": "^0.17.2",
  "@types/qrcode": "^1.5.5",
  "@types/pdfkit": "^0.17.3"
}
```

### File Structure
```
src/
├── models/
│   ├── Certificate.entity.ts
│   ├── CertificateTemplate.entity.ts
│   ├── Employee.entity.ts
│   ├── PayrollRecord.entity.ts
│   └── PayrollCycle.entity.ts
├── services/
│   ├── certificate-template.service.ts
│   ├── certificate-generation.service.ts
│   ├── certificate-verification.service.ts
│   ├── employee.service.ts
│   ├── payroll-calculation.service.ts
│   └── salary-slip.service.ts
├── controllers/
│   ├── certificate.controller.ts
│   ├── employee.controller.ts
│   └── payroll.controller.ts
└── routes/
    ├── certificate.routes.ts
    ├── employee.routes.ts
    └── payroll.routes.ts
```

### Email Integration

#### Certificate Notifications
- **Certificate Generated**: Congratulatory email with download links and verification URL
- **Certificate Revoked**: Notification about certificate revocation (if applicable)

#### Payroll Notifications
- **Salary Processed**: Notification when salary is processed and ready for disbursement
- **Salary Slip Ready**: Email with salary slip attachment and download link
- **Payment Confirmation**: Confirmation when salary is marked as paid

## 🚀 Setup Instructions

### 1. Database Migration
Update your database to include the new entities. The entities are already added to the TypeORM configuration.

### 2. Environment Variables
Add the following environment variables for certificate and payroll functionality:

```env
# Certificate Module
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# File Upload Directories
UPLOADS_DIR=./uploads
CERTIFICATES_DIR=./uploads/certificates
QR_CODES_DIR=./uploads/qr-codes
SALARY_SLIPS_DIR=./uploads/salary-slips

# Email Configuration (already exists)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. File System Setup
Ensure upload directories exist:
```bash
mkdir -p uploads/certificates
mkdir -p uploads/qr-codes
mkdir -p uploads/salary-slips
```

### 4. Admin User Setup
Create admin users who can:
- Manage certificate templates
- Revoke/reissue certificates
- Create employee records
- Process payroll
- Generate salary slips

## 🔐 Security Considerations

### Certificate Module
- **Unique Certificate IDs**: Prevents certificate forgery
- **QR Code Verification**: Tamper-evident verification system
- **Admin-only Operations**: Certificate revocation and reissuance restricted to admins
- **Audit Logging**: Complete trail of certificate operations

### Payroll Module
- **Role-based Access**: Employee data access restricted based on user roles
- **Bank Detail Encryption**: Sensitive financial information properly secured
- **Audit Trail**: All payroll operations logged for compliance
- **Data Validation**: Comprehensive validation of all payroll calculations

## 📊 Usage Examples

### Certificate Generation
```javascript
// Generate certificate for course completion
const certificate = await certificateService.generateCertificate({
  learner_id: "user-uuid",
  instructor_id: "instructor-uuid",
  course_name: "Advanced JavaScript",
  trigger_type: "course_completion",
  completion_date: new Date(),
  metadata: { grade: 85 }
});
```

### Payroll Calculation
```javascript
// Calculate monthly payroll
const payroll = await payrollService.calculatePayroll({
  employee: employeeRecord,
  payPeriodStart: new Date('2024-01-01'),
  payPeriodEnd: new Date('2024-01-31'),
  workingDays: 22,
  daysWorked: 20,
  overtimeHours: 5
});
```

## 🎯 Future Enhancements

### Certificate Module
- **Blockchain Integration**: Immutable certificate storage on blockchain
- **Digital Signatures**: Cryptographic signatures for enhanced security
- **Template Designer**: Visual template designer interface
- **Advanced Analytics**: Certificate issuance and verification analytics

### Payroll Module
- **Banking Integration**: Direct integration with banking APIs for automated disbursement
- **Advanced Reporting**: More sophisticated analytics and reporting features
- **Multi-currency Support**: Support for different currencies and exchange rates
- **Loan Management**: Employee loan tracking and automatic deductions
- **Performance Bonuses**: Integration with performance management systems

---

## 🤝 Contributing

When extending these modules, please ensure:
1. **Follow existing patterns** in service architecture and error handling
2. **Add comprehensive tests** for new functionality
3. **Update API documentation** (Swagger specs included in routes)
4. **Consider security implications** for all new features
5. **Maintain audit trails** for all critical operations

Both modules are production-ready and follow enterprise-level security and compliance standards.