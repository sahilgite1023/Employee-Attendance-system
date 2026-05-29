const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../middleware/auditLog');

// ─── Euclidean distance between two 128-float descriptors ───────────────────
function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 128 || b.length !== 128) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// ─── Validate that a descriptor is a valid 128-float array ──────────────────
function isValidDescriptor(d) {
  return (
    Array.isArray(d) &&
    d.length === 128 &&
    d.every((v) => typeof v === 'number' && isFinite(v))
  );
}

/**
 * @route   POST /api/auth/face/enroll
 * @desc    Save face descriptor for the logged-in employee
 * @access  Private (Employee / Admin)
 */
exports.enrollFace = async (req, res, next) => {
  try {
    const { descriptor } = req.body;

    if (!isValidDescriptor(descriptor)) {
      return sendError(res, 'Invalid face descriptor. Please try again.', 400);
    }

    await db.query(
      `UPDATE employees
       SET face_descriptor = $1, face_enrolled_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(descriptor), req.user.id]
    );

    await createAuditLog(req.user.id, 'FACE_ENROLLED', 'employee', req.user.id, {}, req);

    sendSuccess(res, 'Face enrolled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/face/enroll/:employeeId
 * @desc    Admin enrolls / re-enrolls a specific employee's face
 * @access  Private (Admin)
 */
exports.adminEnrollFace = async (req, res, next) => {
  try {
    const { descriptor } = req.body;
    const targetId = parseInt(req.params.id, 10);

    if (!isValidDescriptor(descriptor)) {
      return sendError(res, 'Invalid face descriptor. Please try again.', 400);
    }

    const emp = await db.query('SELECT id FROM employees WHERE id = $1', [targetId]);
    if (emp.rows.length === 0) {
      return sendError(res, 'Employee not found', 404);
    }

    await db.query(
      `UPDATE employees
       SET face_descriptor = $1, face_enrolled_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(descriptor), targetId]
    );

    await createAuditLog(req.user.id, 'FACE_ENROLLED_BY_ADMIN', 'employee', targetId, {}, req);

    sendSuccess(res, 'Face enrolled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/face/enroll
 * @desc    Remove face enrollment for the logged-in employee
 * @access  Private (Employee)
 */
exports.removeFace = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE employees SET face_descriptor = NULL, face_enrolled_at = NULL WHERE id = $1`,
      [req.user.id]
    );

    await createAuditLog(req.user.id, 'FACE_REMOVED', 'employee', req.user.id, {}, req);

    sendSuccess(res, 'Face enrollment removed');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/employees/:id/face
 * @desc    Admin removes face enrollment for a specific employee
 * @access  Private (Admin)
 */
exports.adminRemoveFace = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    await db.query(
      `UPDATE employees SET face_descriptor = NULL, face_enrolled_at = NULL WHERE id = $1`,
      [targetId]
    );

    await createAuditLog(req.user.id, 'FACE_REMOVED_BY_ADMIN', 'employee', targetId, {}, req);

    sendSuccess(res, 'Face enrollment removed');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/face/status
 * @desc    Check if the logged-in employee has a face enrolled + whether feature is enabled
 * @access  Private
 */
exports.getFaceStatus = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT face_enrolled_at FROM employees WHERE id = $1',
      [req.user.id]
    );

    const enrolled = !!result.rows[0]?.face_enrolled_at;

    // Also check if the feature is enabled (from system_settings)
    let featureEnabled = false;
    try {
      const settingResult = await db.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'ENABLE_FACE_VERIFICATION'"
      );
      featureEnabled = settingResult.rows[0]?.setting_value === 'true';
    } catch {
      // If setting doesn't exist, feature is disabled
    }

    sendSuccess(res, 'Face status retrieved', {
      enrolled,
      enrolledAt: result.rows[0]?.face_enrolled_at || null,
      featureEnabled,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Exported helper used by attendance middleware ───────────────────────────
exports.euclideanDistance = euclideanDistance;
exports.isValidDescriptor = isValidDescriptor;
