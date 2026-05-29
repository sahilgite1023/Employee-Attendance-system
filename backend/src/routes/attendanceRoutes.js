const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getCurrentSession,
  getAttendanceHistory,
  getAttendanceStats,
  getAllAttendance,
  revokeCheckOut,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { dbIpRestriction } = require('../middleware/dbIpRestriction');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check in for the day
 * @access  Private (Employee)
 * @middleware dbIpRestriction - DB-based IP restriction (admin-managed)
 */
router.post('/check-in', protect, dbIpRestriction('CHECK_IN'), checkIn);

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check out for the day
 * @access  Private (Employee)
 * @middleware dbIpRestriction - DB-based IP restriction (admin-managed)
 */
router.post('/check-out', protect, dbIpRestriction('CHECK_OUT'), checkOut);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance status
 * @access  Private (Employee)
 * @note    No IP restriction applied
 */
router.get('/today', protect, getTodayAttendance);

/**
 * @route   GET /api/attendance/current-session
 * @desc    Get active session for live timer
 * @access  Private (Employee)
 * @note    No IP restriction applied
 */
router.get('/current-session', protect, getCurrentSession);

/**
 * @route   GET /api/attendance/history
 * @desc    Get attendance history with filters
 * @access  Private (Employee)
 * @note    No IP restriction applied
 */
router.get('/history', protect, getAttendanceHistory);

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private (Employee)
 * @note    No IP restriction applied
 */
router.get('/stats', protect, getAttendanceStats);

/**
 * @route   GET /api/attendance/all
 * @desc    Get all employees' attendance (Admin only)
 * @access  Private (Admin)
 * @note    No IP restriction applied
 */
router.get('/all', protect, authorize('admin'), getAllAttendance);

/**
 * @route   POST /api/attendance/:id/revoke-check-out
 * @desc    Revoke checkout for a specific attendance record (Admin only)
 * @access  Private (Admin)
 * @note    No IP restriction applied
 */
router.post('/:id/revoke-check-out', protect, authorize('admin'), revokeCheckOut);

module.exports = router;
