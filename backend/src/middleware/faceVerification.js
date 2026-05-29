const db = require('../config/database');
const { getSetting } = require('../utils/settingsCache');
const { euclideanDistance, isValidDescriptor } = require('../controllers/faceController');

/**
 * ============================================
 * FACE VERIFICATION MIDDLEWARE
 * ============================================
 *
 * Runs after `protect` (JWT auth) and before the attendance controller.
 * Checks the face descriptor sent in req.body against the stored descriptor.
 *
 * Skipped entirely when ENABLE_FACE_VERIFICATION setting is false.
 *
 * Usage in route:
 *   router.post('/check-in', protect, dbIpRestriction('CHECK_IN'), faceVerification, checkIn);
 */
const faceVerification = async (req, res, next) => {
  try {
    // Check if feature is enabled
    const enabled = await getSetting('ENABLE_FACE_VERIFICATION', false);
    if (!enabled) {
      return next();
    }

    const { faceDescriptor } = req.body;

    // Validate incoming descriptor
    if (!isValidDescriptor(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Face verification is required. Please allow camera access and try again.',
        code: 'FACE_REQUIRED',
      });
    }

    // Load stored descriptor for this employee
    const result = await db.query(
      'SELECT face_descriptor, face_enrolled_at FROM employees WHERE id = $1',
      [req.user.id]
    );

    const employee = result.rows[0];

    if (!employee?.face_descriptor || !employee?.face_enrolled_at) {
      return res.status(412).json({
        success: false,
        message: 'Your face is not enrolled yet. Please enroll your face from your Profile page first.',
        code: 'FACE_NOT_ENROLLED',
      });
    }

    // Parse stored descriptor (stored as JSONB, comes back as array already)
    const stored = Array.isArray(employee.face_descriptor)
      ? employee.face_descriptor
      : JSON.parse(employee.face_descriptor);

    // Get threshold from settings (default 0.5)
    const threshold = await getSetting('FACE_MATCH_THRESHOLD', 50);
    // threshold is stored as integer (e.g. 50 = 0.50) to fit the 'number' type
    const normalizedThreshold = threshold > 1 ? threshold / 100 : threshold;

    const distance = euclideanDistance(stored, faceDescriptor);

    console.log(
      `[FACE] Employee ${req.user.id} | Distance: ${distance.toFixed(4)} | Threshold: ${normalizedThreshold}`
    );

    if (distance > normalizedThreshold) {
      return res.status(403).json({
        success: false,
        message: 'Face not recognized. Please ensure good lighting and face the camera directly.',
        code: 'FACE_MISMATCH',
        distance: parseFloat(distance.toFixed(4)),
      });
    }

    // Attach match info for the controller (optional use)
    req.faceMatch = { distance: parseFloat(distance.toFixed(4)), threshold: normalizedThreshold };
    next();
  } catch (error) {
    console.error('[FACE] Verification error:', error);
    next(error);
  }
};

module.exports = { faceVerification };
