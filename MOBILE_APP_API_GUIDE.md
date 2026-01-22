# E-Attendance System API

**Base URL:** `https://employee-attendance-system-1y0t.onrender.com/api`

**Test Admin Login:**
- Username: `sahilgite511`
- Password: `sahilgite@2003`

---

## Authentication APIs

### Login
```
POST https://employee-attendance-system-1y0t.onrender.com/api/auth/login
Content-Type: application/json

{
  "employeeId": "sahilgite511",
  "password": "sahilgite@2003"
}
```

### Forgot Password
```
POST https://employee-attendance-system-1y0t.onrender.com/api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```
POST https://employee-attendance-system-1y0t.onrender.com/api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "new_password_here"
}
```

### Get Profile 🔒
```
GET https://employee-attendance-system-1y0t.onrender.com/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

### Update Profile 🔒
```
PUT https://employee-attendance-system-1y0t.onrender.com/api/auth/profile
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "phone": "+1234567890",
  "profile_photo_url": "https://example.com/photo.jpg"
}
```

### Change Password 🔒
```
POST https://employee-attendance-system-1y0t.onrender.com/api/auth/change-password
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### Logout 🔒
```
POST https://employee-attendance-system-1y0t.onrender.com/api/auth/logout
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Attendance APIs

### Check In 🔒
```
POST https://employee-attendance-system-1y0t.onrender.com/api/attendance/check-in
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

### Check Out 🔒
```
POST https://employee-attendance-system-1y0t.onrender.com/api/attendance/check-out
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

### Get Today's Attendance 🔒
```
GET https://employee-attendance-system-1y0t.onrender.com/api/attendance/today
Authorization: Bearer YOUR_TOKEN_HERE
```

### Get Attendance History 🔒
```
GET https://employee-attendance-system-1y0t.onrender.com/api/attendance/history?startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20
Authorization: Bearer YOUR_TOKEN_HERE
```

### Get Attendance Stats 🔒
```
GET https://employee-attendance-system-1y0t.onrender.com/api/attendance/stats
Authorization: Bearer YOUR_TOKEN_HERE
```

### Get All Employees Attendance (Admin) 🔒👑
```
GET https://employee-attendance-system-1y0t.onrender.com/api/attendance/all
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Leave APIs

### Apply for Leave 🔒
```
POST https://employee-attendance-system-1y0t.onrender.com/api/leave/apply
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "startDate": "2026-02-01",
  "endDate": "2026-02-03",
  "reason": "Family function",
  "leaveType": "paid"
}
```

### Get My Leave Requests 🔒
```
GET https://employee-attendance-system-1y0t.onrender.com/api/leave/my-requests
Authorization: Bearer YOUR_TOKEN_HERE
```

### Get Leave Balance 🔒
```
GET https://employee-attendance-system-1y0t.onrender.com/api/leave/balance
Authorization: Bearer YOUR_TOKEN_HERE
```

### Cancel Leave Request 🔒
```
POST https://employee-attendance-system-1y0t.onrender.com/api/leave/cancel/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```
*Replace `1` with actual leave request ID*

### Get All Leave Requests (Admin) 🔒👑
```
GET https://employee-attendance-system-1y0t.onrender.com/api/leave/all-requests
Authorization: Bearer YOUR_TOKEN_HERE
```

### Review Leave Request (Admin) 🔒👑
```
PUT https://employee-attendance-system-1y0t.onrender.com/api/leave/review/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "approved",
  "reviewNotes": "Approved for vacation"
}
```
*Replace `1` with actual leave request ID*
*Status values: "approved" or "rejected"*

---

## Admin APIs

### Get Dashboard Stats 🔒👑
```
GET https://employee-attendance-system-1y0t.onrender.com/api/admin/dashboard
Authorization: Bearer YOUR_TOKEN_HERE
```

### Get All Employees 🔒👑
```
GET https://employee-attendance-system-1y0t.onrender.com/api/admin/employees
Authorization: Bearer YOUR_TOKEN_HERE
```

### Create Employee 🔒👑
```
POST https://employee-attendance-system-1y0t.onrender.com/api/admin/employees
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "email": "employee@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "designation": "Software Engineer",
  "department": "Engineering",
  "roleId": 2
}
```
*roleId: 1=admin, 2=hr, 3=employee*

### Update Employee 🔒👑
```
PUT https://employee-attendance-system-1y0t.onrender.com/api/admin/employees/1
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "email": "updated@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "designation": "Senior Engineer",
  "department": "Engineering"
}
```
*Replace `1` with actual employee ID*

### Deactivate Employee 🔒👑
```
DELETE https://employee-attendance-system-1y0t.onrender.com/api/admin/employees/1
Authorization: Bearer YOUR_TOKEN_HERE
```
*Replace `1` with actual employee ID*

### Get Attendance Report 🔒👑
```
GET https://employee-attendance-system-1y0t.onrender.com/api/admin/attendance-report?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer YOUR_TOKEN_HERE
```

### Get Leave Report 🔒👑
```
GET https://employee-attendance-system-1y0t.onrender.com/api/admin/leave-report?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer YOUR_TOKEN_HERE
```

---

**Legend:**
- 🔒 = Requires authentication token
- 👑 = Admin/HR role required

**Response Format:**
All successful responses return:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

All error responses return:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```
