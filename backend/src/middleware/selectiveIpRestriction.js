const { ENABLE_SELECTIVE_IP_RESTRICTION, ATTENDANCE_ALLOWED_IPS } = require('../config/config');

// Log config on startup so it's visible in server logs
if (ENABLE_SELECTIVE_IP_RESTRICTION) {
  console.log('[IP Restriction] Selective IP restriction is ENABLED');
  console.log('[IP Restriction] Allowed IPs/ranges:', ATTENDANCE_ALLOWED_IPS.length ? ATTENDANCE_ALLOWED_IPS : '(none configured — all check-ins will be BLOCKED)');
} else {
  console.log('[IP Restriction] Selective IP restriction is DISABLED — all IPs can check in');
}

/**
 * Normalize IP address:
 * - Strips IPv4-mapped IPv6 prefix (::ffff:x.x.x.x → x.x.x.x)
 * - Maps IPv6 loopback (::1) to 127.0.0.1
 */
const normalizeIP = (ip) => {
  if (!ip) return ip;
  if (ip.startsWith('::ffff:')) return ip.substring(7);
  if (ip === '::1') return '127.0.0.1';
  return ip;
};

/**
 * Check if IP address is within allowed range
 */
const isIPAllowed = (clientIP) => {
  if (!ENABLE_SELECTIVE_IP_RESTRICTION) {
    return true; // IP restriction disabled
  }

  if (ATTENDANCE_ALLOWED_IPS.length === 0) {
    // Restriction is enabled but no IPs are configured — deny everyone
    // (prevents accidental open access when env var is missing)
    console.warn('[IP Restriction] ENABLE_SELECTIVE_IP_RESTRICTION=true but ATTENDANCE_ALLOWED_IPS is empty — denying all check-ins');
    return false;
  }

  // Check if client IP matches any allowed IP/range
  for (const allowedIP of ATTENDANCE_ALLOWED_IPS) {
    const trimmedIP = allowedIP.trim();
    if (trimmedIP.includes('/')) {
      // CIDR notation (e.g., 192.168.1.0/24)
      if (isIPInCIDR(clientIP, trimmedIP)) {
        return true;
      }
    } else {
      // Exact IP match
      if (clientIP === trimmedIP) {
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
  const [range, bits = '32'] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
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
  // Check various headers for real IP (normalize to plain IPv4 where possible)
  const raw =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;
  return normalizeIP(raw);
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
    console.log(`[IP Restriction] BLOCKED: ${clientIP} tried to check-in/check-out`);
    
    return res.status(403).json({
      success: false,
      message: 'Check-in/Check-out is only accessible from the office network.',
      code: 'IP_RESTRICTED',
      clientIP: clientIP, // always shown so admins can whitelist the IP
    });
  }

  console.log(`[IP Restriction] ALLOWED: ${clientIP}`);
  next();
};

module.exports = selectiveIpRestriction;
