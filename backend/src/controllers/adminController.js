const db = require('../config/database');
const bcrypt = require('bcrypt');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../middleware/auditLog');
const { generateEmployeeId, formatDate } = require('../utils/helpers');
const { sendWelcomeEmail } = require('../utils/email');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard KPIs
 * @access  Private (Admin/HR)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = formatDate(new Date());

    // Get total employees
    const totalEmployees = await db.query(
      'SELECT COUNT(*) FROM employees WHERE is_active = true'
    );

    // Get today's attendance stats
    const todayStats = await db.query(
      `SELECT 
         COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) as present_today,
         COUNT(CASE WHEN status = 'late' THEN 1 END) as late_today,
         COUNT(CASE WHEN status = 'on-leave' THEN 1 END) as on_leave_today,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_today
       FROM attendance
       WHERE attendance_date = $1`,
      [today]
    );

    // Get pending leave requests
    const pendingLeaves = await db.query(
      'SELECT COUNT(*) FROM leave_requests WHERE status = \'pending\''
    );

    // Get departments
    const departments = await db.query(
      `SELECT department, COUNT(*) as count 
       FROM employees 
       WHERE is_active = true 
       GROUP BY department`
    );

    sendSuccess(res, 'Dashboard stats retrieved', {
      totalEmployees: parseInt(totalEmployees.rows[0].count),
      presentToday: parseInt(todayStats.rows[0]?.present_today || 0),
      lateToday: parseInt(todayStats.rows[0]?.late_today || 0),
      onLeaveToday: parseInt(todayStats.rows[0]?.on_leave_today || 0),
      absentToday: parseInt(todayStats.rows[0]?.absent_today || 0),
      pendingLeaveRequests: parseInt(pendingLeaves.rows[0].count),
      departments: departments.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/employees
 * @desc    Get all employees with filters
 * @access  Private (Admin/HR)
 */
exports.getAllEmployees = async (req, res, next) => {
  try {
    const { department, status, search, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT e.id, e.employee_id, e.email, e.first_name, e.last_name, e.phone,
             e.designation, e.department, e.date_of_joining, e.is_active,
             e.paid_leaves_balance, e.unpaid_leaves_taken,
             r.name as role,
             manager.first_name || ' ' || manager.last_name as reporting_manager_name
      FROM employees e
      JOIN roles r ON e.role_id = r.id
      LEFT JOIN employees manager ON e.reporting_manager_id = manager.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (department) {
      query += ` AND e.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (status !== undefined) {
      const isActive = status === 'active';
      query += ` AND e.is_active = $${paramCount}`;
      params.push(isActive);
      paramCount++;
    }

    if (search) {
      query += ` AND (e.employee_id ILIKE $${paramCount} OR e.first_name ILIKE $${paramCount} OR e.last_name ILIKE $${paramCount} OR e.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY e.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    sendSuccess(res, 'Employees retrieved', result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/employees
 * @desc    Create new employee
 * @access  Private (Admin/HR)
 */
exports.createEmployee = async (req, res, next) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      designation,
      department,
      roleId,
      reportingManagerId,
      dateOfJoining,
    } = req.body;

    // Validation
    if (!email || !firstName || !lastName || !designation || !department || !roleId) {
      return sendError(res, 'Please provide all required fields', 400);
    }

    // Check if email already exists
    const existing = await db.query('SELECT id FROM employees WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return sendError(res, 'Email already exists', 400);
    }

    // Generate employee ID - only get EMP-formatted IDs
    const lastEmp = await db.query(
      "SELECT employee_id FROM employees WHERE employee_id LIKE 'EMP%' ORDER BY employee_id DESC LIMIT 1"
    );
    const newEmployeeId = generateEmployeeId(lastEmp.rows[0]?.employee_id);

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Insert employee
    const result = await db.query(
      `INSERT INTO employees 
       (employee_id, email, password_hash, first_name, last_name, phone, 
        designation, department, role_id, reporting_manager_id, date_of_joining, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
       RETURNING *`,
      [
        newEmployeeId,
        email,
        hashedPassword,
        firstName,
        lastName,
        phone || null,
        designation,
        department,
        roleId,
        reportingManagerId || null,
        dateOfJoining || new Date(),
      ]
    );

    const newEmployee = result.rows[0];

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, `${firstName} ${lastName}`, newEmployeeId, tempPassword).catch(
      (err) => console.error('Welcome email error:', err)
    );

    // Create audit log
    await createAuditLog(
      req.user.id,
      'EMPLOYEE_CREATED',
      'employee',
      newEmployee.id,
      { employeeId: newEmployeeId },
      req
    );

    // Remove sensitive data
    delete newEmployee.password_hash;

    sendSuccess(res, 'Employee created successfully', {
      employee: newEmployee,
      temporaryPassword: tempPassword,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/employees/:id
 * @desc    Update employee
 * @access  Private (Admin/HR)
 */
exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating password, email, employee_id through this endpoint
    delete updates.password_hash;
    delete updates.password;
    delete updates.email;
    delete updates.employee_id;

    if (Object.keys(updates).length === 0) {
      return sendError(res, 'No fields to update', 400);
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(id);

    const query = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return sendError(res, 'Employee not found', 404);
    }

    // Create audit log
    await createAuditLog(req.user.id, 'EMPLOYEE_UPDATED', 'employee', id, updates, req);

    sendSuccess(res, 'Employee updated successfully', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/employees/:id
 * @desc    Deactivate employee
 * @access  Private (Admin)
 */
exports.deactivateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM employees WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Employee not found', 404);
    }

    // Create audit log
    await createAuditLog(req.user.id, 'EMPLOYEE_DELETED', 'employee', id, {}, req);

    sendSuccess(res, 'Employee deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/reports/attendance
 * @desc    Generate attendance report
 * @access  Private (Admin/HR)
 */
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department, employeeId } = req.query;

    let query = `
      SELECT e.employee_id, e.first_name, e.last_name, e.department,
             COUNT(*) as total_days,
             COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
             COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
             COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
             COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) as half_day,
             COUNT(CASE WHEN a.status = 'on-leave' THEN 1 END) as on_leave,
             ROUND(AVG(a.total_hours), 2) as avg_hours
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id
      WHERE e.is_active = true
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND a.attendance_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND a.attendance_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (department) {
      query += ` AND e.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (employeeId) {
      query += ` AND e.employee_id = $${paramCount}`;
      params.push(employeeId);
      paramCount++;
    }

    query += ' GROUP BY e.id, e.employee_id, e.first_name, e.last_name, e.department ORDER BY e.employee_id';

    const result = await db.query(query, params);

    sendSuccess(res, 'Attendance report generated', result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/reports/leave
 * @desc    Generate leave report
 * @access  Private (Admin/HR)
 */
exports.getLeaveReport = async (req, res, next) => {
  try {
    const { status, department } = req.query;

    let query = `
      SELECT e.employee_id, e.first_name, e.last_name, e.department,
             e.paid_leaves_balance, e.unpaid_leaves_taken,
             COUNT(lr.id) as total_requests,
             COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending,
             COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved,
             COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected
      FROM employees e
      LEFT JOIN leave_requests lr ON e.id = lr.employee_id
      WHERE e.is_active = true
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND lr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (department) {
      query += ` AND e.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    query += ' GROUP BY e.id ORDER BY e.employee_id';

    const result = await db.query(query, params);

    sendSuccess(res, 'Leave report generated', result.rows);
  } catch (error) {
    next(error);
  }
};
