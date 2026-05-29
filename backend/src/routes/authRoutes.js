const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../utils/response');
const {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  logout,
} = require('../controllers/authController');
const {
  enrollFace,
  removeFace,
  getFaceStatus,
} = require('../controllers/faceController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  validate,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (for logged in user)
 * @access  Private
 */
router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  validate,
  changePassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);

// ============================================
// FACE RECOGNITION ROUTES
// ============================================

/**
 * @route   GET /api/auth/face/status
 * @desc    Check if current user has face enrolled
 * @access  Private
 */
router.get('/face/status', protect, getFaceStatus);

/**
 * @route   POST /api/auth/face/enroll
 * @desc    Enroll face for current user
 * @access  Private
 */
router.post('/face/enroll', protect, enrollFace);

/**
 * @route   DELETE /api/auth/face/enroll
 * @desc    Remove face enrollment for current user
 * @access  Private
 */
router.delete('/face/enroll', protect, removeFace);

module.exports = router;
