const db = require('../config/database');

/**
 * Log audit trail
 */
const createAuditLog = async (employeeId, action, entityType = null, entityId = null, details = {}, req = null) => {
  try {
    const ipAddress = req ? getClientIP(req) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    await db.query(
      `INSERT INTO audit_logs 
       (employee_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [employeeId, action, entityType, entityId, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error - audit log failure shouldn't break the main operation
  }
};

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

/**
 * Audit log middleware
 */
const auditLog = (action, entityType = null) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to log after successful response
    res.send = function (data) {
      // Only log on success (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        createAuditLog(
          req.user.id,
          action,
          entityType,
          req.params.id || null,
          {
            method: req.method,
            path: req.path,
            body: req.body,
          },
          req
        );
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = { createAuditLog, auditLog };
