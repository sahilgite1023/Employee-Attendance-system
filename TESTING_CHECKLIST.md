# E-Attendance System - Comprehensive Testing Checklist

## Important Notes
- **Production URL**: https://employee-ma.netlify.app
- **Backend API**: https://employee-attendance-system-1y0t.onrender.com/api
- **Admin Credentials**: `sahilgite511` / `sahilgite@2003`
- **Recent Fix**: Employee name concatenation in leave requests (commit 36113d4)
- **Deployment**: Wait 2-3 minutes for Render to complete backend deployment

---

## 🔧 Pre-Testing Setup

### 1. Wait for Deployment
- [ ] Check Render dashboard for deployment completion
- [ ] Verify backend is responding: https://employee-attendance-system-1y0t.onrender.com/api/health

### 2. Create Test Employee (if needed)
- [ ] Login as admin
- [ ] Go to Employees page
- [ ] Create new employee with test data
- [ ] **IMPORTANT**: Copy the employee ID and temporary password shown after creation
- [ ] Open incognito window for employee testing

---

## 👑 ADMIN FEATURES TESTING

### Login & Authentication
- [ ] **Test 1.1**: Login with admin credentials
  - Navigate to: https://employee-ma.netlify.app/login
  - Enter: `sahilgite511` / `sahilgite@2003`
  - Expected: Redirect to `/admin/dashboard`

- [ ] **Test 1.2**: Admin role check
  - Expected: Access to all admin pages (dashboard, employees, leaves, reports)
  - Try accessing: `/admin/dashboard`, `/admin/employees`, `/admin/leaves`, `/admin/reports`

### Dashboard Page (`/admin/dashboard`)
- [ ] **Test 2.1**: Dashboard loads successfully
  - Expected: No errors in console
  - Expected: Page displays without blank screens

- [ ] **Test 2.2**: Stats display correctly
  - Check: Total Employees count
  - Check: Present Today count
  - Check: On Leave count
  - Check: Pending Leave Requests count
  - Expected: All numbers should be visible (not "undefined" or "NaN")

- [ ] **Test 2.3**: Navigation links work
  - Click "Manage Employees" → Should go to `/admin/employees`
  - Click "Leave Requests" → Should go to `/admin/leaves`
  - Click "View Reports" → Should go to `/admin/reports`

### Employee Management (`/admin/employees`)
- [ ] **Test 3.1**: Employee list displays
  - Expected: Table shows all employees
  - Check columns: Employee ID, Name, Email, Department, Designation, Role, Actions
  - Expected: Names show as "First Last" (not undefined)

