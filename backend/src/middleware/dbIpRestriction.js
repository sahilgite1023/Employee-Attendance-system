const db = require('../config/database');

/**
 * ============================================
 * DATABASE-BASED IP RESTRICTION MIDDLEWARE
 * ============================================
 * 
 * Validates client IP against allowed_networks table.
 * Admin manages allowed IPs from the dashboard — no .env needed.
 * 
 * Logs ALL attempts (allowed + blocked) to ip_access_logs.
 */

// ---- IP utility helpers ----

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
 * Get client IP from request (handles proxies)
 */
const getClientIP = (req) => {
  const raw =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;
  return normalizeIP(raw);
};

/**
 * Convert IPv4 address to 32-bit integer
 */
const ipToInt = (ip) => {
  return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
};

/**
 * Check if an IP is inside a CIDR range
 */
const isIPInCIDR = (ip, cidr) => {
  const [range, bits = '32'] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
};

// ---- Core validation ----

/**
 * Query allowed_networks from DB and check if clientIP matches any active rule.
 * Returns { allowed: boolean, reason: string }
 */
const validateIPAgainstDB = async (clientIP) => {
  try {
    const result = await db.query(
      'SELECT * FROM allowed_networks WHERE active = true'
    );

    const networks = result.rows;

    // If no networks are configured, deny all (secure default)
    if (networks.length === 0) {
      return {
        allowed: false,
        reason: 'No allowed networks configured. Contact your administrator.',
      };
    }

    for (const network of networks) {
      const rule = network.ip_or_cidr.trim();
      if (rule.includes('/')) {
        // CIDR
        if (isIPInCIDR(clientIP, rule)) {
          return { allowed: true, reason: `Matched network: ${network.label} (${rule})` };
        }
      } else {
        // Exact IP
        if (clientIP === rule) {
          return { allowed: true, reason: `Matched IP: ${network.label} (${rule})` };
        }
      }
    }

    return {
      allowed: false,
      reason: `IP ${clientIP} does not match any allowed office network.`,
    };
  } catch (error) {
    console.error('[IP Security] DB query failed:', error.message);
    // On DB error, deny access (fail-secure)
    return {
      allowed: false,
      reason: 'Security check failed. Please try again later.',
    };
  }
};

/**
 * Log an IP access attempt to ip_access_logs
 */
const logIPAccess = async (userId, action, ipAddress, allowed, reason) => {
  try {
    await db.query(
      `INSERT INTO ip_access_logs (user_id, action, ip_address, allowed, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, ipAddress, allowed, reason]
    );
  } catch (error) {
    console.error('[IP Security] Failed to write access log:', error.message);
    // Don't throw — logging failure shouldn't break the request
  }
};

// ---- Middleware ----

/**
 * DB-based IP restriction middleware for attendance routes.
 * 
 * Usage in route:  router.post('/check-in', dbIpRestriction('CHECK_IN'), protect, checkIn);
 * 
 * The action parameter is used for audit logging ('CHECK_IN' or 'CHECK_OUT').
 */
const dbIpRestriction = (action = 'CHECK_IN') => {
  return async (req, res, next) => {
    const clientIP = getClientIP(req);

    // If ENABLE_SELECTIVE_IP_RESTRICTION env var is explicitly set to 'false', skip DB check
    // This allows disabling the feature entirely without touching the DB
    if (process.env.ENABLE_SELECTIVE_IP_RESTRICTION === 'false') {
      console.log(`[IP Security] SKIPPED (disabled via env): ${clientIP} → ${action}`);
      return next();
    }

    const { allowed, reason } = await validateIPAgainstDB(clientIP);

    // Determine user_id if auth token already parsed (may be null if middleware runs before auth)
    const userId = req.user?.id || null;

    // Log the attempt
    await logIPAccess(userId, action, clientIP, allowed, reason);

    if (!allowed) {
      console.log(`[IP Security] BLOCKED: ${clientIP} → ${action} | Reason: ${reason}`);
      return res.status(403).json({
        success: false,
        message: 'You must be connected to the office network to mark attendance.',
        code: 'IP_RESTRICTED',
        clientIP,
      });
    }

    console.log(`[IP Security] ALLOWED: ${clientIP} → ${action}`);
    // Attach IP to request so controllers can store it
    req.clientIP = clientIP;
    next();
  };
};

module.exports = {
  dbIpRestriction,
  getClientIP,
  normalizeIP,
  validateIPAgainstDB,
  logIPAccess,
};
