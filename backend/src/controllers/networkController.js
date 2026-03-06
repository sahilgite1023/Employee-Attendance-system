const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../middleware/auditLog');

// ============================================
// ALLOWED NETWORKS CRUD
// ============================================

/**
 * @route   GET /api/admin/networks
 * @desc    Get all allowed networks
 * @access  Private (Admin)
 */
exports.getAllNetworks = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM allowed_networks ORDER BY created_at DESC'
    );
    sendSuccess(res, 'Networks retrieved', result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/networks
 * @desc    Add a new allowed network
 * @access  Private (Admin)
 */
exports.addNetwork = async (req, res, next) => {
  try {
    const { label, ip_or_cidr } = req.body;

    if (!label || !ip_or_cidr) {
      return sendError(res, 'Label and IP/CIDR are required', 400);
    }

    // Basic validation for IP or CIDR format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ip_or_cidr.trim())) {
      return sendError(res, 'Invalid IP address or CIDR format. Example: 192.168.1.10 or 192.168.1.0/24', 400);
    }

    // Check for duplicates
    const existing = await db.query(
      'SELECT id FROM allowed_networks WHERE ip_or_cidr = $1',
      [ip_or_cidr.trim()]
    );
    if (existing.rows.length > 0) {
      return sendError(res, 'This IP/CIDR is already in the allowed list', 400);
    }

    const result = await db.query(
      `INSERT INTO allowed_networks (label, ip_or_cidr, active, created_by)
       VALUES ($1, $2, true, $3)
       RETURNING *`,
      [label.trim(), ip_or_cidr.trim(), req.user.id]
    );

    await createAuditLog(req.user.id, 'ADD_NETWORK', 'allowed_networks', result.rows[0].id, { label, ip_or_cidr }, req);

    sendSuccess(res, 'Network added successfully', result.rows[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/networks/:id
 * @desc    Update an allowed network
 * @access  Private (Admin)
 */
exports.updateNetwork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, ip_or_cidr, active } = req.body;

    const existing = await db.query('SELECT * FROM allowed_networks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendError(res, 'Network not found', 404);
    }

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (label !== undefined) {
      updates.push(`label = $${paramCount}`);
      values.push(label.trim());
      paramCount++;
    }
    if (ip_or_cidr !== undefined) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      if (!ipRegex.test(ip_or_cidr.trim())) {
        return sendError(res, 'Invalid IP address or CIDR format', 400);
      }
      updates.push(`ip_or_cidr = $${paramCount}`);
      values.push(ip_or_cidr.trim());
      paramCount++;
    }
    if (active !== undefined) {
      updates.push(`active = $${paramCount}`);
      values.push(active);
      paramCount++;
    }

    if (updates.length === 0) {
      return sendError(res, 'No fields to update', 400);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE allowed_networks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    await createAuditLog(req.user.id, 'UPDATE_NETWORK', 'allowed_networks', id, { label, ip_or_cidr, active }, req);

    sendSuccess(res, 'Network updated successfully', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/networks/:id
 * @desc    Delete an allowed network
 * @access  Private (Admin)
 */
exports.deleteNetwork = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM allowed_networks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendError(res, 'Network not found', 404);
    }

    await db.query('DELETE FROM allowed_networks WHERE id = $1', [id]);

    await createAuditLog(req.user.id, 'DELETE_NETWORK', 'allowed_networks', id, existing.rows[0], req);

    sendSuccess(res, 'Network deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/networks/:id/toggle
 * @desc    Toggle network active/inactive
 * @access  Private (Admin)
 */
exports.toggleNetwork = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM allowed_networks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return sendError(res, 'Network not found', 404);
    }

    const newActive = !existing.rows[0].active;
    const result = await db.query(
      'UPDATE allowed_networks SET active = $1 WHERE id = $2 RETURNING *',
      [newActive, id]
    );

    await createAuditLog(req.user.id, 'TOGGLE_NETWORK', 'allowed_networks', id, { active: newActive }, req);

    sendSuccess(res, `Network ${newActive ? 'enabled' : 'disabled'} successfully`, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// ============================================
// IP ACCESS LOGS
// ============================================

/**
 * @route   GET /api/admin/ip-logs
 * @desc    Get IP access logs (security audit)
 * @access  Private (Admin)
 */
exports.getIpAccessLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, allowed, action, startDate, endDate } = req.query;

    let query = `
      SELECT l.*, 
             e.employee_id AS employee_code,
             e.first_name, 
             e.last_name
      FROM ip_access_logs l
      LEFT JOIN employees e ON l.user_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (allowed !== undefined) {
      query += ` AND l.allowed = $${paramCount}`;
      params.push(allowed === 'true');
      paramCount++;
    }

    if (action) {
      query += ` AND l.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (startDate) {
      query += ` AND l.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND l.created_at <= $${paramCount}`;
      params.push(endDate + ' 23:59:59');
      paramCount++;
    }

    query += ' ORDER BY l.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM ip_access_logs l WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (allowed !== undefined) {
      countQuery += ` AND l.allowed = $${countParamCount}`;
      countParams.push(allowed === 'true');
      countParamCount++;
    }

    if (action) {
      countQuery += ` AND l.action = $${countParamCount}`;
      countParams.push(action);
      countParamCount++;
    }

    const countResult = await db.query(countQuery, countParams);
    const totalRecords = parseInt(countResult.rows[0].count);

    sendSuccess(res, 'IP access logs retrieved', {
      logs: result.rows,
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
