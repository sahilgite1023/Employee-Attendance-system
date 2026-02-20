const { ENABLE_SELECTIVE_IP_RESTRICTION, ATTENDANCE_ALLOWED_IPS, NODE_ENV } = require('../config/config');

/**
 * Check if IP address is within allowed range
 */
const isIPAllowed = (clientIP) => {
  if (!ENABLE_SELECTIVE_IP_RESTRICTION) {
    return true; // IP restriction disabled
  }

  if (ATTENDANCE_ALLOWED_IPS.length === 0) {
    return true; // No restrictions if list is empty
  }

  // Check if client IP matches any allowed IP/range
  for (const allowedIP of ATTENDANCE_ALLOWED_IPS) {
    if (allowedIP.includes('/')) {
      // CIDR notation (e.g., 192.168.1.0/24)
      if (isIPInCIDR(clientIP, allowedIP)) {
        return true;
      }
    } else {
      // Exact IP match
      if (clientIP === allowedIP.trim()) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Check if IP is in CIDR range
 */
const isIPInCIDR = (ip, cidr) => {
  const [range, bits = 32] = cidr.split('/');
  const mask = ~(2 ** (32 - bits) - 1);
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
};

/**
 * Convert IP address to integer
 */
const ipToInt = (ip) => {
  return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
};

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  // Check various headers for real IP
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

/**
 * Selective IP Restriction Middleware
 * Applied only to attendance check-in/check-out endpoints
 */
const selectiveIpRestriction = (req, res, next) => {
  if (!ENABLE_SELECTIVE_IP_RESTRICTION) {
    return next(); // Skip if disabled
  }

  const clientIP = getClientIP(req);

  if (!isIPAllowed(clientIP)) {
    console.log(`Access denied from IP: ${clientIP} for check-in/check-out`);
    
    return res.status(403).json({
      success: false,
      message: 'Check-in/Check-out is only accessible from the office network.',
      code: 'IP_RESTRICTED',
      clientIP: NODE_ENV === 'development' ? clientIP : undefined,
    });
  }

  next();
};

module.exports = selectiveIpRestriction;
