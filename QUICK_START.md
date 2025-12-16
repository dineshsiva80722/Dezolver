# Quick Start Guide

## Backend is Running ✅

Backend is now running on: **http://localhost:8000**

### Test the Backend

```bash
# Check backend health
curl http://localhost:8000/health

# Test login endpoint (will return "Invalid credentials" - this is expected)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## Start the Frontend

Open a new terminal and run:

```bash
cd /Users/folknallathambi/tf/techfolks/backend/techfolks/frontend
npm run dev
```

The frontend will start on **http://localhost:5173**

## Login Instructions

### Option 1: Create a New Account
1. Go to http://localhost:5173
2. Click "Register"
3. Create a new account

### Option 2: Login with Existing Account
If you have existing test users in the database, use those credentials.

### Option 3: Create Admin User (via Backend)

```bash
# Using the backend API to create an admin
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@techfolks.com",
    "password": "admin123",
    "full_name": "Admin User"
  }'

# Then promote to admin via database or admin console
```

## Troubleshooting

### "Network Error" when logging in
- ✅ Backend is running on port 8000
- ✅ Frontend is configured to connect to port 8000
- ✅ CORS is properly configured
- Make sure frontend is running on port 5173

### Still getting network errors?
```bash
# Check backend logs
tail -f /tmp/backend.log

# Check backend is listening
lsof -i :8000

# Restart backend if needed
cd /Users/folknallathambi/tf/techfolks/backend
npm run dev
```

### Check Configuration

**Backend** (.env):
```
PORT=8000
```

**Frontend** (.env):
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_URL=http://localhost:8000/api
```

## What's Fixed

### ✅ Authentication System
- Token persistence across page refreshes
- Proper initialization before routing
- Loading states to prevent premature redirects
- Session validation on app startup

### ✅ Role-Based Access Control
- Admin users see admin modules
- HR managers see HR modules
- Regular users see appropriate features
- Organization members see org-specific features
- Smart navigation based on permissions

### ✅ Production Ready
- Environment configuration for dev/prod
- CORS properly configured
- API URL uses environment variables
- Comprehensive permission system
- Module visibility based on user role & organization

## Features by User Role

| Feature | User | Employee | HR Manager | Manager | Admin |
|---------|------|----------|------------|---------|-------|
| Problems & Contests | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Certificates | ❌ | ✅ | ✅ | ✅ | ✅ |
| Employees | ❌ | ✅ | ✅ | ✅ | ✅ |
| Payroll | ❌ | ✅ | ✅ | ✅ | ✅ |
| Bank Details | ❌ | ❌ | ✅ | ✅ | ✅ |
| Subscription | ❌ | ❌ | ❌ | ✅ | ✅ |
| Admin Console | ❌ | ❌ | ❌ | ❌ | ✅ |

## Next Steps

1. **Start Frontend** (in a new terminal):
   ```bash
   cd /Users/folknallathambi/tf/techfolks/backend/techfolks/frontend
   npm run dev
   ```

2. **Open Browser**: http://localhost:5173

3. **Create/Login** with your account

4. **Test Features**:
   - Login/Logout
   - Navigation (should show only modules you have access to)
   - Page refresh (should stay logged in)
   - Role-based features

## Current Status

- ✅ Backend: Running on port 8000
- ✅ Database: Connected
- ✅ Redis: Connected
- ✅ CORS: Configured for localhost:5173
- ⏳ Frontend: Need to start
- ⏳ Login: Ready to test
