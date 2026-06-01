# AI Context: Employee Attendance & Leave Management System

This document summarizes the full codebase for quick handoff to another AI or engineer. It reflects the current repository state and key implementation details.

---

## 1) Project Summary
**Goal:** A web-based attendance and leave management system with role-based access, reporting, and security controls (IP restriction + optional face verification).

**Core modules:**
- Employee attendance (check-in/check-out, history, stats)
- Leave management (apply, approve/reject, balance)
- Admin operations (employee management, dashboards, reports)
- Security (IP restriction + audit logs + face verification)

---

## 2) Tech Stack
**Frontend**
- Next.js (App Router), React 18
- Tailwind CSS, Recharts
- CSV export in UI
- Face recognition via `@vladmandic/face-api` (browser)

**Backend**
- Node.js + Express
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- Email via `nodemailer`

**Database**
- PostgreSQL 12+
- Base schema + migration scripts for IP security + face verification

---

## 3) Repository Structure (Top-Level)
```
Employee-Attendance-system/
├── backend/                     # Express API
├── frontend/                    # Next.js web app
├── README.md                    # High-level overview
├── PRODUCTION_DEPLOYMENT_GUIDE.md
├── PPT_README.md                # PPT slide content (added)
└── AI_CONTEXT_README.md         # This file (added)
```

---

## 4) Backend Overview

### 4.1 Entry Point & Core Middleware
- **Entry:** `backend/src/server.js`
  - CORS allowed origins: localhost + Netlify + `FRONTEND_URL`
  - Helmet, JSON parsing, logging in dev
  - Routes: `/api/auth`, `/api/attendance`, `/api/leave`, `/api/admin`
  - Health check: `/health`
  - IP debug: `/api/my-ip`

### 4.2 Configuration
- `backend/src/config/config.js`
  - JWT, attendance rules, leave rules, timezone
  - IP restriction flags (legacy + selective)
  - Email config
- `backend/src/config/database.js`
  - PG pool using `DATABASE_URL`

### 4.3 Authentication Flow
Files:
- `backend/src/controllers/authController.js`
- `backend/src/middleware/auth.js`
- `backend/src/utils/jwt.js`

Key behaviors:
- Login via `employeeId` + `password`
- JWT token issued on success
- Password reset flow with email + token
- Change password endpoint
- Audit logs for auth events

### 4.4 Attendance Logic
- **Controller:** `backend/src/controllers/attendanceController.js`
- **Routes:** `backend/src/routes/attendanceRoutes.js`
- **Key rules:**
  - Check-in creates a daily record, detects late status
  - Late threshold, half-day/full-day rules are configurable
  - Check-out calculates total hours and updates status
  - Settings are read from DB via `settingsCache` (fallback to env config)
- **Security enforcement:**
  - `dbIpRestriction('CHECK_IN'|'CHECK_OUT')` for check-in/out
  - Optional face verification (`faceVerification` middleware)
- **Endpoints:**
  - `POST /attendance/check-in`
  - `POST /attendance/check-out`
  - `GET /attendance/today`
  - `GET /attendance/current-session`
  - `GET /attendance/history`
  - `GET /attendance/stats`
  - `GET /attendance/all` (admin)
  - `POST /attendance/:id/revoke-check-out` (admin)

### 4.5 Leave Logic
- **Controller:** `backend/src/controllers/leaveController.js`
- **Routes:** `backend/src/routes/leaveRoutes.js`
- **Behavior:**
  - Calculates **calendar days** for record; **business days** for balance
  - Automatically chooses paid vs unpaid based on balance
  - Admin approves/rejects with remarks
- **Endpoints:**
  - `POST /leave/apply`
  - `GET /leave/my-requests`
  - `GET /leave/balance`
  - `GET /leave/all-requests` (admin)
  - `PUT /leave/:id/review` (admin)
  - `DELETE /leave/:id`

### 4.6 Admin Operations
- **Controller:** `backend/src/controllers/adminController.js`
- **Routes:** `backend/src/routes/adminRoutes.js`
- **Capabilities:**
  - Dashboard KPIs (present/late/on-leave/absent)
  - Employee CRUD + activation/deactivation
  - Attendance & leave reports
  - Revoke check-out from admin UI
  - Sends welcome emails with temp passwords

### 4.7 Security Features
- **IP Restriction (Attendance-only):**
  - `backend/src/middleware/dbIpRestriction.js`
  - IPs stored in `allowed_networks`
  - All check-in/out attempts logged to `ip_access_logs`
- **Face Verification:**
  - `backend/src/middleware/faceVerification.js`
  - `backend/src/controllers/faceController.js`
  - Uses 128‑float face descriptors, Euclidean distance matching
  - Feature toggle stored in `system_settings` (`ENABLE_FACE_VERIFICATION`)
