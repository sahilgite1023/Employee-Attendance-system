const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../utils/response');
const {
  getDashboardStats,
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getAttendanceReport,
  getLeaveReport,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin or HR role
router.use(protect);
router.use(authorize('admin', 'hr'));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard KPIs
 * @access  Private (Admin/HR)
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/admin/employees
 * @desc    Get all employees with filters
 * @access  Private (Admin/HR)
 */
router.get('/employees', getAllEmployees);

/**
 * @route   POST /api/admin/employees
 * @desc    Create new employee
 * @access  Private (Admin/HR)
 */
router.post(
  '/employees',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('designation').notEmpty().withMessage('Designation is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('roleId').isInt().withMessage('Valid role ID is required'),
  ],
  validate,
  createEmployee
);

/**
 * @route   PUT /api/admin/employees/:id
 * @desc    Update employee
 * @access  Private (Admin/HR)
 */
router.put('/employees/:id', updateEmployee);

/**
 * @route   DELETE /api/admin/employees/:id
 * @desc    Deactivate employee
 * @access  Private (Admin)
 */
router.delete('/employees/:id', authorize('admin'), deactivateEmployee);

/**
 * @route   GET /api/admin/reports/attendance
 * @desc    Generate attendance report
 * @access  Private (Admin/HR)
 */
router.get('/reports/attendance', getAttendanceReport);

/**
 * @route   GET /api/admin/reports/leave
 * @desc    Generate leave report
 * @access  Private (Admin/HR)
 */
router.get('/reports/leave', getLeaveReport);

module.exports = router;
