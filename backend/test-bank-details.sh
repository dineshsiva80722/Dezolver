#!/bin/bash

# Test script for Bank Details functionality
BASE_URL="http://localhost:8000/api"

echo "🔐 Getting admin token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin token obtained"

echo ""
echo "🏦 Testing Company Bank Details..."

# Get existing company bank details
echo "📋 Fetching existing company bank details..."
COMPANY_BANKS=$(curl -s -X GET $BASE_URL/company-bank \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $(echo $COMPANY_BANKS | jq -r '.message // .data | length // "Error"')"

# Get primary company bank details
echo "🎯 Fetching primary company bank details..."
PRIMARY_BANK=$(curl -s -X GET $BASE_URL/company-bank/primary \
  -H "Authorization: Bearer $TOKEN")
echo "Primary Bank: $(echo $PRIMARY_BANK | jq -r '.data.company_name // "Not found"')"

echo ""
echo "👥 Testing Employee Bank Details..."

# Get existing employee
EXISTING_EMP=$(curl -s -X GET $BASE_URL/employees/user/ad4d9620-2c77-4e76-9a2b-fc3a13738e87 \
  -H "Authorization: Bearer $TOKEN")
EMP_ID=$(echo $EXISTING_EMP | jq -r '.data.id // "null"')

if [ "$EMP_ID" != "null" ]; then
  echo "✅ Employee found with ID: $EMP_ID"
  
  # Check if bank details exist
  HAS_BANK=$(echo $EXISTING_EMP | jq -r '.data.bank_details.account_number // "none"')
  if [ "$HAS_BANK" != "none" ]; then
    echo "✅ Employee has bank details: HDFC Bank (****$(echo $HAS_BANK | tail -c 5))"
    
    # Test bank verification
    echo "🔍 Testing bank details verification..."
    VERIFY_RESPONSE=$(curl -s -X PATCH $BASE_URL/employees/$EMP_ID/bank-details/verify \
      -H "Authorization: Bearer $TOKEN")
    echo "Verification: $(echo $VERIFY_RESPONSE | jq -r '.message // .error')"
  else
    echo "ℹ️ Employee doesn't have bank details yet"
    
    # Add bank details
    echo "📝 Adding bank details to employee..."
    BANK_RESPONSE=$(curl -s -X PATCH $BASE_URL/employees/$EMP_ID \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "bank_details": {
          "account_number": "1234567890123456",
          "ifsc_code": "HDFC0001234",
          "bank_name": "HDFC Bank",
          "branch_name": "Koramangala Branch",
          "account_holder_name": "Admin User",
          "account_type": "savings",
          "upi_id": "admin@paytm",
          "nominee_name": "Jane Doe",
          "nominee_relation": "spouse"
        }
      }')
    
    if [ "$(echo $BANK_RESPONSE | jq -r '.success')" = "true" ]; then
      echo "✅ Bank details added successfully"
    else
      echo "❌ Failed to add bank details: $(echo $BANK_RESPONSE | jq -r '.message')"
      
      # Show validation errors if any
      ERRORS=$(echo $BANK_RESPONSE | jq -r '.errors[]?' 2>/dev/null)
      if [ -n "$ERRORS" ]; then
        echo "Validation errors:"
        echo "$ERRORS" | while read line; do
          echo "  • $line"
        done
      fi
    fi
  fi
else
  echo "❌ No employee found for testing bank details"
fi

echo ""
echo "🧪 Testing New Company Bank Creation..."

NEW_COMPANY_BANK=$(curl -s -X POST $BASE_URL/company-bank \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TechFolks Secondary Account",
    "account_holder_name": "TechFolks Private Limited",
    "account_number": "9876543210987654",
    "ifsc_code": "ICIC0001234",
    "bank_name": "ICICI Bank",
    "branch_name": "Electronic City Branch",
    "branch_address": "Electronic City, Bangalore - 560100",
    "account_type": "current",
    "gst_number": "29ABCDE1234F1Z5",
    "pan_number": "ABCDE1234F",
    "additional_details": {
      "contact_person": "Finance Manager",
      "phone_number": "+91-9876543210",
      "email": "finance@techfolks.com"
    }
  }')

if [ "$(echo $NEW_COMPANY_BANK | jq -r '.success')" = "true" ]; then
  echo "✅ New company bank account created successfully"
  NEW_BANK_ID=$(echo $NEW_COMPANY_BANK | jq -r '.data.id')
  
  # Test verification
  echo "🔍 Testing company bank verification..."
  VERIFY_COMPANY=$(curl -s -X PATCH $BASE_URL/company-bank/$NEW_BANK_ID/verify \
    -H "Authorization: Bearer $TOKEN")
  echo "Company bank verification: $(echo $VERIFY_COMPANY | jq -r '.message')"
else
  echo "❌ Failed to create company bank: $(echo $NEW_COMPANY_BANK | jq -r '.message')"
fi

echo ""
echo "📊 Bank Details Summary:"
echo "Company Banks: $(curl -s -X GET $BASE_URL/company-bank -H "Authorization: Bearer $TOKEN" | jq -r '.data | length')"
echo "Primary Account: $(curl -s -X GET $BASE_URL/company-bank/primary -H "Authorization: Bearer $TOKEN" | jq -r '.data.company_name // "None"')"

echo ""
echo "🎉 Bank Details Testing Complete!"
echo ""
echo "📖 Available Bank Management Features:"
echo "• Employee bank details with full validation"
echo "• Company bank account management"
echo "• Bank details verification system"
echo "• Primary account designation"
echo "• Support for Indian banking (IFSC, PAN, GST)"
echo "• UPI and nominee information"
echo ""
echo "🌐 Access Bank Management:"
echo "Employee Bank Details: http://localhost:3000/bank-details"
echo "Admin Bank Management: http://localhost:3000/admin/hr (Banking tab)"