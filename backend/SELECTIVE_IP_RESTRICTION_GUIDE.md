# Selective IP Restriction Implementation Guide

## Overview
This implementation provides **selective IP restriction** for the Employee Attendance System. Check-in/check-out endpoints enforce IP restrictions while all other endpoints remain accessible from any network.

---

## What Changed

### 1. **New Middleware File**
**Location:** `backend/src/middleware/selectiveIpRestriction.js`

- **Purpose:** Applies IP restrictions only when needed
- **Supports:** Exact IP matches and CIDR notation (e.g., `192.168.1.0/24`)
- **Configuration:** Uses `ENABLE_SELECTIVE_IP_RESTRICTION` and `ATTENDANCE_ALLOWED_IPS` from `.env`
- **Response:** Returns 403 Forbidden for unauthorized IPs

```javascript
// Applied only to check-in/check-out routes
router.post('/check-in', selectiveIpRestriction, protect, checkIn);
router.post('/check-out', selectiveIpRestriction, protect, checkOut);
```

### 2. **Updated Configuration** 
**Location:** `backend/src/config/config.js`

Added two new environment variables:
```javascript
// Selective Network Security (Attendance-only restriction)
ENABLE_SELECTIVE_IP_RESTRICTION: process.env.ENABLE_SELECTIVE_IP_RESTRICTION === 'true',
ATTENDANCE_ALLOWED_IPS: process.env.ATTENDANCE_ALLOWED_IPS ? process.env.ATTENDANCE_ALLOWED_IPS.split(',') : [],
```

### 3. **Modified Server Setup**
**Location:** `backend/src/server.js`

- **Removed:** Global `ipRestriction` middleware that blocked all endpoints
- **Benefit:** All endpoints now accessible from any network by default
- **Note:** Added comment explaining selective restriction applies per-route

### 4. **Enhanced Attendance Routes**
**Location:** `backend/src/routes/attendanceRoutes.js`

IP restrictions now applied **only** to:
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`

**No restrictions** on:
- `GET /api/attendance/today`
- `GET /api/attendance/history`
- `GET /api/attendance/stats`
- `GET /api/attendance/all` (admin)

### 5. **Updated Environment Configuration**
**Location:** `backend/.env.example`

```env
# Legacy (deprecated)
ENABLE_IP_RESTRICTION=false
ALLOWED_IPS=127.0.0.1,::1

# New Selective Restriction
ENABLE_SELECTIVE_IP_RESTRICTION=true
ATTENDANCE_ALLOWED_IPS=127.0.0.1,192.168.1.0/24
```

---

## File Structure

```
backend/
├── src/
│   ├── middleware/
│   │   ├── selectiveIpRestriction.js  ← NEW
│   │   ├── ipRestriction.js           (kept for backward compatibility)
│   │   └── auth.js
│   ├── routes/
│   │   └── attendanceRoutes.js        (UPDATED - now applies selective middleware)
│   ├── config/
│   │   └── config.js                  (UPDATED - new env variables)
│   └── server.js                      (UPDATED - removed global middleware)
└── .env.example                       (UPDATED - documented new config)
```

---

## Implementation Steps

### Step 1: Update Environment Variables
Edit your `.env` file:

```env
# Disable the legacy global restriction
ENABLE_IP_RESTRICTION=false

# Enable selective restriction (check-in/check-out only)
ENABLE_SELECTIVE_IP_RESTRICTION=true
ATTENDANCE_ALLOWED_IPS=192.168.1.100,192.168.1.0/24
```

### Step 2: Deploy Updated Files
Replace these files in production:
- `backend/src/middleware/selectiveIpRestriction.js` (new)
- `backend/src/routes/attendanceRoutes.js` (updated)
- `backend/src/config/config.js` (updated)
- `backend/src/server.js` (updated)
- `backend/.env.example` (reference only)

### Step 3: Restart Backend Server
```bash
npm restart
# or
pm2 restart attendance-api
```

### Step 4: Test the Implementation
```bash
# Test 1: Check-in with blocked IP (should fail if not in allowed list)
curl -X POST http://localhost:5000/api/attendance/check-in \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Test 2: Leave request from any IP (should work)
curl -X POST http://localhost:5000/api/leave/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Test 3: Attendance history from any IP (should work)
curl http://localhost:5000/api/attendance/history \
  -H "Authorization: Bearer <token>"
