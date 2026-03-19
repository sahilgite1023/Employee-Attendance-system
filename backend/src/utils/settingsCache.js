const db = require('../config/database');

// In-memory cache for settings
let settingsCache = {};
let lastFetchTime = null;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Load settings from database and cache them
 */
async function loadSettings() {
  try {
    const result = await db.query('SELECT setting_key, setting_value, setting_type FROM system_settings');
    
    const settings = {};
    result.rows.forEach(row => {
      let value = row.setting_value;
      
      // Convert to appropriate type
      if (row.setting_type === 'number') {
        value = parseInt(value);
      } else if (row.setting_type === 'boolean') {
        value = value === 'true';
      }
      
      settings[row.setting_key] = value;
    });
    
    settingsCache = settings;
    lastFetchTime = Date.now();
    
    return settings;
  } catch (error) {
    console.error('Error loading settings from database:', error);
    // Return empty object if database not ready
    return {};
  }
}

/**
 * Get a setting value with fallback to env variable
 */
async function getSetting(key, defaultValue) {
  // Check if cache is stale
  if (!lastFetchTime || Date.now() - lastFetchTime > CACHE_DURATION) {
    await loadSettings();
  }
  
  // Return cached value or default
  return settingsCache[key] !== undefined ? settingsCache[key] : defaultValue;
}

/**
 * Get all settings from cache
 */
async function getAllSettings() {
  // Check if cache is stale
  if (!lastFetchTime || Date.now() - lastFetchTime > CACHE_DURATION) {
    await loadSettings();
  }
  
  return settingsCache;
}

/**
 * Invalidate cache (call after updating settings)
 */
function invalidateCache() {
  lastFetchTime = null;
}

/**
 * Get settings with fallback to config defaults
 */
async function getSettingsWithDefaults(config) {
  const dbSettings = await getAllSettings();
  
  return {
    CHECK_IN_START_TIME: dbSettings.CHECK_IN_START_TIME || config.CHECK_IN_START_TIME,
    CHECK_IN_END_TIME: dbSettings.CHECK_IN_END_TIME || config.CHECK_IN_END_TIME,
    LATE_THRESHOLD_MINUTES: dbSettings.LATE_THRESHOLD_MINUTES || config.LATE_THRESHOLD_MINUTES,
    HALF_DAY_HOURS: dbSettings.HALF_DAY_HOURS || config.HALF_DAY_HOURS,
    FULL_DAY_HOURS: dbSettings.FULL_DAY_HOURS || config.FULL_DAY_HOURS,
    ANNUAL_PAID_LEAVES: dbSettings.ANNUAL_PAID_LEAVES || config.ANNUAL_PAID_LEAVES,
  };
}

module.exports = {
  loadSettings,
  getSetting,
  getAllSettings,
  invalidateCache,
  getSettingsWithDefaults,
};
