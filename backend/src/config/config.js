require('dotenv').config();

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_RESET_EXPIRE: process.env.JWT_RESET_EXPIRE || '15m',

  // Network Security
  ENABLE_IP_RESTRICTION: process.env.ENABLE_IP_RESTRICTION === 'true',
  ALLOWED_IPS: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [],

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Timezone
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',

  // Attendance Rules
  CHECK_IN_START_TIME: process.env.CHECK_IN_START_TIME || '09:00',
  CHECK_IN_END_TIME: process.env.CHECK_IN_END_TIME || '09:30',
  LATE_THRESHOLD_MINUTES: parseInt(process.env.LATE_THRESHOLD_MINUTES) || 30,
  HALF_DAY_HOURS: parseInt(process.env.HALF_DAY_HOURS) || 4,
  FULL_DAY_HOURS: parseInt(process.env.FULL_DAY_HOURS) || 8,

  // Leave Rules
  ANNUAL_PAID_LEAVES: parseInt(process.env.ANNUAL_PAID_LEAVES) || 7,
};
