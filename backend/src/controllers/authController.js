const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken, generateResetToken, verifyResetToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../middleware/auditLog');

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;

    // Validate input
    if (!employeeId || !password) {
      return sendError(res, 'Please provide employee ID and password', 400);
    }

    // Get user from database
    const result = await db.query(
      `SELECT e.*, r.name as role 
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       WHERE e.employee_id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return sendError(res, 'Your account has been deactivated. Please contact HR.', 401);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    // Create audit log
    await createAuditLog(user.id, 'LOGIN', 'auth', null, { employeeId }, req);

    // Remove sensitive data
    delete user.password_hash;
    delete user.reset_password_token;
    delete user.reset_password_expire;

    // Send response
    sendSuccess(res, 'Login successful', {
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Please provide email address', 400);
    }

    // Get user
    const result = await db.query(
      'SELECT id, email, first_name, last_name FROM employees WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not (security best practice)
      return sendSuccess(res, 'If that email exists, a password reset link has been sent');
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = generateResetToken(user.id);

    // Save token to database
    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.query(
      'UPDATE employees SET reset_password_token = $1, reset_password_expire = $2 WHERE id = $3',
      [resetToken, expireTime, user.id]
    );

    // Send email
    try {
      await sendPasswordResetEmail(
        user.email,
        resetToken,
        `${user.first_name} ${user.last_name}`
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Clear reset token
      await db.query(
        'UPDATE employees SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = $1',
        [user.id]
      );
      return sendError(res, 'Error sending email. Please try again later.', 500);
    }

    // Create audit log
    await createAuditLog(user.id, 'FORGOT_PASSWORD_REQUEST', 'auth', null, { email }, req);

    sendSuccess(res, 'If that email exists, a password reset link has been sent');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 'Please provide token and new password', 400);
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long', 400);
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyResetToken(token);
    } catch (error) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    // Check if token exists in database and not expired
    const result = await db.query(
      `SELECT id, reset_password_token, reset_password_expire 
       FROM employees 
       WHERE id = $1 AND reset_password_token = $2 AND reset_password_expire > NOW()`,
      [decoded.id, token]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await db.query(
      `UPDATE employees 
       SET password_hash = $1, reset_password_token = NULL, reset_password_expire = NULL 
       WHERE id = $2`,
      [hashedPassword, decoded.id]
    );

    // Create audit log
    await createAuditLog(decoded.id, 'PASSWORD_RESET', 'auth', null, {}, req);

    sendSuccess(res, 'Password reset successful. You can now login with your new password.');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (for logged in user)
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Please provide current and new password', 400);
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }

    // Get current user password
    const result = await db.query(
      'SELECT password_hash FROM employees WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(
      'UPDATE employees SET password_hash = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    // Create audit log
    await createAuditLog(req.user.id, 'PASSWORD_CHANGED', 'auth', null, {}, req);

    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT e.id, e.employee_id, e.email, e.first_name, e.last_name, e.phone,
              e.profile_photo_url, e.designation, e.department, e.date_of_joining,
              e.paid_leaves_balance, e.unpaid_leaves_taken, e.is_active,
              r.name as role,
              manager.first_name || ' ' || manager.last_name as reporting_manager_name
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       LEFT JOIN employees manager ON e.reporting_manager_id = manager.id
       WHERE e.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, 'Profile retrieved successfully', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { phone, profile_photo_url } = req.body;

    // Only allow updating specific fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (profile_photo_url !== undefined) {
      updates.push(`profile_photo_url = $${paramCount}`);
      values.push(profile_photo_url);
      paramCount++;
    }

    if (updates.length === 0) {
      return sendError(res, 'No fields to update', 400);
    }

    values.push(req.user.id);

    const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);

    // Create audit log
    await createAuditLog(req.user.id, 'PROFILE_UPDATED', 'employee', req.user.id, req.body, req);

    sendSuccess(res, 'Profile updated successfully', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal, server-side audit log)
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // Create audit log
    await createAuditLog(req.user.id, 'LOGOUT', 'auth', null, {}, req);

    sendSuccess(res, 'Logout successful');
  } catch (error) {
    next(error);
  }
};
