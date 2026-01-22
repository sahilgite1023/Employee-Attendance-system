const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../middleware/auditLog');
const { calculateBusinessDays } = require('../utils/helpers');
const { ANNUAL_PAID_LEAVES } = require('../config/config');

/**
 * @route   POST /api/leave/apply
 * @desc    Apply for leave
 * @access  Private (Employee)
 */
exports.applyLeave = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const { startDate, endDate, reason } = req.body;

    // Validation
    if (!startDate || !endDate || !reason) {
      return sendError(res, 'Please provide start date, end date, and reason', 400);
    }

    // Check if end date is after start date
    if (new Date(endDate) < new Date(startDate)) {
      return sendError(res, 'End date must be after start date', 400);
    }

    // Calculate total days (business days)
    const totalDays = calculateBusinessDays(startDate, endDate);

    if (totalDays === 0) {
      return sendError(res, 'Leave period must include at least one working day', 400);
    }

    // Get employee's leave balance
    const empResult = await db.query(
      'SELECT paid_leaves_balance, unpaid_leaves_taken FROM employees WHERE id = $1',
      [employeeId]
    );

    const employee = empResult.rows[0];

    // Determine leave type (paid or unpaid)
    let leaveType = 'paid';
    if (employee.paid_leaves_balance < totalDays) {
      leaveType = 'unpaid';
    }

    // Insert leave request
    const result = await db.query(
      `INSERT INTO leave_requests 
       (employee_id, leave_type, start_date, end_date, total_days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [employeeId, leaveType, startDate, endDate, totalDays, reason]
    );

    // Create audit log
    await createAuditLog(
      employeeId,
      'LEAVE_APPLIED',
      'leave',
      result.rows[0].id,
      { startDate, endDate, totalDays, leaveType },
      req
    );

    sendSuccess(res, 'Leave request submitted successfully', result.rows[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/leave/my-requests
 * @desc    Get employee's leave requests
 * @access  Private (Employee)
 */
exports.getMyLeaveRequests = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT lr.*, 
             reviewer.first_name || ' ' || reviewer.last_name as reviewed_by_name
      FROM leave_requests lr
      LEFT JOIN employees reviewer ON lr.reviewed_by = reviewer.id
      WHERE lr.employee_id = $1
    `;
    const params = [employeeId];
    let paramCount = 2;

    if (status) {
      query += ` AND lr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY lr.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    sendSuccess(res, 'Leave requests retrieved', result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/leave/balance
 * @desc    Get leave balance
 * @access  Private (Employee)
 */
exports.getLeaveBalance = async (req, res, next) => {
  try {
    const employeeId = req.user.id;

    const result = await db.query(
      `SELECT paid_leaves_balance, unpaid_leaves_taken,
              (SELECT COUNT(*) FROM leave_requests WHERE employee_id = $1 AND status = 'pending') as pending_requests,
              (SELECT COUNT(*) FROM leave_requests WHERE employee_id = $1 AND status = 'approved') as approved_requests
       FROM employees
       WHERE id = $1`,
      [employeeId]
    );

    const balance = result.rows[0];

    sendSuccess(res, 'Leave balance retrieved', {
      paidLeavesBalance: balance.paid_leaves_balance,
      paidLeavesTotal: ANNUAL_PAID_LEAVES,
      unpaidLeavesTaken: balance.unpaid_leaves_taken,
      pendingRequests: parseInt(balance.pending_requests),
      approvedRequests: parseInt(balance.approved_requests),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/leave/all-requests
 * @desc    Get all leave requests (Admin/HR)
 * @access  Private (Admin/HR)
 */
exports.getAllLeaveRequests = async (req, res, next) => {
  try {
    const { status, department, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT lr.*, 
             e.employee_id, e.first_name, e.last_name, e.department, e.designation,
             reviewer.first_name || ' ' || reviewer.last_name as reviewed_by_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees reviewer ON lr.reviewed_by = reviewer.id
      WHERE 1=1
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

    query += ' ORDER BY lr.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    sendSuccess(res, 'Leave requests retrieved', result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/leave/:id/review
 * @desc    Approve or reject leave request
 * @access  Private (Admin/HR)
 */
exports.reviewLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const reviewerId = req.user.id;

    // Validation
    if (!status || !['approved', 'rejected'].includes(status)) {
      return sendError(res, 'Invalid status. Must be "approved" or "rejected"', 400);
    }

    // Get leave request
    const leaveResult = await db.query(
      `SELECT lr.*, e.paid_leaves_balance, e.unpaid_leaves_taken
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = $1`,
      [id]
    );

    if (leaveResult.rows.length === 0) {
      return sendError(res, 'Leave request not found', 404);
    }

    const leave = leaveResult.rows[0];

    if (leave.status !== 'pending') {
      return sendError(res, 'This leave request has already been reviewed', 400);
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Update leave request
      await db.query(
        `UPDATE leave_requests 
         SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_remarks = $3
         WHERE id = $4`,
        [status, reviewerId, remarks || null, id]
      );

      // If approved, update employee's leave balance
      if (status === 'approved') {
        if (leave.leave_type === 'paid') {
          await db.query(
            'UPDATE employees SET paid_leaves_balance = paid_leaves_balance - $1 WHERE id = $2',
            [leave.total_days, leave.employee_id]
          );
        } else {
          await db.query(
            'UPDATE employees SET unpaid_leaves_taken = unpaid_leaves_taken + $1 WHERE id = $2',
            [leave.total_days, leave.employee_id]
          );
        }

        // Mark attendance as on-leave for approved dates
        const currentDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);

        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Check if attendance already exists for this date
          const existingAttendance = await db.query(
            'SELECT id FROM attendance WHERE employee_id = $1 AND attendance_date = $2',
            [leave.employee_id, dateStr]
          );

          if (existingAttendance.rows.length === 0) {
            // Insert on-leave attendance
            await db.query(
              `INSERT INTO attendance (employee_id, attendance_date, status)
               VALUES ($1, $2, 'on-leave')`,
              [leave.employee_id, dateStr]
            );
          } else {
            // Update existing attendance
            await db.query(
              `UPDATE attendance SET status = 'on-leave' WHERE id = $1`,
              [existingAttendance.rows[0].id]
            );
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      await db.query('COMMIT');

      // Create audit log
      await createAuditLog(
        reviewerId,
        `LEAVE_${status.toUpperCase()}`,
        'leave',
        id,
        { leaveRequestId: id, employeeId: leave.employee_id, status, remarks },
        req
      );

      sendSuccess(res, `Leave request ${status} successfully`);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/leave/:id
 * @desc    Cancel leave request (only pending ones)
 * @access  Private (Employee)
 */
exports.cancelLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    // Get leave request
    const result = await db.query(
      'SELECT * FROM leave_requests WHERE id = $1 AND employee_id = $2',
      [id, employeeId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Leave request not found', 404);
    }

    const leave = result.rows[0];

    if (leave.status !== 'pending') {
      return sendError(res, 'Only pending leave requests can be cancelled', 400);
    }

    // Delete leave request
    await db.query('DELETE FROM leave_requests WHERE id = $1', [id]);

    // Create audit log
    await createAuditLog(employeeId, 'LEAVE_CANCELLED', 'leave', id, { leaveRequestId: id }, req);

    sendSuccess(res, 'Leave request cancelled successfully');
  } catch (error) {
    next(error);
  }
};
