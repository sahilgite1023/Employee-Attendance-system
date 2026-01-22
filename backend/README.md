# E-Attendance Backend

Node.js + Express.js + PostgreSQL backend server for the Employee Attendance & Leave Management System.

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb e_attendance
   
   # Run schema
   psql -d e_attendance -f database/schema.sql
   
   # (Optional) Run seed data
   psql -d e_attendance -f database/seed.sql
   ```

## 🏃 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will run on `http://localhost:5000` (or PORT specified in .env)

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── database/
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Seed data
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

### Key Configuration

- **Network Restriction**: Set `ENABLE_IP_RESTRICTION=true` for office deployment
- **JWT**: Change `JWT_SECRET` in production
- **Database**: Configure PostgreSQL connection
- **Email**: Set up SMTP for password reset

## 🌐 Deployment

### Development (Cloud - Render)

1. Create PostgreSQL database on Neon
2. Deploy to Render
3. Set environment variables
4. Set `ENABLE_IP_RESTRICTION=false`

### Production (On-Premise Office Server)

1. Install Node.js and PostgreSQL on office server
2. Clone repository
3. Install dependencies
4. Set up PostgreSQL database
5. Configure `.env` with:
   - `ENABLE_IP_RESTRICTION=true`
   - `ALLOWED_IPS=<your_office_network>`
6. Run with PM2 or systemd

See `DEPLOYMENT.md` for detailed instructions.

## 📖 API Documentation

See `API_DOCUMENTATION.md` for complete API reference.

## 🔧 Database Migrations

For schema updates, create migration files in `database/migrations/`.

## 🛡️ Security

- JWT authentication on all protected routes
- Password hashing with bcrypt
- IP-based network restriction
- SQL injection protection with parameterized queries
- CORS configuration
- Helmet security headers

## 📝 License

MIT