- [ ] **Test 3.2**: Create new employee
  - Click "Add New Employee"
  - Fill in: First Name, Last Name, Email, Phone, Designation, Department, Role
  - **DO NOT** enter password (it's auto-generated)
  - Click "Create Employee"
  - Expected: Success message with Employee ID and Temporary Password
  - Expected: **Copy these credentials** for employee testing
  - Expected: New employee appears in table

- [ ] **Test 3.3**: Employee ID format
  - Expected: Auto-generated IDs follow pattern: EMP001, EMP002, EMP003...
  - Expected: No "EMPNaN" or invalid IDs

- [ ] **Test 3.4**: Delete employee
  - Find a test employee in the table
  - Click "Delete" button
  - Confirm deletion
  - Expected: Employee is permanently removed from table
  - Expected: No "Deactivate" option (should be "Delete")

- [ ] **Test 3.5**: Search/filter employees
  - Try searching by name, email, or department
  - Expected: Table filters correctly

### Leave Management (`/admin/leaves`)
- [ ] **Test 4.1**: Leave requests page loads
  - Navigate to `/admin/leaves`
  - Expected: No console errors
  - Expected: Page displays "Leave Management" header

- [ ] **Test 4.2**: Filter tabs work
  - Click "Pending" → Shows only pending requests
  - Click "Approved" → Shows only approved requests
  - Click "Rejected" → Shows only rejected requests
  - Click "All" → Shows all requests

- [ ] **Test 4.3**: Leave requests display correctly
  - Check columns: Employee, Start Date, End Date, Days, Type, Reason, Status, Actions
  - Expected: Employee name shows as "First Last" (not undefined)
  - Expected: Employee ID shows below name
  - Expected: Dates are formatted properly
  - Expected: Leave type badge (Paid/Unpaid)
  - Expected: Status badge (Pending/Approved/Rejected)

- [ ] **Test 4.4**: Approve leave request
  - Find a pending leave request
  - Click "Approve" button
  - Confirm approval
  - Expected: Request status changes to "Approved"
  - Expected: Request moves to "Approved" filter

- [ ] **Test 4.5**: Reject leave request
  - Find a pending leave request
  - Click "Reject" button
  - Enter rejection reason (required)
  - Expected: Request status changes to "Rejected"
  - Expected: Rejection reason displays

- [ ] **Test 4.6**: No leave requests scenario
  - If no leave requests exist:
  - Expected: Message "No leave requests found"
  - **Note**: Need employee to apply leave first (see employee testing)

### Reports (`/admin/reports`)
- [ ] **Test 5.1**: Reports page loads
  - Navigate to `/admin/reports`
  - Expected: No console errors

- [ ] **Test 5.2**: Generate attendance report
  - Select date range
  - Filter by department (optional)
  - Click "Generate Report"
  - Expected: Attendance data displays

- [ ] **Test 5.3**: Generate leave report
  - Select date range
  - Filter by status (optional)
  - Click "Generate Report"
  - Expected: Leave summary displays

- [ ] **Test 5.4**: Export functionality
  - Test CSV export (if available)
  - Expected: File downloads with correct data

### Admin Navigation
- [ ] **Test 6.1**: Sidebar/menu navigation
  - Click "Dashboard" → Goes to `/admin/dashboard`
  - Click "Employees" → Goes to `/admin/employees`
  - Click "Leaves" → Goes to `/admin/leaves`
  - Click "Reports" → Goes to `/admin/reports`

- [ ] **Test 6.2**: Logout
  - Click "Logout" button
  - Expected: Redirects to `/login`
  - Expected: Cannot access admin pages without re-login

---

## 👤 EMPLOYEE FEATURES TESTING

**Prerequisites**: 
- Create test employee from admin panel
- Copy employee ID and temporary password
- Open incognito/private window to avoid session conflicts

### Login & Authentication
- [ ] **Test 7.1**: Employee login
  - Navigate to: https://employee-ma.netlify.app/login
  - Enter employee ID (e.g., EMP003) and temporary password
  - Expected: Redirect to `/dashboard` (not `/admin/dashboard`)

- [ ] **Test 7.2**: Employee role restriction
  - Try accessing: `/admin/dashboard`
  - Expected: Redirect to `/restricted` or error page
  - Expected: Cannot access admin pages

### Dashboard Page (`/dashboard`)
- [ ] **Test 8.1**: Dashboard loads
  - Expected: Employee dashboard displays
  - Check: Today's status, Attendance summary, Leave balance

- [ ] **Test 8.2**: Stats display
  - Check: Today's attendance status (Present/Absent/On Leave)
  - Check: This month's attendance stats
  - Check: Leave balance (Paid leaves, Unpaid leaves)
  - Expected: All numbers display correctly

### Attendance (`/attendance`)
- [ ] **Test 9.1**: Attendance page loads
  - Navigate to `/attendance`
  - Expected: Check-in/Check-out interface displays

- [ ] **Test 9.2**: Check-in
  - If not checked in today:
  - Click "Check In" button
  - Expected: Success message
  - Expected: Check-in time displays
  - Expected: "Check Out" button becomes available

- [ ] **Test 9.3**: Check-out
  - After checking in:
  - Click "Check Out" button
  - Expected: Success message
  - Expected: Check-out time displays
  - Expected: Total hours calculated

- [ ] **Test 9.4**: Attendance history
  - Scroll to attendance history section
  - Expected: Table shows past attendance records
  - Check columns: Date, Check In, Check Out, Total Hours, Status

- [ ] **Test 9.5**: Duplicate check-in prevention
  - Try checking in twice on same day
  - Expected: Error message "Already checked in today"

### Leave Application (`/leave`)
- [ ] **Test 10.1**: Leave page loads
  - Navigate to `/leave`
  - Expected: Leave application form displays
  - Expected: Leave balance shows at top

- [ ] **Test 10.2**: View leave balance
  - Check: Paid Leaves Available (out of 7)
  - Check: Unpaid Leaves Taken
  - Check: Pending Requests count
  - Expected: Numbers are accurate

- [ ] **Test 10.3**: Apply for leave
  - Fill in:
    - Start Date (future date)
    - End Date (after start date)
    - Reason (required)
  - Click "Apply Leave"
  - Expected: Success message
  - Expected: Leave request appears in "My Leave Requests" section
  - Expected: Status shows as "Pending"

- [ ] **Test 10.4**: Validation checks
  - Try submitting without reason → Expected: Error
  - Try end date before start date → Expected: Error
  - Try weekend-only dates → Expected: Warning or 0 days

- [ ] **Test 10.5**: My leave requests table
  - Check columns: Start Date, End Date, Days, Type, Reason, Status
  - Expected: All applied leaves show here
  - Expected: Status updates reflect (Pending → Approved/Rejected)

- [ ] **Test 10.6**: Cancel pending leave
  - Find pending leave request
  - Click "Cancel" button
  - Confirm cancellation
  - Expected: Request is removed or status changes to "Cancelled"

- [ ] **Test 10.7**: Leave visibility to admin
  - After applying leave as employee
  - Login as admin (different window)
  - Go to `/admin/leaves`
  - Expected: Employee's leave request should be visible
  - Expected: Admin can approve/reject it

### Profile (`/profile`)
- [ ] **Test 11.1**: Profile page loads
  - Navigate to `/profile`
  - Expected: Profile information displays

- [ ] **Test 11.2**: View profile details
  - Check: Name, Email, Phone, Department, Designation
  - Check: Employee ID, Date of Joining
  - Expected: All fields populated correctly

- [ ] **Test 11.3**: Update profile
  - Try updating: Phone, Email (if allowed)
  - Click "Update Profile"
  - Expected: Success message
  - Expected: Changes saved and reflected

- [ ] **Test 11.4**: Change password
  - Enter current password
  - Enter new password
  - Confirm new password
  - Click "Change Password"
  - Expected: Success message
  - **Test**: Logout and login with new password

### Employee Navigation
- [ ] **Test 12.1**: Navigation menu
  - Click "Dashboard" → Goes to `/dashboard`
  - Click "Attendance" → Goes to `/attendance`
  - Click "Leave" → Goes to `/leave`
  - Click "Profile" → Goes to `/profile`

- [ ] **Test 12.2**: Logout
  - Click "Logout"
  - Expected: Redirects to `/login`
  - Expected: Cannot access employee pages without re-login

---

## 🔍 PATH & ROUTING VERIFICATION

### URL Structure
- [ ] **Test 13.1**: Direct URL access
  - Type URLs directly in browser:
  - `/login` → Login page
  - `/dashboard` → Employee dashboard (requires login)
  - `/admin/dashboard` → Admin dashboard (requires admin role)
  - Expected: No 404 errors

- [ ] **Test 13.2**: Protected routes
  - Access protected pages without login
  - Expected: Redirect to `/login`

- [ ] **Test 13.3**: Role-based access
  - Employee accessing `/admin/*` → Redirect to `/restricted`
  - Admin accessing `/dashboard` → Should work (or redirect to `/admin/dashboard`)

### Navigation Flow
- [ ] **Test 14.1**: Back button works
  - Navigate through pages, then click browser back button
  - Expected: Previous page loads correctly

- [ ] **Test 14.2**: Refresh page
  - On any protected page, hit F5/refresh
  - Expected: Page reloads, session maintained

- [ ] **Test 14.3**: Logout and session
  - Logout, then click browser back button
  - Expected: Redirects to login (session cleared)

---

## 🐛 ERROR SCENARIOS

### Form Validations
- [ ] **Test 15.1**: Empty form submissions
  - Try submitting forms without required fields
  - Expected: Validation errors display

- [ ] **Test 15.2**: Invalid data formats
  - Invalid email format
  - Invalid phone number
  - Future dates where not allowed
  - Expected: Proper error messages

### Network Errors
- [ ] **Test 16.1**: API errors
  - If backend is down/slow:
  - Expected: Error message displays (not blank screen)
  - Expected: Loading states show properly

- [ ] **Test 16.2**: Session expiration
  - Wait for JWT to expire (check config)
  - Try making request
  - Expected: Redirect to login with message

### Edge Cases
- [ ] **Test 17.1**: Special characters
  - Try names with special chars: O'Brien, José, etc.
  - Expected: Handled correctly

- [ ] **Test 17.2**: Long text inputs
  - Very long reason for leave
  - Very long remarks
  - Expected: Truncated or wrapped properly

---

## 📊 KNOWN ISSUES TO VERIFY FIXED

- [x] ~~Admin dashboard showing undefined stats~~ → FIXED
- [x] ~~Employee creation showing EMPNaN~~ → FIXED
- [x] ~~Leaves page calling wrong API (getMyRequests instead of getAllRequests)~~ → FIXED
- [x] ~~Employee names showing undefined (role_name vs role)~~ → FIXED
- [x] ~~Password field in employee creation form~~ → FIXED (auto-generated now)
- [x] ~~Deactivate vs Delete confusion~~ → FIXED (permanent delete now)
- [ ] **Employee leave requests not visible to admin** → JUST FIXED (awaiting deployment)
- [ ] **Login issue with sahilgite511** → NEEDS INVESTIGATION

---

## 🚨 Critical Issues Found During Testing

### Issue Template
```
**Issue**: [Brief description]
**Page**: [URL or page name]
**Steps to Reproduce**: 
1. 
2. 
3. 
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Console Errors**: [Any errors in browser console]
**Priority**: [High/Medium/Low]
```

---

## ✅ FINAL CHECKLIST

- [ ] All admin features tested and working
- [ ] All employee features tested and working
- [ ] No console errors on any page
- [ ] All navigation paths work correctly
- [ ] Forms validate properly
- [ ] Error messages display correctly
- [ ] Loading states work properly
- [ ] Session management works (login/logout)
- [ ] Role-based access control works
- [ ] Data displays correctly (no undefined/NaN)
- [ ] Database operations work (create/read/update/delete)
- [ ] Leave workflow complete (apply → admin reviews → status updates)
- [ ] Attendance workflow complete (check-in → check-out → history)

---

## 📝 NOTES

- **Backend Deployment Time**: Allow 2-3 minutes after git push for Render to deploy
- **Frontend Deployment**: Netlify deploys within 1-2 minutes
- **Testing Best Practice**: Use incognito windows to test different user roles simultaneously
- **Employee Credentials**: Save the temporary password shown after employee creation (cannot retrieve later)
- **Database**: Production Neon PostgreSQL - changes persist across tests

---

## 🔗 USEFUL LINKS

- **Frontend**: https://employee-ma.netlify.app
- **Backend API**: https://employee-attendance-system-1y0t.onrender.com/api
- **GitHub Repo**: https://github.com/sahilgite1023/Employee-Attendance-system
- **Render Dashboard**: https://dashboard.render.com
- **Netlify Dashboard**: https://app.netlify.com

---

## 📞 SUPPORT

If you find issues:
1. Note the exact error message
2. Check browser console for errors
3. Check if backend is deployed (visit API health endpoint)
4. Report with: Page URL, Steps to reproduce, Expected vs Actual behavior

---

**Last Updated**: After commit 36113d4 (Employee name concatenation fix)
**Status**: ✅ Backend fix deployed, awaiting Render deployment completion
