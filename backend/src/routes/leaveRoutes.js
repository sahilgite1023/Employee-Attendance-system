const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../utils/response');
const {
  applyLeave,
  getMyLeaveRequests,
  getLeaveBalance,
  getAllLeaveRequests,
  reviewLeaveRequest,
  cancelLeaveRequest,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/leave/apply
 * @desc    Apply for leave
 * @access  Private (Employee)
 */
router.post(
  '/apply',
  protect,
  [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ],
  validate,
  applyLeave
);

/**
 * @route   GET /api/leave/my-requests
 * @desc    Get employee's leave requests
 * @access  Private (Employee)
 */
router.get('/my-requests', protect, getMyLeaveRequests);

/**
 * @route   GET /api/leave/balance
 * @desc    Get leave balance
 * @access  Private (Employee)
 */
router.get('/balance', protect, getLeaveBalance);

/**
 * @route   GET /api/leave/all-requests
 * @desc    Get all leave requests (Admin)
 * @access  Private (Admin)
 */
router.get('/all-requests', protect, authorize('admin'), getAllLeaveRequests);

/**
 * @route   PUT /api/leave/:id/review
 * @desc    Approve or reject leave request
 * @access  Private (Admin)
 */
router.put(
  '/:id/review',
  protect,
  authorize('admin'),
  [body('status').isIn(['approved', 'rejected']).withMessage('Invalid status')],
  validate,
  reviewLeaveRequest
);

/**
 * @route   DELETE /api/leave/:id
 * @desc    Cancel leave request (only pending ones)
 * @access  Private (Employee)
 */
router.delete('/:id', protect, cancelLeaveRequest);

module.exports = router;
