# PPT Content: Employee Attendance & Leave Management System

Use the sections below as slide-by-slide content. Adjust slide count as needed.

---

## Slide 1 — Title
- **Employee Attendance & Leave Management System**
- Web-based attendance, leave, and admin management platform
- Built with **Next.js + Node.js + PostgreSQL**
- Prepared by: _<your name>_ | Date: _<presentation date>_

---

## Slide 2 — Problem Statement
- Manual attendance tracking is error-prone and time-consuming
- Limited visibility for HR and managers
- No centralized leave approval workflow
- Need secure access for on‑premise office environments

---

## Slide 3 — Solution Overview
- Centralized system for attendance, leave, and employee management
- Role-based access (Employee, HR/Admin)
- Secure, configurable rules for attendance and leave
- Scalable API for web + mobile integration

---

## Slide 4 — Key Objectives
- Real-time check-in/check-out tracking
- Automated leave balance and approvals
- Admin dashboards for KPIs and reporting
- Office-network security + optional face verification

---

## Slide 5 — Tech Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Security:** JWT auth, bcrypt password hashing, IP restriction, audit logs
- **Optional:** Face recognition using `@vladmandic/face-api`

---

## Slide 6 — System Architecture (High-Level)
- **Frontend (Next.js)** → REST API
- **Backend (Express)** → PostgreSQL
- **Admin tools** → settings + security management
- **Deployments:** cloud (Render + Neon + Vercel) or on‑premise

---

## Slide 7 — User Roles
- **Employee**
  - Check-in/check-out
  - View attendance history & stats
  - Apply/cancel leave
  - Manage profile & face enrollment
- **Admin/HR**
  - Employee CRUD, approvals, reports
  - Security & settings management
  - IP audit logs and network access rules

---

## Slide 8 — Attendance Workflow
- Employee checks in → attendance record created
- Late detection based on configured time thresholds
- Check-out calculates total hours and status (present/half-day)
- IP restrictions enforced for check-in/check-out
- Optional face verification before check-in

---

## Slide 9 — Leave Workflow
- Employee applies for leave (date range + reason)
- System calculates business days vs calendar days
- Leave type auto-determined (paid/unpaid)
- Admin approves/rejects with remarks
- Leave balances updated

---

## Slide 10 — Admin & HR Features
- Dashboard KPIs (present/late/on‑leave/absent)
- Employee management (create, update, activate/deactivate)
- Attendance monitoring + revoke checkout
- Reports with CSV export

---

## Slide 11 — Security & Compliance
- JWT-based authentication
- Password reset via email
- **IP-based attendance restriction**
  - Managed in admin “Security Settings”
  - Logs all allowed/blocked attempts
- **Audit logs** for sensitive actions
- **Face verification** toggle in system settings

---

## Slide 12 — Database Model (Core Tables)
- `employees`, `roles`
- `attendance`
- `leave_requests`
- `system_settings`
- `audit_logs`
- `allowed_networks` + `ip_access_logs` (security)

---

## Slide 13 — Reporting & Analytics
- Attendance statistics (present/late/absent/avg hours)
- Admin attendance reports by date/employee
- CSV export from admin and employee views

---

## Slide 14 — Deployment Options
**Cloud (Dev/Prod)**
- Render (backend) + Neon (PostgreSQL)
- Vercel (frontend)

**On‑Premise**
- Office server + PostgreSQL
- IP restriction enabled
- PM2 + Nginx for production

---

## Slide 15 — Demo Flow (Suggested)
1. Login (Employee)
2. Check-in (with face verification if enabled)
3. Attendance dashboard + history
4. Apply leave request
5. Login as Admin → approve leave
6. Admin dashboard + reports

---

## Slide 16 — Future Enhancements
- Mobile app integration
- PDF/Excel exports (if required)
- Geo-fencing or GPS-based attendance
- Advanced analytics and notifications

---

## Slide 17 — Q&A
- Thank you!
