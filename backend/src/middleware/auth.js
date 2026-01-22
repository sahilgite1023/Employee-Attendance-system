const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const db = require('../config/database');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from database
      const result = await db.query(
        `SELECT e.id, e.employee_id, e.email, e.first_name, e.last_name, 
                e.designation, e.department, e.is_active, r.name as role
         FROM employees e
         JOIN roles r ON e.role_id = r.id
         WHERE e.id = $1`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.',
        });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact HR.',
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
