# Production Deployment Guide
## E-Attendance System

---

## Pre-Deployment Checklist

### 1. Environment Configuration

**Backend (.env file):**
```bash
# IMPORTANT: Never commit .env file to git!

# Update these values for production:
NODE_ENV=production
PORT=5000

# Use your actual database credentials
DATABASE_URL=postgresql://username:password@host:port/database

# Generate a strong JWT secret (64+ characters)
JWT_SECRET=<generate-a-very-long-random-string>

# Configure your production email
EMAIL_USER=your-production-email@domain.com
EMAIL_PASSWORD=your-app-specific-password

# Set your production frontend URL
FRONTEND_URL=https://your-domain.com

# Enable IP restriction for office network
ENABLE_IP_RESTRICTION=true
ALLOWED_IPS=your-office-ip-range
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

---

## Security Steps

### 1. Generate Strong JWT Secret
```bash
# Use this command to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Database Security
- ✅ Use strong passwords (16+ characters)
- ✅ Enable SSL/TLS connections
- ✅ Restrict database access to application IP only
- ✅ Regular backups configured
- ✅ Use connection pooling

### 3. Change Default Passwords
**IMPORTANT:** Change all default employee passwords before going live!

```sql
-- Update admin password
UPDATE employees 
SET password_hash = '$2b$10$NEW_HASHED_PASSWORD' 
WHERE employee_id = 'EMP001';
```

Generate hashed passwords:
```javascript
const bcrypt = require('bcrypt');
const password = 'YourNewSecurePassword@123';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

### 4. IP Restrictions
- Configure `ALLOWED_IPS` in .env with your office IP range
- Format: `192.168.1.0/24,10.0.0.0/8`

### 5. HTTPS/SSL
- ✅ Obtain SSL certificate (Let's Encrypt recommended)
- ✅ Configure reverse proxy (Nginx/Apache)
- ✅ Redirect HTTP to HTTPS
- ✅ Set secure cookie flags

---

## Deployment Steps

### Option 1: Cloud Deployment (Neon + Vercel)

**Database (Neon PostgreSQL):**
1. Create production database on Neon
2. Run schema: `backend/database/schema.sql`
3. Import seed data (if needed)
4. Get connection string

**Backend (Vercel/Render/Railway):**
1. Push code to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy

**Frontend (Vercel):**
1. Push code to GitHub
2. Connect to Vercel
3. Set `NEXT_PUBLIC_API_URL`
4. Deploy

### Option 2: Self-Hosted (Office Server)

**Server Requirements:**
- Node.js 18+
- PostgreSQL 12+
- Nginx (reverse proxy)
- SSL certificate
- Static IP

**Setup:**

1. **Install Dependencies:**
```bash
# Backend
cd backend
npm install --production

# Frontend
cd frontend
npm install
npm run build
```

2. **Configure Nginx:**
```nginx
# Backend API
server {
    listen 443 ssl;
    server_name api.your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Setup Process Manager (PM2):**
```bash
npm install -g pm2

# Backend
cd backend
pm2 start src/server.js --name attendance-api

# Frontend
cd frontend
pm2 start npm --name attendance-frontend -- start

# Save PM2 config
pm2 save
pm2 startup
```

---

## Post-Deployment

### 1. Create Admin Account
```sql
INSERT INTO employees (
    employee_id, email, password_hash, 
    first_name, last_name, designation, 
    department, role_id, is_active
) VALUES (
    'ADMIN001',
    'admin@yourcompany.com',
    '$2b$10$your_hashed_password',
    'Admin',
    'User',
    'System Administrator',
    'IT',
    1,  -- admin role
    true
);
```

### 2. Test All Features
- ✅ Login/Logout
- ✅ Attendance check-in/out
- ✅ Leave application
- ✅ Admin functions
- ✅ Reports generation
- ✅ Email notifications

### 3. Monitoring Setup
- Setup error logging (Sentry recommended)
- Configure uptime monitoring
- Setup database backups
- Monitor server resources

### 4. Backup Strategy
```bash
# Database backup (daily)
pg_dump -U username database_name > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DB_NAME="e_attendance"
pg_dump $DB_NAME | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

---

## Maintenance

### Regular Tasks
- **Daily:** Monitor error logs
- **Weekly:** Review attendance reports
- **Monthly:** Database backup verification
- **Quarterly:** Security audit
- **Yearly:** SSL certificate renewal

### Updating Application
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Restart services
pm2 restart all
```

---

## Troubleshooting

### Common Issues

**1. Cannot connect to database**
- Check DATABASE_URL in .env
- Verify database is running
- Check firewall rules

**2. Email not sending**
- Verify EMAIL_USER and EMAIL_PASSWORD
- Check email provider settings
- Test with email testing tool

**3. IP restriction blocking users**
- Verify ALLOWED_IPS configuration
- Check client IP address format
- Temporarily disable to test

**4. High server load**
- Check database query performance
- Review connection pool settings
- Monitor memory usage

---

## Support & Maintenance Contacts

- **Developer:** [Your Contact]
- **Database Admin:** [DBA Contact]
- **Server Admin:** [Server Contact]
- **Emergency:** [24/7 Contact]

---

## Security Incident Response

1. **Suspected breach:**
   - Immediately disable affected accounts
   - Change JWT_SECRET
   - Review audit logs
   - Notify admin team

2. **Database compromise:**
   - Restore from backup
   - Change all passwords
   - Review access logs

3. **DDoS attack:**
   - Enable rate limiting
   - Contact hosting provider
   - Review firewall rules

---

**Deployment Date:** ____________
**Deployed By:** ____________
**Version:** 1.0.0
**Status:** ☐ Development  ☐ Staging  ☐ Production
