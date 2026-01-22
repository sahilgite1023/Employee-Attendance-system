const nodemailer = require('nodemailer');
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM,
  FRONTEND_URL,
} = require('../config/config');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${options.fromName || 'E-Attendance System'} <${EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          <p><strong>This link will expire in 15 minutes.</strong></p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} E-Attendance System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request
    
    Hello ${userName},
    
    We received a request to reset your password. Click the link below to create a new password:
    
    ${resetUrl}
    
    This link will expire in 15 minutes.
    
    If you didn't request a password reset, please ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - E-Attendance System',
    html,
    text,
  });
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (email, userName, employeeId, tempPassword) => {
  const loginUrl = `${FRONTEND_URL}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to E-Attendance System</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <div class="credentials">
            <p><strong>Employee ID:</strong> ${employeeId}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p><strong>⚠️ Important:</strong> Please change your password after first login for security purposes.</p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login Now</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} E-Attendance System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to E-Attendance System',
    html,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
