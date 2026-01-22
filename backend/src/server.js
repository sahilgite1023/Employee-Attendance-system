const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/database');
const { PORT, NODE_ENV, FRONTEND_URL } = require('./config/config');
const ipRestriction = require('./middleware/ipRestriction');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// IP Restriction middleware (configurable via env)
app.use(ipRestriction);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-Attendance API Server',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✓ Database connection verified');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   E-ATTENDANCE API SERVER                      ║
╠════════════════════════════════════════════════╣
║   Environment: ${NODE_ENV.padEnd(32)} ║
║   Port: ${PORT.toString().padEnd(38)} ║
║   Server: http://localhost:${PORT.toString().padEnd(26)} ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

module.exports = app;
