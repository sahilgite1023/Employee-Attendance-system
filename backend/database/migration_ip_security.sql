-- ================================================
-- MIGRATION: High-Security IP-Restricted Attendance
-- Run this against your PostgreSQL database
-- ================================================

-- ================================================
-- 1. ALLOWED NETWORKS TABLE
-- Stores office network IPs and CIDR ranges
-- Admin can manage these from the dashboard
-- ================================================
CREATE TABLE IF NOT EXISTS allowed_networks (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    ip_or_cidr VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_allowed_networks_active ON allowed_networks(active);
CREATE INDEX idx_allowed_networks_ip ON allowed_networks(ip_or_cidr);

-- Trigger for updated_at
CREATE TRIGGER update_allowed_networks_updated_at BEFORE UPDATE ON allowed_networks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 2. IP ACCESS LOGS TABLE
-- Logs ALL check-in/check-out attempts (allowed + blocked)
-- For security auditing
-- ================================================
CREATE TABLE IF NOT EXISTS ip_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CHECK_IN', 'CHECK_OUT')),
    ip_address VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ip_access_logs_user ON ip_access_logs(user_id);
CREATE INDEX idx_ip_access_logs_allowed ON ip_access_logs(allowed);
CREATE INDEX idx_ip_access_logs_created ON ip_access_logs(created_at);
CREATE INDEX idx_ip_access_logs_ip ON ip_access_logs(ip_address);

-- ================================================
-- 3. ADD IP COLUMNS TO ATTENDANCE TABLE
-- Store the IP used for check-in and check-out
-- ================================================
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_ip VARCHAR(50);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_ip VARCHAR(50);

-- ================================================
-- COMMENTS
-- ================================================
COMMENT ON TABLE allowed_networks IS 'Office network IPs/CIDRs managed by admin for attendance IP restriction';
COMMENT ON TABLE ip_access_logs IS 'Security audit log for all check-in/check-out attempts including blocked ones';

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
