# Employee Attendance & Leave Management System

A professional, enterprise-grade attendance and leave management system built with Node.js, PostgreSQL, and Next.js.

## 🏗️ Architecture

- **Backend**: Node.js + Express.js + PostgreSQL
- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Authentication**: JWT-based with role-based access control
- **APIs**: RESTful APIs for both web and mobile applications

## 📁 Project Structure

```
E-attendance/
├── backend/          # Node.js backend server
├── frontend/         # Next.js web application
└── README.md         # This file
```

## 🚀 Quick Start

See individual README files in `backend/` and `frontend/` directories for detailed setup instructions.

## 👥 User Roles

- **Employee**: View attendance, apply for leave, manage profile
- **Admin/HR**: Manage employees, approve leaves, generate reports

## 🔐 Security Features

- JWT authentication with token expiry
- IP-based network restriction (configurable)
- Role-based access control
- Secure password hashing with bcrypt

## 🌐 Deployment

### Development (Cloud)
- Backend: Render
- Database: Neon PostgreSQL
- Network restrictions: OFF

### Production (On-Premise)
- Office server deployment
- Local PostgreSQL
- Network restrictions: ON (office network only)

## 📱 Mobile App

The mobile application is developed separately. This system provides clean REST APIs for mobile integration.

## 📊 Core Features

- ✅ Real-time attendance tracking (Check-in/Check-out)
- 📅 Leave management with approval workflow
- 📈 Admin dashboard with KPIs and analytics
- 📄 Reports and data export (PDF/Excel)
- 👤 User profile management
- 🔔 Activity tracking and notifications

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt

**Frontend:**
- Next.js 14+ (App Router)
- Tailwind CSS
- React

## 📖 Documentation

- Backend API Documentation: `backend/API_DOCUMENTATION.md`
- Deployment Guide: `backend/DEPLOYMENT.md`

---

**Built with 💙 by professional engineering standards**
