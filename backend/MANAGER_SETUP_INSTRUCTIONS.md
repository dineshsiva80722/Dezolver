# Manager-Student Setup Instructions

## Current Situation

The manager-student hierarchy backend code is ready, but we need to add the database columns to the **actual database your app is using**.

## Quick Fix - Option 1: Use TypeORM Synchronize (Recommended for Dev)

1. **Stop your backend server** (Ctrl+C in the terminal)

2. **Temporarily enable schema sync** - Edit `src/config/database.ts` line 102:
   ```typescript
   synchronize: true,  // Change from false to true
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

4. **TypeORM will automatically add the columns!**

5. **Once server starts successfully, stop it and set sync back**:
   ```typescript
   synchronize: false,  // Change back to false
   ```

6. **Restart server**:
   ```bash
   npm run dev
   ```

## Quick Fix - Option 2: Manual SQL (For Production)

In your backend terminal, run these commands directly in psql:

```bash
# Connect to your database
psql -U postgres

# Then find which database has users:
\l
\c [your_database_name]

# Add the columns:
ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_by UUID;
ALTER TABLE users ADD CONSTRAINT fk_users_managed_by FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS added_by VARCHAR(20) DEFAULT 'self';
CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by) WHERE managed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_added_by ON users(added_by);
UPDATE users SET added_by = 'self' WHERE added_by IS NULL;

# Exit
\q
```

## Verification

Once fixed, test by logging in to your frontend. The login should work without the "column does not exist" error.

## What's Ready

All the code is implemented and ready:

### Backend ✅
- ✅ Manager Controller (`src/controllers/manager.controller.ts`)
- ✅ Admin Manager endpoints (`src/controllers/admin.controller.ts`)
- ✅ Manager routes (`/api/managers/*`)
- ✅ Admin routes (`/api/admin/managers`)
- ✅ User model updated with relationships

### API Endpoints Ready:

**Admin Endpoints:**
- `POST /api/admin/managers` - Create manager
- `GET /api/admin/managers` - List all managers
- `GET /api/admin/managers/:id` - Get manager details

**Manager Endpoints:**
- `POST /api/managers/students` - Add student
- `GET /api/managers/students` - List my students
- `GET /api/managers/students/:id` - Get student details
- `PUT /api/managers/students/:id` - Update student
- `POST /api/managers/students/:id/deactivate` - Deactivate student
- `POST /api/managers/students/:id/reactivate` - Reactivate student
- `GET /api/managers/stats` - Get statistics

### Database Schema:
```sql
users table:
  - managed_by UUID (references users.id)
  - added_by VARCHAR (self/manager/admin)
  - role VARCHAR (user/manager/admin)
```

## Testing After Fix

### 1. Create an Admin User (if needed)
```bash
cd /Users/folknallathambi/tf/techfolks/backend
node scripts/create-admin.ts
```

### 2. Login as Admin and Create Manager
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Use the token to create manager
curl -X POST http://localhost:8000/api/admin/managers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager1",
    "email": "manager1@test.com",
    "password": "Manager123!",
    "full_name": "Test Manager"
  }'
```

### 3. Login as Manager and Add Students
```bash
# Login as manager
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager1","password":"Manager123!"}'

# Add student
curl -X POST http://localhost:8000/api/managers/students \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "email": "student1@test.com",
    "password": "Student123!",
    "full_name": "Test Student"
  }'
```

## Troubleshooting

**If you still get "column does not exist" error:**

1. Check which database has your actual users:
   ```bash
   psql -U postgres -l
   ```

2. Connect to each database and check for users:
   ```bash
   psql -U postgres -d [database_name]
   \dt
   SELECT COUNT(*) FROM users;
   ```

3. Add the columns to the database that has users in it!

## Summary

Everything is coded and ready. You just need to add two columns to your actual database, then the entire manager-student hierarchy system will work perfectly!

