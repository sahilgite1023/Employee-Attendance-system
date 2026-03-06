/**
 * Run IP Security Migration
 * Uses the project's own database config (reads DATABASE_URL from .env)
 * 
 * Usage: node run-ip-migration.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./src/config/database');

const migrationSQL = `
-- ================================================
-- MIGRATION: High-Security IP-Restricted Attendance
-- ================================================

-- 1. ALLOWED NETWORKS TABLE
CREATE TABLE IF NOT EXISTS allowed_networks (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    ip_or_cidr VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. IP ACCESS LOGS TABLE
CREATE TABLE IF NOT EXISTS ip_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CHECK_IN', 'CHECK_OUT')),
    ip_address VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADD IP COLUMNS TO ATTENDANCE TABLE
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_ip VARCHAR(50);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_ip VARCHAR(50);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_allowed_networks_active ON allowed_networks(active);
CREATE INDEX IF NOT EXISTS idx_allowed_networks_ip ON allowed_networks(ip_or_cidr);
CREATE INDEX IF NOT EXISTS idx_ip_access_logs_user ON ip_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_access_logs_allowed ON ip_access_logs(allowed);
CREATE INDEX IF NOT EXISTS idx_ip_access_logs_created ON ip_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ip_access_logs_ip ON ip_access_logs(ip_address);

-- TRIGGER (safe: only create if table exists and trigger doesn't)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_allowed_networks_updated_at'
  ) THEN
    CREATE TRIGGER update_allowed_networks_updated_at 
    BEFORE UPDATE ON allowed_networks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
`;

async function runMigration() {
  console.log('======================================');
  console.log('  IP Security Migration');
  console.log('======================================');
  console.log('Connecting to database...');

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('✓ Migration completed successfully!');
    
    // Verify tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('allowed_networks', 'ip_access_logs')
      ORDER BY table_name
    `);
    console.log('✓ Created tables:', tables.rows.map(r => r.table_name).join(', '));
    
    // Verify columns
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'attendance' 
      AND column_name IN ('check_in_ip', 'check_out_ip')
    `);
    console.log('✓ Added columns to attendance:', cols.rows.map(r => r.column_name).join(', '));
    
    client.release();
    console.log('======================================');
    console.log('  Migration complete! You can now:');
    console.log('  1. Start the backend server');
    console.log('  2. Go to Admin > Security Settings');
    console.log('  3. Add your office network IP');
    console.log('======================================');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
