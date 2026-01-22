# Login Issue Debug Guide

## Issue: Unable to login with sahilgite511 / sahilgite@2003

### Possible Causes:

1. **Auto-Generated Password**: When employees are created via admin panel, the password is auto-generated (random 8 characters). The password "sahilgite@2003" might not be the correct auto-generated password.

2. **Account Not in Database**: The user "sahilgite511" may not exist in the production database.

3. **Wrong Credentials**: Employee ID or password might be incorrect.

### Debugging Steps:

#### Option 1: Login with Default Seed Users (Recommended)
Use these pre-seeded accounts to test the system:

**Admin Account:**
- Employee ID: `EMP001`
- Password: `Admin@123`
- Role: Admin
- Access: Full admin panel

**HR Account:**
- Employee ID: `EMP002`
- Password: `Hr@123`
- Role: HR
- Access: Full admin panel

**Employee Accounts:**
- Employee ID: `EMP003`, `EMP004`, `EMP005`, etc.
- Password: `Employee@123`
- Role: Employee
- Access: Employee features only

#### Option 2: Create New Test Account

1. Login as admin using `EMP001` / `Admin@123`
2. Go to Employees page
3. Click "Add New Employee"
4. Fill in the form (NO password field - it's auto-generated)
5. After clicking "Create", **COPY THE TEMPORARY PASSWORD SHOWN**
6. The success message will show:
   ```
   Employee ID: EMP006
   Temporary Password: abc12xyz
   ```
7. Use these exact credentials to login

#### Option 3: Reset Password for sahilgite511

If you want to use the specific account "sahilgite511":

**Manual Password Reset via Neon Console:**

1. Login to Neon PostgreSQL console
2. Find the user:
   ```sql
   SELECT id, employee_id, email, first_name, last_name, is_active 
   FROM employees 
   WHERE employee_id = 'sahilgite511';
   ```

3. If user exists, check if active:
   ```sql
   SELECT is_active FROM employees WHERE employee_id = 'sahilgite511';
   ```

4. If `is_active` is false, activate:
   ```sql
   UPDATE employees SET is_active = true WHERE employee_id = 'sahilgite511';
   ```

5. Generate new password hash:
   - Run locally in backend folder:
     ```bash
     cd backend
     node -e "const bcrypt = require('bcrypt'); bcrypt.hash('sahilgite@2003', 10).then(hash => console.log(hash));"
     ```
   - Copy the output hash

6. Update password in database:
   ```sql
   UPDATE employees 
   SET password_hash = 'PASTE_HASH_HERE' 
   WHERE employee_id = 'sahilgite511';
   ```

7. Try logging in again

#### Option 4: Use Forgot Password Feature

1. Go to login page
2. Click "Forgot Password"
3. Enter email associated with sahilgite511
4. Check email for reset link
5. Follow link to reset password

### Testing Login Flow

**Test with Admin Account:**
```
URL: https://employee-ma.netlify.app/login
Employee ID: EMP001
Password: Admin@123
Expected: Redirect to /admin/dashboard
```

**Test with Employee Account:**
```
URL: https://employee-ma.netlify.app/login
Employee ID: EMP003
Password: Employee@123
Expected: Redirect to /dashboard
```

### Common Login Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Invalid credentials" | Wrong employee ID or password | Double-check credentials, use seed users |
| "Account deactivated" | is_active = false | Activate account via database or create new one |
| "Network error" | Backend not responding | Check if Render backend is running |
| Blank page | Frontend routing issue | Check console for errors, verify deployment |

### Verification Checklist

- [ ] Backend is deployed and running on Render
- [ ] Frontend is deployed on Netlify
- [ ] Database connection is working
- [ ] Seed data is loaded (check with SQL query)
- [ ] User account exists in database
- [ ] User account is active (is_active = true)
- [ ] Password hash matches (if manually set)
- [ ] No console errors on login page
- [ ] No CORS errors in network tab

### Recommended Action

**For immediate testing, use the default admin account:**
- Employee ID: `EMP001`
- Password: `Admin@123`

This is guaranteed to work if the seed data is properly loaded. Then create new test users as needed and save their auto-generated passwords.

### SQL Queries for Debugging

**Check all users:**
```sql
SELECT employee_id, email, first_name || ' ' || last_name as name, 
       r.name as role, is_active
FROM employees e
JOIN roles r ON e.role_id = r.id
ORDER BY e.id;
```

**Check specific user:**
```sql
SELECT * FROM employees WHERE employee_id = 'sahilgite511';
```

**Check if roles exist:**
```sql
SELECT * FROM roles;
```

**Reset admin password to default:**
```sql
UPDATE employees 
SET password_hash = '$2b$10$Fnwfge7v7clQ3U5R9xlR9.Ocduj4rOM20/S3qv5G/ves1hP56.BOW'
WHERE employee_id = 'EMP001';
-- This sets password to: Admin@123
```

---

## Quick Fix: Use Default Accounts

**Instead of troubleshooting sahilgite511, just use these working accounts:**

✅ **Admin Testing**: `EMP001` / `Admin@123`  
✅ **Employee Testing**: `EMP003` / `Employee@123`

These are pre-configured and guaranteed to work. You can always create new accounts after logging in as admin.

