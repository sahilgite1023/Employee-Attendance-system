const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../middleware/auditLog');
const {
  formatDate,
  calculateHours,
  calculateMinutes,
  parseTimeString,
  isWeekend,
} = require('../utils/helpers');
const {
  CHECK_IN_START_TIME,
  LATE_THRESHOLD_MINUTES,
  HALF_DAY_HOURS,
  FULL_DAY_HOURS,
} = require('../config/config');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check in for the day
 * @access  Private (Employee)
 */
exports.checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const today = formatDate(new Date());

    // Check if already checked in today
    const existing = await db.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2',
      [employeeId, today]
    );

    if (existing.rows.length > 0) {
      return sendError(res, 'You have already checked in today', 400);
    }

    // Get check-in time
    const checkInTime = new Date();
    
    // Calculate if late
    const startTime = parseTimeString(CHECK_IN_START_TIME);
    const thresholdTime = new Date(checkInTime);
    thresholdTime.setHours(startTime.hours, startTime.minutes, 0, 0);
    
    const isLateCheckin = checkInTime > thresholdTime;
    const lateByMinutes = isLateCheckin ? calculateMinutes(thresholdTime, checkInTime) : 0;
    
    // Determine status
    let status = 'present';
    if (isLateCheckin && lateByMinutes > LATE_THRESHOLD_MINUTES) {
      status = 'late';
    }

    // Insert attendance record
    const result = await db.query(
      `INSERT INTO attendance 
       (employee_id, attendance_date, check_in_time, status, is_late, late_by_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employeeId, today, checkInTime, status, isLateCheckin, lateByMinutes]
    );

    // Create audit log
    await createAuditLog(employeeId, 'CHECK_IN', 'attendance', result.rows[0].id, { status }, req);

    sendSuccess(res, 'Checked in successfully', result.rows[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check out for the day
 * @access  Private (Employee)
 */
exports.checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const today = formatDate(new Date());

    // Get today's attendance record
    const result = await db.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2',
      [employeeId, today]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'No check-in record found for today. Please check in first.', 400);
    }

    const attendance = result.rows[0];

    if (attendance.check_out_time) {
      return sendError(res, 'You have already checked out today', 400);
    }

    // Calculate hours worked
    const checkOutTime = new Date();
    const totalHours = calculateHours(attendance.check_in_time, checkOutTime);

    // Determine status based on hours
    let status = attendance.status;
    if (totalHours < HALF_DAY_HOURS) {
      status = 'half-day';
    } else if (totalHours >= FULL_DAY_HOURS) {
      status = 'present';
    }

    // Update attendance record
    const updated = await db.query(
      `UPDATE attendance 
       SET check_out_time = $1, total_hours = $2, status = $3
       WHERE id = $4
       RETURNING *`,
      [checkOutTime, totalHours, status, attendance.id]
    );

    // Create audit log
    await createAuditLog(employeeId, 'CHECK_OUT', 'attendance', attendance.id, { totalHours, status }, req);

    sendSuccess(res, 'Checked out successfully', updated.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance status
 * @access  Private (Employee)
 */
exports.getTodayAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const today = formatDate(new Date());

    const result = await db.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2',
      [employeeId, today]
    );

    const attendance = result.rows[0] || null;

    sendSuccess(res, 'Today\'s attendance retrieved', {
      attendance,
      hasCheckedIn: !!attendance,
      hasCheckedOut: attendance?.check_out_time ? true : false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/history
 * @desc    Get attendance history with filters
 * @access  Private (Employee)
 */
exports.getAttendanceHistory = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM attendance WHERE employee_id = $1';
    const params = [employeeId];
    let paramCount = 2;

    // Add filters
    if (startDate) {
      query += ` AND attendance_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND attendance_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY attendance_date DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM attendance WHERE employee_id = $1';
    const countParams = [employeeId];
    let countParamCount = 2;

    if (startDate) {
      countQuery += ` AND attendance_date >= $${countParamCount}`;
      countParams.push(startDate);
      countParamCount++;
    }

    if (endDate) {
      countQuery += ` AND attendance_date <= $${countParamCount}`;
      countParams.push(endDate);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalRecords = parseInt(countResult.rows[0].count);

    sendSuccess(res, 'Attendance history retrieved', {
      records: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private (Employee)
 */
exports.getAttendanceStats = async (req, res, next) => {
  try {
    const employeeId = req.user.id;

    const result = await db.query(
      `SELECT 
         COUNT(*) as total_days,
         COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
         COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
         COUNT(CASE WHEN status = 'half-day' THEN 1 END) as half_days,
         COUNT(CASE WHEN status = 'on-leave' THEN 1 END) as leave_days,
         ROUND(AVG(total_hours), 2) as avg_hours
       FROM attendance
       WHERE employee_id = $1`,
      [employeeId]
    );

    sendSuccess(res, 'Attendance statistics retrieved', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/all
 * @desc    Get all employees' attendance (Admin only)
 * @access  Private (Admin)
 */
exports.getAllAttendance = async (req, res, next) => {
  try {
    const { date, status, department, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT a.*, 
             e.employee_id AS employee_code, 
             e.first_name, 
             e.last_name, 
             e.department, 
             e.designation
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (date) {
      query += ` AND a.attendance_date = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (department) {
      query += ` AND e.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    query += ' ORDER BY a.attendance_date DESC, e.employee_id ASC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    sendSuccess(res, 'Attendance records retrieved', result.rows);
  } catch (error) {
    next(error);
  }
};
