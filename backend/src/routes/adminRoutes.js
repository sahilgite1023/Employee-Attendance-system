const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../utils/response');
const {
  getDashboardStats,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  softDeactivateEmployee,
  getAttendanceReport,
  getLeaveReport,
} = require('../controllers/adminController');
const {
  getAllNetworks,
  addNetwork,
  updateNetwork,
  deleteNetwork,
  toggleNetwork,
  getIpAccessLogs,
} = require('../controllers/networkController');
const {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  bulkUpdateSettings,
  resetToDefaults,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

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
 * @route   GET /api/admin/employees/:id
 * @desc    Get employee by ID
 * @access  Private (Admin/HR)
 */
router.get('/employees/:id', getEmployeeById);

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
router.delete('/employees/:id', deactivateEmployee);

/**
 * @route   POST /api/admin/employees/:id/activate
 * @desc    Activate employee
 * @access  Private (Admin/HR)
 */
router.post('/employees/:id/activate', activateEmployee);

/**
 * @route   POST /api/admin/employees/:id/deactivate
 * @desc    Soft deactivate employee
 * @access  Private (Admin/HR)
 */
router.post('/employees/:id/deactivate', softDeactivateEmployee);

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

// ============================================
// NETWORK SECURITY ROUTES
// ============================================

/**
 * @route   GET /api/admin/networks
 * @desc    Get all allowed networks
 * @access  Private (Admin)
 */
router.get('/networks', getAllNetworks);

/**
 * @route   POST /api/admin/networks
 * @desc    Add a new allowed network
 * @access  Private (Admin)
 */
router.post(
  '/networks',
  [
    body('label').notEmpty().withMessage('Network label is required'),
    body('ip_or_cidr').notEmpty().withMessage('IP or CIDR is required'),
  ],
  validate,
  addNetwork
);

/**
 * @route   PUT /api/admin/networks/:id
 * @desc    Update an allowed network
 * @access  Private (Admin)
 */
router.put('/networks/:id', updateNetwork);

/**
 * @route   DELETE /api/admin/networks/:id
 * @desc    Delete an allowed network
 * @access  Private (Admin)
 */
router.delete('/networks/:id', deleteNetwork);

/**
 * @route   PATCH /api/admin/networks/:id/toggle
 * @desc    Toggle network active/inactive
 * @access  Private (Admin)
 */
router.patch('/networks/:id/toggle', toggleNetwork);

/**
 * @route   GET /api/admin/ip-logs
 * @desc    Get IP access logs (security audit)
 * @access  Private (Admin)
 */
router.get('/ip-logs', getIpAccessLogs);

// ============================================
// SETTINGS ROUTES
// ============================================

/**
 * @route   GET /api/admin/settings
 * @desc    Get all system settings
 * @access  Private (Admin)
 */
router.get('/settings', getAllSettings);

/**
 * @route   GET /api/admin/settings/:key
 * @desc    Get a specific setting by key
 * @access  Private (Admin)
 */
router.get('/settings/:key', getSettingByKey);

/**
 * @route   PUT /api/admin/settings/:key
 * @desc    Update a specific setting
 * @access  Private (Admin)
 */
router.put(
  '/settings/:key',
  [body('value').notEmpty().withMessage('Setting value is required')],
  validate,
  updateSetting
);

/**
 * @route   PUT /api/admin/settings/bulk
 * @desc    Update multiple settings at once
 * @access  Private (Admin)
 */
router.put('/settings-bulk/update', bulkUpdateSettings);

/**
 * @route   POST /api/admin/settings/reset
 * @desc    Reset all settings to default values
 * @access  Private (Admin)
 */
router.post('/settings/reset', resetToDefaults);

module.exports = router;