- **Audit Logs:**
  - `backend/src/middleware/auditLog.js`
  - Writes to `audit_logs` on key actions

### 4.8 System Settings
- `backend/src/controllers/settingsController.js`
- `backend/src/utils/settingsCache.js`
- Settings are typed (`boolean`, `number`, `time`) and cached in memory
- Admin can update or reset settings via UI

### 4.9 Email
- `backend/src/utils/email.js`
- Password reset emails and welcome emails (new employee onboarding)

---

## 5) Database Schema & Migrations

### 5.1 Base Schema
File: `backend/database/schema.sql`

Core tables:
- `roles`
- `employees`
- `attendance`
- `leave_requests`
- `system_settings`
- `audit_logs`

Additional details:
- `employee_attendance_summary` and `employee_leave_summary` views
- `update_updated_at_column` trigger used across multiple tables

### 5.2 IP Security Migration
Files:
- `backend/database/migration_ip_security.sql`
- `backend/run-ip-migration.js`

Adds:
- `allowed_networks` (office networks)
- `ip_access_logs` (audit trail)
- `attendance.check_in_ip` and `attendance.check_out_ip`

### 5.3 Face Verification Migration
File: `backend/run-face-migration.js`

Adds:
- `employees.face_descriptor` (JSONB)
- `employees.face_enrolled_at`
- Security settings in `system_settings`:
  - `ENABLE_FACE_VERIFICATION`
  - `FACE_MATCH_THRESHOLD`

---

## 6) API Overview (High Level)
Routes are grouped by feature:
- **Auth:** `/auth/*`
- **Attendance:** `/attendance/*`
- **Leave:** `/leave/*`
- **Admin:** `/admin/*`

Full reference with request/response samples:
- `backend/API_DOCUMENTATION.md`
  - Contains sample testing credentials (sanitize for production use).

---

## 7) Frontend Overview

### 7.1 App Routes (Next.js App Router)
Directory: `frontend/src/app`

Employee routes:
- `/login`, `/forgot-password`, `/reset-password`
- `/dashboard`
- `/attendance`
- `/leave`
- `/profile`
- `/restricted`

Admin routes:
- `/admin/dashboard`
- `/admin/employees`
- `/admin/attendance`
- `/admin/leaves`
- `/admin/reports`
- `/admin/security`
- `/admin/settings`

### 7.2 Auth + API Integration
- `frontend/src/contexts/AuthContext.js`
  - Stores auth in cookies + localStorage
  - Redirects based on role
- `frontend/src/lib/api.js`
  - Axios wrapper with JWT interceptor
  - Redirects to `/restricted` on IP restriction

### 7.3 Face Recognition (UI)
- `frontend/src/components/common/FaceCapture.js`
  - Loads face‑api models from `frontend/public/models`
  - Captures 128‑float descriptors for enroll/verify

### 7.4 UI Features (Highlights)
- Employee dashboard: live timer, today’s status, stats, face check-in modal
- Attendance page: calendar view, stats, CSV export
- Leave page: apply/cancel, balance cards
- Admin dashboard: KPIs + shortcuts
- Admin attendance: filter, CSV export, revoke checkout
- Admin reports: attendance analytics + CSV export
- Admin security: allowed networks + IP logs
- Admin settings: attendance/leave/security configuration

---

## 8) Environment Variables

### Backend (`backend/.env.example`)
- `DATABASE_URL`, `JWT_SECRET`, `EMAIL_*`
- Attendance rules: `CHECK_IN_START_TIME`, `LATE_THRESHOLD_MINUTES`, etc.
- IP restriction flags: `ENABLE_SELECTIVE_IP_RESTRICTION`

### Frontend (`frontend/.env.example`)
- `NEXT_PUBLIC_API_URL`

---

## 9) Scripts & Commands

### Backend (`backend/package.json`)
- `npm run dev` – dev server
- `npm start` – production
- `npm test` – placeholder (fails with “no test specified”)

### Frontend (`frontend/package.json`)
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

Migration scripts:
- `node backend/run-ip-migration.js`
- `node backend/run-face-migration.js`

---

## 10) Deployment Docs
- `backend/DEPLOYMENT.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`

Covers Render/Neon/Vercel (cloud) and on‑premise deployment with PM2 + Nginx.

---

## 11) Assets
- `app_icon.png`
- `frontend/public/logo.png`
- `frontend/public/models` (face-api model files)

---

## 12) Validation Notes (Local)
Commands were run before edits:
- **Backend tests:** `npm test` → fails (no tests defined)
- **Frontend lint:** `npm run lint` → warnings only (React hooks deps, `<img>` usage)
- **Frontend build:** `npm run build` → failed due to blocked Google Fonts fetch

---

## 13) Security Notes
- Do **not** commit real secrets to `.env`
- Review `backend/API_DOCUMENTATION.md` before sharing externally
- Change any default credentials and JWT secrets for production
