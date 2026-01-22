# Deployment Guide
## E-Attendance System

This guide covers deployment for both **Development (Cloud)** and **Production (On-Premise)** environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Deployment (Cloud)](#development-deployment-cloud)
3. [Production Deployment (On-Premise)](#production-deployment-on-premise)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For All Deployments

- Node.js 18+ installed
- PostgreSQL 12+ installed (or access to cloud database)
- Git installed
- Basic command line knowledge

### For Production (On-Premise)

- Ubuntu/Debian server (or Windows Server)
- Static IP address
- Domain name (optional but recommended)
- SSL certificate (optional but recommended)

---

## Development Deployment (Cloud)

### A. Database Setup (Neon PostgreSQL)

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for free account

2. **Create Database**
   - Create new project
   - Note down connection string
   - Format: `postgresql://user:password@host/database`

3. **Run Schema**
   ```bash
   # Install PostgreSQL client
   npm install -g pg

   # Connect to database
   psql "postgresql://user:password@host/database"

   # Run schema file
   \i backend/database/schema.sql

   # (Optional) Run seed data
   \i backend/database/seed.sql
   ```

### B. Backend Deployment (Render)

1. **Prepare Repository**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**
   ```bash
   # Create GitHub repository
   # Add remote
   git remote add origin https://github.com/yourusername/e-attendance-backend.git
   git push -u origin main
   ```

3. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: e-attendance-api
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=<neon-host>
   DB_PORT=5432
   DB_NAME=<database-name>
   DB_USER=<database-user>
   DB_PASSWORD=<database-password>
   JWT_SECRET=<generate-strong-random-secret>
   JWT_EXPIRE=7d
   JWT_RESET_EXPIRE=15m
   ENABLE_IP_RESTRICTION=false
   FRONTEND_URL=https://your-frontend-url.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@company.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your API URL: `https://your-app.onrender.com`

### C. Frontend Deployment (Vercel)

1. **Configure Environment**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel

   # Follow prompts
   # Set environment variable when asked
   ```

   Or use Vercel Dashboard:
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Set environment variables
   - Deploy

3. **Update Backend CORS**
   - Update `FRONTEND_URL` in Render environment variables
   - Redeploy backend

---

## Production Deployment (On-Premise)

### A. Server Setup (Ubuntu)

1. **Update System**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   node --version  # Verify installation
   ```

3. **Install PostgreSQL**
   ```bash
   sudo apt install postgresql postgresql-contrib -y
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

4. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   ```

5. **Install Nginx (Optional - for reverse proxy)**
   ```bash
   sudo apt install nginx -y
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

### B. Database Setup (Local PostgreSQL)

1. **Create Database and User**
   ```bash
   sudo -u postgres psql

   # In PostgreSQL prompt:
   CREATE DATABASE e_attendance;
   CREATE USER attendance_user WITH ENCRYPTED PASSWORD 'secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE e_attendance TO attendance_user;
   \q
   ```

2. **Run Schema**
   ```bash
   # Navigate to project directory
   cd /path/to/project

   # Run schema
   psql -U attendance_user -d e_attendance -f backend/database/schema.sql

   # (Optional) Run seed data for testing
   psql -U attendance_user -d e_attendance -f backend/database/seed.sql
   ```

3. **Configure PostgreSQL Access**
   ```bash
   # Edit pg_hba.conf
   sudo nano /etc/postgresql/12/main/pg_hba.conf

   # Add line (for local connections):
   local   e_attendance    attendance_user                     md5

   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

### C. Backend Deployment

1. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/e-attendance.git
   cd e-attendance/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Edit `.env`:
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=e_attendance
   DB_USER=attendance_user
   DB_PASSWORD=secure_password_here
   JWT_SECRET=generate_very_strong_random_secret_here
   JWT_EXPIRE=7d
   JWT_RESET_EXPIRE=15m
   
   # IMPORTANT: Enable IP restriction for office network
   ENABLE_IP_RESTRICTION=true
   ALLOWED_IPS=192.168.1.0/24
   
   FRONTEND_URL=http://localhost:3000
   
   # Email configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@company.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=hr@company.com
   ```

4. **Start with PM2**
   ```bash
   pm2 start src/server.js --name e-attendance-api
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

5. **Verify**
   ```bash
   pm2 status
   pm2 logs e-attendance-api

   # Test API
   curl http://localhost:5000/health
   ```

### D. Frontend Deployment

1. **Navigate to Frontend**
   ```bash
   cd /var/www/e-attendance/frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   nano .env.local
   ```

   Edit `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Start with PM2**
   ```bash
   pm2 start npm --name e-attendance-web -- start
   pm2 save
   ```

6. **Verify**
   ```bash
   pm2 status
   curl http://localhost:3000
   ```

### E. Nginx Configuration (Optional but Recommended)

1. **Create Nginx Configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/e-attendance
   ```

   Add:
   ```nginx
   # Backend API
   server {
       listen 80;
       server_name api.yourcompany.local;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_cache_bypass $http_upgrade;
       }
   }

   # Frontend Web App
   server {
       listen 80;
       server_name attendance.yourcompany.local;

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

2. **Enable Configuration**
   ```bash
   sudo ln -s /etc/nginx/sites-available/e-attendance /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **Update DNS**
   - Add DNS entries in your office DNS server
   - Point to server IP

### F. Firewall Configuration

1. **Configure UFW**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS (if using SSL)
   sudo ufw enable
   sudo ufw status
   ```

### G. SSL Certificate (Production Recommended)

1. **Using Let's Encrypt (if domain is public)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.yourcompany.com -d attendance.yourcompany.com
   ```

2. **Using Self-Signed Certificate (for internal network)**
   ```bash
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/nginx-selfsigned.key \
     -out /etc/ssl/certs/nginx-selfsigned.crt

   # Update Nginx config to use SSL
   ```

---

## Database Backup

### Automated Backup Script

Create backup script:

```bash
sudo nano /usr/local/bin/backup-attendance-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/e-attendance"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U attendance_user e_attendance > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-attendance-db.sh
```

Schedule with cron:
```bash
sudo crontab -e

# Add line (daily backup at 2 AM):
0 2 * * * /usr/local/bin/backup-attendance-db.sh >> /var/log/attendance-backup.log 2>&1
```

---

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# View specific app logs
pm2 logs e-attendance-api
pm2 logs e-attendance-web
```

### Database Monitoring

```bash
# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='e_attendance';"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('e_attendance'));"
```

---

## Troubleshooting

### Backend Not Starting

1. Check logs:
   ```bash
   pm2 logs e-attendance-api
   ```

2. Check database connection:
   ```bash
   psql -U attendance_user -d e_attendance -h localhost
   ```

3. Verify environment variables:
   ```bash
   cat backend/.env
   ```

### Frontend Not Loading

1. Check build:
   ```bash
   npm run build
   ```

2. Check API connection:
   ```bash
   curl http://localhost:5000/health
   ```

### IP Restriction Issues

1. Find your IP:
   ```bash
   curl ifconfig.me
   ```

2. Update `.env`:
   ```
   ALLOWED_IPS=your.ip.address/32,192.168.1.0/24
   ```

3. Restart backend:
   ```bash
   pm2 restart e-attendance-api
   ```

### Database Connection Errors

1. Check PostgreSQL status:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check pg_hba.conf:
   ```bash
   sudo cat /etc/postgresql/12/main/pg_hba.conf
   ```

3. Test connection:
   ```bash
   psql -U attendance_user -d e_attendance -h localhost
   ```

---

## Maintenance

### Update Application

```bash
cd /var/www/e-attendance

# Pull latest code
git pull origin main

# Backend
cd backend
npm install
pm2 restart e-attendance-api

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart e-attendance-web
```

### Database Migration

```bash
# Backup first!
/usr/local/bin/backup-attendance-db.sh

# Run migration
psql -U attendance_user -d e_attendance -f migrations/migration_001.sql
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Generate strong JWT secret
- [ ] Enable IP restriction in production
- [ ] Set up SSL certificate
- [ ] Configure firewall
- [ ] Set up automated backups
- [ ] Regularly update system packages
- [ ] Monitor application logs
- [ ] Use strong email passwords
- [ ] Restrict SSH access

---

## Support

For issues or questions:
- Check logs: `pm2 logs`
- Review documentation
- Check API health: `/health` endpoint

---

**Last Updated:** January 2026
**Version:** 1.0.0
