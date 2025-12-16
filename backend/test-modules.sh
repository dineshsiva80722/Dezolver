#!/bin/bash

# Test script for Certificate and Payroll modules
# Make sure the backend server is running on port 8000

BASE_URL="http://localhost:8000/api"

echo "🔐 Getting admin token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token. Make sure admin user exists with password 'admin123'"
  exit 1
fi

echo "✅ Admin token obtained"

echo "🎓 Testing Certificate Templates..."

# Test template creation
echo "📝 Creating a new certificate template..."
curl -s -X POST $BASE_URL/certificates/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template for Demo",
    "description": "A beautiful template for course completion certificates",
    "template_config": {
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
      }
    }
  }' | jq -r '.message // .error // "Error creating template"'

echo "📋 Fetching templates..."
TEMPLATES=$(curl -s -X GET $BASE_URL/certificates/templates \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data | length')
echo "✅ Found $TEMPLATES templates"

echo "🎓 Generating a test certificate..."
# Generate certificate for admin user
CERT_RESPONSE=$(curl -s -X POST $BASE_URL/certificates/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "learner_id": "ad4d9620-2c77-4e76-9a2b-fc3a13738e87",
    "course_name": "Advanced Backend Development",
    "trigger_type": "course_completion",
    "completion_date": "2024-09-11"
  }')

CERT_ID=$(echo $CERT_RESPONSE | jq -r '.data.certificate_id')
if [ "$CERT_ID" != "null" ]; then
  echo "✅ Certificate generated with ID: $CERT_ID"
  
  # Test verification
  echo "🔍 Testing certificate verification..."
  VERIFY_RESULT=$(curl -s -X GET $BASE_URL/certificates/verify/$CERT_ID | jq -r '.success')
  if [ "$VERIFY_RESULT" = "true" ]; then
    echo "✅ Certificate verification working"
  else
    echo "❌ Certificate verification failed"
  fi
else
  echo "❌ Certificate generation failed"
  echo $CERT_RESPONSE | jq -r '.message // .error'
fi

echo ""
echo "👥 Testing Employee Management..."

# Get admin user ID for employee creation (using admin as example)
ADMIN_ID="ad4d9620-2c77-4e76-9a2b-fc3a13738e87"

# Check if employee record already exists
EXISTING_EMP=$(curl -s -X GET $BASE_URL/employees/user/$ADMIN_ID \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | jq -r '.success // false')

if [ "$EXISTING_EMP" = "false" ]; then
  echo "📝 Creating employee record for admin user..."
  EMP_RESPONSE=$(curl -s -X POST $BASE_URL/employees \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "user_id": "'$ADMIN_ID'",
      "job_title": "System Administrator",
      "department": "IT",
      "hire_date": "2024-01-01",
      "employment_type": "full_time",
      "payment_frequency": "monthly",
      "basic_salary": 100000
    }')
  
  EMP_ID=$(echo $EMP_RESPONSE | jq -r '.data.id')
  if [ "$EMP_ID" != "null" ]; then
    echo "✅ Employee created with ID: $EMP_ID"
  else
    echo "❌ Employee creation failed"
    echo $EMP_RESPONSE | jq -r '.message // .error'
  fi
else
  echo "✅ Employee record already exists"
  EMP_ID=$(curl -s -X GET $BASE_URL/employees/user/$ADMIN_ID \
    -H "Authorization: Bearer $TOKEN" | jq -r '.data.id')
fi

echo ""
echo "💰 Testing Payroll Management..."

if [ -n "$EMP_ID" ] && [ "$EMP_ID" != "null" ]; then
  echo "📊 Calculating payroll for employee..."
  PAYROLL_RESPONSE=$(curl -s -X POST $BASE_URL/payroll/calculate \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "employee_id": "'$EMP_ID'",
      "pay_period_start": "2024-09-01",
      "pay_period_end": "2024-09-30",
      "working_days": 22,
      "days_worked": 21,
      "overtime_hours": 5
    }')
  
  PAYROLL_ID=$(echo $PAYROLL_RESPONSE | jq -r '.data.id')
  if [ "$PAYROLL_ID" != "null" ]; then
    echo "✅ Payroll calculated with ID: $PAYROLL_ID"
    
    echo "📄 Generating salary slip..."
    SLIP_RESPONSE=$(curl -s -X POST $BASE_URL/payroll/$PAYROLL_ID/salary-slip/generate \
      -H "Authorization: Bearer $TOKEN")
    
    SLIP_URL=$(echo $SLIP_RESPONSE | jq -r '.data.salary_slip_url')
    if [ "$SLIP_URL" != "null" ]; then
      echo "✅ Salary slip generated: $SLIP_URL"
    else
      echo "❌ Salary slip generation failed"
      echo $SLIP_RESPONSE | jq -r '.message // .error'
    fi
  else
    echo "❌ Payroll calculation failed"
    echo $PAYROLL_RESPONSE | jq -r '.message // .error'
  fi
else
  echo "❌ No employee ID available for payroll testing"
fi

echo ""
echo "🎉 Module Testing Complete!"
echo ""
echo "📖 Available endpoints:"
echo "Certificate APIs: $BASE_URL/certificates/*"
echo "Employee APIs: $BASE_URL/employees/*"
echo "Payroll APIs: $BASE_URL/payroll/*"
echo ""
echo "🌐 Frontend URLs (update frontend config to point to localhost:8000):"
echo "Certificates: http://localhost:3000/certificates"
echo "Employees: http://localhost:3000/employees"
echo "Payroll: http://localhost:3000/payroll"
echo "Admin HR: http://localhost:3000/admin/hr"
echo "Admin Certificates: http://localhost:3000/admin/certificates"