```

---

## Configuration Examples

### Example 1: Office Network Only
```env
ENABLE_SELECTIVE_IP_RESTRICTION=true
ATTENDANCE_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
```

### Example 2: Specific Locations
```env
ENABLE_SELECTIVE_IP_RESTRICTION=true
ATTENDANCE_ALLOWED_IPS=203.0.113.50,203.0.113.60,203.0.113.70
```

### Example 3: Disable Restriction (Development)
```env
ENABLE_SELECTIVE_IP_RESTRICTION=false
ATTENDANCE_ALLOWED_IPS=
```

### Example 4: VPN + Office Network
```env
ENABLE_SELECTIVE_IP_RESTRICTION=true
ATTENDANCE_ALLOWED_IPS=192.168.1.0/24,10.8.0.0/24
```

---

## How It Works

### Selective IP Restriction Flow

```
Request to /api/attendance/check-in
         ↓
Is ENABLE_SELECTIVE_IP_RESTRICTION true?
         ↓ YES
Get client IP from request headers
         ↓
Is IP in ATTENDANCE_ALLOWED_IPS list?
    ↓ YES         ↓ NO
  Continue    Return 403 Forbidden
```

### CIDR Notation Support

| Notation | Range |
|----------|-------|
| `192.168.1.0/24` | 192.168.1.0 - 192.168.1.255 |
| `10.0.0.0/8` | 10.0.0.0 - 10.255.255.255 |
| `203.0.113.100/32` | Single IP: 203.0.113.100 |

---

## Backward Compatibility

- **Legacy middleware** (`ipRestriction.js`) is **kept intact** for reference
- **Old config option** (`ENABLE_IP_RESTRICTION`) can still be used if needed
- **No breaking changes** to existing APIs
- **Other routes** (auth, leave, admin) remain unrestricted

---

## Security Benefits

1. **Targeted Protection:** Only sensitive endpoints (check-in/check-out) are restricted
2. **User Experience:** Users can access reports and requests from anywhere
3. **Flexibility:** Easy to adjust which endpoints need restriction
4. **Granular Control:** Supports both exact IPs and CIDR ranges
5. **Development Friendly:** Can be disabled for testing

---

## Monitoring & Logging

The middleware logs blocked access attempts:
```
Access denied from IP: 203.0.113.1 for check-in/check-out
```

Check logs for:
```bash
tail -f logs/error.log | grep "Access denied"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Check-in blocked but should be allowed | Add IP to `ATTENDANCE_ALLOWED_IPS` |
| Check-in not blocked when it should be | Verify `ENABLE_SELECTIVE_IP_RESTRICTION=true` |
| All endpoints blocked | Check if legacy `ENABLE_IP_RESTRICTION=true` |
| Can't determine client IP | Server behind proxy? Set `X-Real-IP` header |

---

## Migration from Global to Selective Restriction

If using the old global restriction:

**Before:**
```env
ENABLE_IP_RESTRICTION=true
ALLOWED_IPS=192.168.1.0/24
# ❌ Blocks ALL endpoints
```

**After:**
```env
ENABLE_IP_RESTRICTION=false
ENABLE_SELECTIVE_IP_RESTRICTION=true
ATTENDANCE_ALLOWED_IPS=192.168.1.0/24
# ✅ Only blocks check-in/check-out
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Restricted Endpoints** | POST /api/attendance/check-in, POST /api/attendance/check-out |
| **Unrestricted Endpoints** | All others (leave, profile, reports, admin) |
| **Configuration** | `ENABLE_SELECTIVE_IP_RESTRICTION`, `ATTENDANCE_ALLOWED_IPS` |
| **Files Modified** | 4 files (config, routes, server, new middleware) |
| **Backward Compatible** | Yes |
| **Production Ready** | Yes |
