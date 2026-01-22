# API Documentation
## E-Attendance System REST API

**Production Base URL:** `https://employee-attendance-system-1y0t.onrender.com/api`

**Version:** 1.0.0

**Admin Credentials (for testing):**
- Username: `sahilgite511`
- Password: `sahilgite@2003`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Attendance Management](#attendance-management)
3. [Leave Management](#leave-management)
4. [Admin Operations](#admin-operations)
5. [Response Format](#response-format)
6. [Error Handling](#error-handling)
7. [Status Codes](#status-codes)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Login

**POST** `/auth/login`

Request:
```json
{
  "employeeId": "EMP001",
  "password": "your_password"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "employee_id": "EMP001",
      "email": "user@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "designation": "Software Engineer",
      "department": "Engineering",
      "role": "employee"
    }
  }
}
```

### Forgot Password

**POST** `/auth/forgot-password`

Request:
```json
{
  "email": "user@company.com"
}
```

Response:
```json
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent"
}
```

### Reset Password

**POST** `/auth/reset-password`

Request:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "new_secure_password"
}
```

Response:
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

### Change Password

**POST** `/auth/change-password` 🔒

Request:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

Response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Get Current User Profile

**GET** `/auth/me` 🔒

Response:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "employee_id": "EMP001",
    "email": "user@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "designation": "Software Engineer",
    "department": "Engineering",
    "date_of_joining": "2023-01-01",
    "paid_leaves_balance": 5,
    "unpaid_leaves_taken": 0,
    "role": "employee",
    "reporting_manager_name": "Jane Smith"
  }
}
```

### Update Profile

**PUT** `/auth/profile` 🔒

Request:
```json
{
  "phone": "+1234567890",
  "profile_photo_url": "https://example.com/photo.jpg"
}
```

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

### Logout

**POST** `/auth/logout` 🔒

Response:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Attendance Management

### Check In

**POST** `/attendance/check-in` 🔒

Request: No body required

Response:
```json
{
  "success": true,
  "message": "Checked in successfully",
  "data": {
    "id": 123,
    "employee_id": 1,
    "attendance_date": "2024-01-15",
    "check_in_time": "2024-01-15T09:05:00.000Z",
    "status": "present",
    "is_late": false,
    "late_by_minutes": 0
  }
}
```

### Check Out

**POST** `/attendance/check-out` 🔒

Request: No body required

Response:
```json
{
  "success": true,
  "message": "Checked out successfully",
  "data": {
    "id": 123,
    "check_out_time": "2024-01-15T18:30:00.000Z",
    "total_hours": 9.42,
    "status": "present"
  }
}
```

### Get Today's Attendance

**GET** `/attendance/today` 🔒

Response:
```json
{
  "success": true,
  "message": "Today's attendance retrieved",
  "data": {
    "attendance": {
      "id": 123,
      "check_in_time": "2024-01-15T09:05:00.000Z",
      "check_out_time": null,
      "status": "present"
    },
    "hasCheckedIn": true,
    "hasCheckedOut": false
  }
}
```

### Get Attendance History

**GET** `/attendance/history` 🔒

Query Parameters:
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `status` (optional): Filter by status (present, late, absent, half-day, on-leave)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 20)

Example: `/attendance/history?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20`

Response:
```json
{
  "success": true,
  "message": "Attendance history retrieved",
  "data": {
    "records": [
      {
        "id": 123,
        "attendance_date": "2024-01-15",
        "check_in_time": "2024-01-15T09:05:00.000Z",
        "check_out_time": "2024-01-15T18:30:00.000Z",
        "status": "present",
        "total_hours": 9.42,
        "is_late": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 95,
      "limit": 20
    }
  }
}
```

### Get Attendance Statistics

**GET** `/attendance/stats` 🔒

Response:
```json
{
  "success": true,
  "message": "Attendance statistics retrieved",
  "data": {
    "total_days": 100,
    "present_days": 85,
    "absent_days": 5,
    "late_days": 10,
    "half_days": 0,
    "leave_days": 0,
    "avg_hours": 8.5
  }
}
```

### Get All Attendance (Admin/HR Only)

**GET** `/attendance/all` 🔒 👑

Query Parameters:
- `date` (optional): Specific date (YYYY-MM-DD)
- `status` (optional): Filter by status
- `department` (optional): Filter by department
- `page`, `limit`: Pagination

Response:
```json
{
  "success": true,
  "message": "Attendance records retrieved",
  "data": [
    {
      "id": 123,
      "employee_id": "EMP001",
      "first_name": "John",
      "last_name": "Doe",
      "department": "Engineering",
      "attendance_date": "2024-01-15",
      "status": "present",
      "check_in_time": "2024-01-15T09:05:00.000Z",
      "total_hours": 9.42
    }
  ]
}
```

---

## Leave Management

### Apply for Leave

**POST** `/leave/apply` 🔒

Request:
```json
{
  "startDate": "2024-01-20",
  "endDate": "2024-01-22",
  "reason": "Family function"
}
```

Response:
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "id": 45,
    "employee_id": 1,
    "leave_type": "paid",
    "start_date": "2024-01-20",
    "end_date": "2024-01-22",
    "total_days": 3,
    "reason": "Family function",
    "status": "pending"
  }
}
```

### Get My Leave Requests

**GET** `/leave/my-requests` 🔒

Query Parameters:
- `status` (optional): Filter by status (pending, approved, rejected)
- `page`, `limit`: Pagination

Response:
```json
{
  "success": true,
  "message": "Leave requests retrieved",
  "data": [
    {
      "id": 45,
      "leave_type": "paid",
      "start_date": "2024-01-20",
      "end_date": "2024-01-22",
      "total_days": 3,
      "reason": "Family function",
      "status": "approved",
      "reviewed_by_name": "Jane Smith",
      "reviewed_at": "2024-01-16T10:30:00.000Z",
      "review_remarks": "Approved"
    }
  ]
}
```

### Get Leave Balance

**GET** `/leave/balance` 🔒

Response:
```json
{
  "success": true,
  "message": "Leave balance retrieved",
  "data": {
    "paidLeavesBalance": 5,
    "paidLeavesTotal": 7,
    "unpaidLeavesTaken": 0,
    "pendingRequests": 1,
    "approvedRequests": 2
  }
}
```

### Get All Leave Requests (Admin/HR Only)

**GET** `/leave/all-requests` 🔒 👑

Query Parameters:
- `status` (optional): Filter by status
- `department` (optional): Filter by department
- `page`, `limit`: Pagination

Response:
```json
{
  "success": true,
  "message": "Leave requests retrieved",
  "data": [
    {
      "id": 45,
      "employee_id": "EMP001",
      "first_name": "John",
      "last_name": "Doe",
      "department": "Engineering",
      "leave_type": "paid",
      "start_date": "2024-01-20",
      "end_date": "2024-01-22",
      "total_days": 3,
      "reason": "Family function",
      "status": "pending"
    }
  ]
}
```

### Review Leave Request (Admin/HR Only)

**PUT** `/leave/:id/review` 🔒 👑

Request:
```json
{
  "status": "approved",
  "remarks": "Approved. Enjoy your time."
}
```

Response:
```json
{
  "success": true,
  "message": "Leave request approved successfully"
}
```

### Cancel Leave Request

**DELETE** `/leave/:id` 🔒

Response:
```json
{
  "success": true,
  "message": "Leave request cancelled successfully"
}
```

---

## Admin Operations

### Get Dashboard Stats

**GET** `/admin/dashboard` 🔒 👑

Response:
```json
{
  "success": true,
  "message": "Dashboard stats retrieved",
  "data": {
    "totalEmployees": 50,
    "presentToday": 45,
    "lateToday": 3,
    "onLeaveToday": 2,
    "absentToday": 0,
    "pendingLeaveRequests": 5,
    "departments": [
      { "department": "Engineering", "count": 20 },
      { "department": "Marketing", "count": 10 }
    ]
  }
}
```

### Get All Employees

**GET** `/admin/employees` 🔒 👑

Query Parameters:
- `department` (optional): Filter by department
- `status` (optional): Filter by status (active, inactive)
- `search` (optional): Search by name, email, or employee ID
- `page`, `limit`: Pagination

Response:
```json
{
  "success": true,
  "message": "Employees retrieved",
  "data": [
    {
      "id": 1,
      "employee_id": "EMP001",
      "email": "user@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "designation": "Software Engineer",
      "department": "Engineering",
      "is_active": true,
      "paid_leaves_balance": 5,
      "role": "employee"
    }
  ]
}
```

### Create Employee

**POST** `/admin/employees` 🔒 👑

Request:
```json
{
  "email": "newuser@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "designation": "Product Manager",
  "department": "Product",
  "roleId": 3,
  "reportingManagerId": 1,
  "dateOfJoining": "2024-01-15"
}
```

Response:
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "employee": { ... },
    "temporaryPassword": "abc12345"
  }
}
```

### Update Employee

**PUT** `/admin/employees/:id` 🔒 👑

Request:
```json
{
  "designation": "Senior Product Manager",
  "department": "Product"
}
```

Response:
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": { ... }
}
```

### Deactivate Employee

**DELETE** `/admin/employees/:id` 🔒 👑

Response:
```json
{
  "success": true,
  "message": "Employee deactivated successfully"
}
```

### Get Attendance Report

**GET** `/admin/reports/attendance` 🔒 👑

Query Parameters:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `department` (optional): Filter by department
- `employeeId` (optional): Filter by employee ID

Response:
```json
{
  "success": true,
  "message": "Attendance report generated",
  "data": [
    {
      "employee_id": "EMP001",
      "first_name": "John",
      "last_name": "Doe",
      "department": "Engineering",
      "total_days": 20,
      "present": 18,
      "late": 2,
      "absent": 0,
      "avg_hours": 8.5
    }
  ]
}
```

### Get Leave Report

**GET** `/admin/reports/leave` 🔒 👑

Query Parameters:
- `status` (optional): Filter by status
- `department` (optional): Filter by department

Response:
```json
{
  "success": true,
  "message": "Leave report generated",
  "data": [
    {
      "employee_id": "EMP001",
      "first_name": "John",
      "last_name": "Doe",
      "department": "Engineering",
      "paid_leaves_balance": 5,
      "unpaid_leaves_taken": 0,
      "total_requests": 3,
      "pending": 1,
      "approved": 2,
      "rejected": 0
    }
  ]
}
```

---

## Response Format

All API responses follow this standard format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Error Handling

### Common Error Codes

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions or IP restricted |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

### IP Restriction Error

When accessing from outside office network (if enabled):

```json
{
  "success": false,
  "message": "Access restricted. This application is only accessible from the office network.",
  "code": "IP_RESTRICTED"
}
```

---

## Legend

- 🔒 = Requires authentication
- 👑 = Requires admin/HR role

---

## Mobile App Integration Notes

1. **Token Management**: Store JWT token securely (e.g., secure storage, AsyncStorage for React Native)
2. **Token Expiry**: Handle 401 responses to refresh or re-login
3. **Network Restriction**: Handle IP_RESTRICTED error gracefully
4. **Date Formats**: All dates are in ISO 8601 format (YYYY-MM-DD)
5. **Pagination**: Use page and limit parameters for large datasets
6. **Headers**: Include `Content-Type: application/json` for all POST/PUT requests

---

## Testing

**Production API:**
- Base URL: `https://employee-attendance-system-1y0t.onrender.com/api`
- Admin Login: `sahilgite511` / `sahilgite@2003`

**Example Login Request:**
```bash
curl -X POST https://employee-attendance-system-1y0t.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"sahilgite511","password":"sahilgite@2003"}'
```

**Example Authenticated Request:**
```bash
curl -X GET https://employee-attendance-system-1y0t.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

**Last Updated:** January 2026
**Version:** 1.0.0
