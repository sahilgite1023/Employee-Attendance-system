const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../middleware/auditLog');
const { invalidateCache } = require('../utils/settingsCache');

/**
 * @route   GET /api/admin/settings
 * @desc    Get all system settings
 * @access  Private (Admin)
 */
exports.getAllSettings = async (req, res, next) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT id, setting_key, setting_value, setting_type, category, description, updated_at
      FROM system_settings
    `;
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, setting_key';

    const result = await db.query(query, params);

    // Group settings by category
    const groupedSettings = result.rows.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    sendSuccess(res, 'Settings retrieved successfully', {
      settings: result.rows,
      grouped: groupedSettings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/settings/:key
 * @desc    Get a specific setting by key
 * @access  Private (Admin)
 */
exports.getSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;

    const result = await db.query(
      'SELECT * FROM system_settings WHERE setting_key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Setting not found', 404);
    }

    sendSuccess(res, 'Setting retrieved successfully', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/settings/:key
 * @desc    Update a specific setting
 * @access  Private (Admin)
 */
exports.updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const adminId = req.user.id;

    if (value === undefined || value === null || value === '') {
      return sendError(res, 'Setting value is required', 400);
    }

    // Check if setting exists
    const existing = await db.query(
      'SELECT * FROM system_settings WHERE setting_key = $1',
      [key]
    );

    if (existing.rows.length === 0) {
      return sendError(res, 'Setting not found', 404);
    }

    const setting = existing.rows[0];

    // Validate value based on type
    let validatedValue = value;
    if (setting.setting_type === 'number') {
      validatedValue = String(parseInt(value));
      if (isNaN(validatedValue) || parseInt(value) < 0) {
        return sendError(res, 'Invalid number value', 400);
      }
    } else if (setting.setting_type === 'time') {
      // Validate time format HH:MM
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(value)) {
        return sendError(res, 'Invalid time format. Use HH:MM', 400);
      }
      validatedValue = value;
    }

    // Update setting
    const result = await db.query(
      `UPDATE system_settings 
       SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE setting_key = $3
       RETURNING *`,
      [validatedValue, adminId, key]
    );

    // Create audit log
    await createAuditLog(
      adminId,
      'SETTING_UPDATED',
      'settings',
      result.rows[0].id,
      {
        key,
        oldValue: setting.setting_value,
        newValue: validatedValue,
      },
      req
    );

    // Invalidate cache so next request gets fresh data
    invalidateCache();

    sendSuccess(res, 'Setting updated successfully', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/settings/bulk
 * @desc    Update multiple settings at once
 * @access  Private (Admin)
 */
exports.bulkUpdateSettings = async (req, res, next) => {
  const client = await db.pool.connect();
  
  try {
    const { settings } = req.body;
    const adminId = req.user.id;

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return sendError(res, 'Settings array is required', 400);
    }

    await client.query('BEGIN');

    const updatedSettings = [];
    const auditLogs = [];

    for (const { key, value } of settings) {
      if (!key || value === undefined || value === null || value === '') {
        continue;
      }

      // Get existing setting
      const existing = await client.query(
        'SELECT * FROM system_settings WHERE setting_key = $1',
        [key]
      );

      if (existing.rows.length === 0) {
        continue;
      }

      const setting = existing.rows[0];
      let validatedValue = value;

      // Validate based on type
      if (setting.setting_type === 'number') {
        validatedValue = String(parseInt(value));
        if (isNaN(validatedValue) || parseInt(value) < 0) {
          await client.query('ROLLBACK');
          return sendError(res, `Invalid number value for ${key}`, 400);
        }
      } else if (setting.setting_type === 'time') {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value)) {
          await client.query('ROLLBACK');
          return sendError(res, `Invalid time format for ${key}. Use HH:MM`, 400);
        }
      }

      // Update setting
      const result = await client.query(
        `UPDATE system_settings 
         SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = $3
         RETURNING *`,
        [validatedValue, adminId, key]
      );

      updatedSettings.push(result.rows[0]);
      auditLogs.push({
        key,
        oldValue: setting.setting_value,
        newValue: validatedValue,
      });
    }

    await client.query('COMMIT');

    // Create audit log for bulk update
    await createAuditLog(
      adminId,
      'SETTINGS_BULK_UPDATED',
      'settings',
      null,
      { updates: auditLogs },
      req
    );

    // Invalidate cache so next request gets fresh data
    invalidateCache();

    sendSuccess(res, 'Settings updated successfully', updatedSettings);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @route   POST /api/admin/settings/reset
 * @desc    Reset all settings to default values
 * @access  Private (Admin)
 */
exports.resetToDefaults = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    // Default values
    const defaults = {
      CHECK_IN_START_TIME: '09:00',
      CHECK_IN_END_TIME: '09:30',
      LATE_THRESHOLD_MINUTES: '30',
      HALF_DAY_HOURS: '4',
      FULL_DAY_HOURS: '8',
      ANNUAL_PAID_LEAVES: '7',
    };

    const updated = [];

    for (const [key, value] of Object.entries(defaults)) {
      const result = await db.query(
        `UPDATE system_settings 
         SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = $3
         RETURNING *`,
        [value, adminId, key]
      );
      if (result.rows.length > 0) {
        updated.push(result.rows[0]);
      }
    }

    // Create audit log
    await createAuditLog(
      adminId,
      'SETTINGS_RESET',
      'settings',
      null,
      { defaults },
      req
    );

    // Invalidate cache so next request gets fresh data
    invalidateCache();

    sendSuccess(res, 'Settings reset to defaults successfully', updated);
  } catch (error) {
    next(error);
  }
};
