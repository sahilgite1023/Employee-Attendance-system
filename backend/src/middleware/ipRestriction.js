const { ENABLE_IP_RESTRICTION, ALLOWED_IPS } = require('../config/config');

/**
 * Check if IP address is within allowed range
 */
const isIPAllowed = (clientIP) => {
  if (!ENABLE_IP_RESTRICTION) {
    return true; // IP restriction disabled
  }

  if (ALLOWED_IPS.length === 0) {
    return true; // No restrictions if list is empty
  }

  // Check if client IP matches any allowed IP/range
  for (const allowedIP of ALLOWED_IPS) {
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
 * IP Restriction Middleware
 */
const ipRestriction = (req, res, next) => {
  if (!ENABLE_IP_RESTRICTION) {
    return next(); // Skip if disabled
  }

  const clientIP = getClientIP(req);

  if (!isIPAllowed(clientIP)) {
    console.log(`Access denied from IP: ${clientIP}`);
    
    return res.status(403).json({
      success: false,
      message: 'Access restricted. This application is only accessible from the office network.',
      code: 'IP_RESTRICTED',
    });
  }

  next();
};

module.exports = ipRestriction;
