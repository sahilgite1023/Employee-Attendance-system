const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceStats,
  getAllAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check in for the day
 * @access  Private (Employee)
 */
router.post('/check-in', protect, checkIn);

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check out for the day
 * @access  Private (Employee)
 */
router.post('/check-out', protect, checkOut);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance status
 * @access  Private (Employee)
 */
router.get('/today', protect, getTodayAttendance);

/**
 * @route   GET /api/attendance/history
 * @desc    Get attendance history with filters
 * @access  Private (Employee)
 */
router.get('/history', protect, getAttendanceHistory);

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private (Employee)
 */
router.get('/stats', protect, getAttendanceStats);

/**
 * @route   GET /api/attendance/all
 * @desc    Get all employees' attendance (Admin only)
 * @access  Private (Admin)
 */
router.get('/all', protect, authorize('admin'), getAllAttendance);

module.exports = router;
