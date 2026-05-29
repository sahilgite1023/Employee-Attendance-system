/**
 * Run Face Recognition Migration
 * Adds face_descriptor column and security settings for face verification.
 * 
 * Usage: node run-face-migration.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./src/config/database');

const migrationSQL = `
-- ================================================
-- MIGRATION: Face Recognition for Attendance
-- ================================================

-- 1. Add face_descriptor column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_descriptor JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMP;

-- 2. Ensure system_settings has the required columns
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_type VARCHAR(20) DEFAULT 'string';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Add face verification settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
VALUES
  ('ENABLE_FACE_VERIFICATION', 'false', 'boolean', 'security', 'Require face verification before check-in'),
  ('FACE_MATCH_THRESHOLD', '50', 'number', 'security', 'Face match sensitivity (lower = stricter, range 30-70)')
ON CONFLICT (setting_key) DO NOTHING;
`;

async function runMigration() {
  console.log('======================================');
  console.log('  Face Recognition Migration');
  console.log('======================================');
  console.log('Connecting to database...');

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('✓ Migration completed successfully!');
    
    // Verify columns exist
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'employees' 
      AND column_name IN ('face_descriptor', 'face_enrolled_at')
    `);
    console.log('✓ Added columns to employees:', cols.rows.map(r => r.column_name).join(', '));
    
    // Verify settings exist
    const settings = await client.query(`
      SELECT setting_key, setting_value, category FROM system_settings 
      WHERE setting_key IN ('ENABLE_FACE_VERIFICATION', 'FACE_MATCH_THRESHOLD')
    `);
    console.log('✓ Settings added:');
    settings.rows.forEach(s => {
      console.log(`    ${s.setting_key} = ${s.setting_value} (${s.category})`);
    });
    
    client.release();
    console.log('======================================');
    console.log('  Migration complete! Next steps:');
    console.log('  1. Start the backend server');
    console.log('  2. Go to Admin > Settings');
    console.log('  3. Enable "Face Verification" in Security section');
    console.log('  4. Employees enroll face from Profile page');
    console.log('======================================');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
