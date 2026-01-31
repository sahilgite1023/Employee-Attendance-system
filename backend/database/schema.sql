-- ================================================
-- E-ATTENDANCE DATABASE SCHEMA
-- Employee Attendance & Leave Management System
-- PostgreSQL 12+
-- ================================================

-- ================================================
-- 1. ROLES TABLE
-- ================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 2. EMPLOYEES TABLE
-- ================================================
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL, -- EMP001, EMP002, etc.
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    temporary_password VARCHAR(255),
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_photo_url TEXT,
    
    -- Professional Information
    designation VARCHAR(100),
    department VARCHAR(100),
    reporting_manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    date_of_joining DATE,
    
    -- Account Information
    role_id INTEGER NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    
    -- Leave Balance
    paid_leaves_balance INTEGER DEFAULT 7, -- Annual paid leaves
    unpaid_leaves_taken INTEGER DEFAULT 0,
    
    -- Password Reset
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (paid_leaves_balance >= 0),
    CHECK (unpaid_leaves_taken >= 0)
);

-- Create index for faster lookups
CREATE INDEX idx_employee_id ON employees(employee_id);
CREATE INDEX idx_email ON employees(email);
CREATE INDEX idx_role_id ON employees(role_id);
CREATE INDEX idx_reporting_manager ON employees(reporting_manager_id);

-- ================================================
-- 3. ATTENDANCE TABLE
-- ================================================
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Date & Time
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    
    -- Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half-day', 'on-leave')),
    is_late BOOLEAN DEFAULT false,
    late_by_minutes INTEGER DEFAULT 0,
    
    -- Hours
    total_hours DECIMAL(4,2) DEFAULT 0,
    
    -- Location (optional - for future geo-fencing)
    check_in_location TEXT,
    check_out_location TEXT,
    
    -- Notes
    remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE (employee_id, attendance_date),
    CHECK (total_hours >= 0),
    CHECK (late_by_minutes >= 0)
);

-- Create indexes
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);

-- ================================================
-- 4. LEAVE REQUESTS TABLE
-- ================================================
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Leave Details
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('paid', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    
    -- Reason
    reason TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Approval
    reviewed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (end_date >= start_date),
    CHECK (total_days > 0)
);

-- Create indexes
CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);

-- ================================================
-- 5. SYSTEM SETTINGS TABLE
-- ================================================
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 6. AUDIT LOGS TABLE
-- ================================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'attendance', 'leave', 'employee', etc.
    entity_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_audit_employee ON audit_logs(employee_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ================================================
-- TRIGGERS FOR updated_at
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- INITIAL DATA
-- ================================================

-- Insert roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrator with full system access'),
('hr', 'HR personnel with employee and leave management access'),
('employee', 'Regular employee with basic access');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('check_in_start_time', '09:00', 'Official check-in start time'),
('check_in_end_time', '09:30', 'Official check-in end time (after this is late)'),
('late_threshold_minutes', '30', 'Minutes after start time to mark as late'),
('half_day_hours', '4', 'Minimum hours for half-day'),
('full_day_hours', '8', 'Minimum hours for full-day'),
('annual_paid_leaves', '7', 'Number of annual paid leaves per employee'),
('company_name', 'Your Company Name', 'Company name for display'),
('company_email', 'hr@company.com', 'Company HR email');

-- ================================================
-- VIEWS FOR REPORTING
-- ================================================

-- View: Employee Attendance Summary
CREATE OR REPLACE VIEW employee_attendance_summary AS
SELECT 
    e.id,
    e.employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.department,
    e.designation,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS total_present,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS total_absent,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS total_late,
    COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) AS total_half_days,
    COUNT(CASE WHEN a.status = 'on-leave' THEN 1 END) AS total_on_leave
FROM employees e
LEFT JOIN attendance a ON e.id = a.employee_id
WHERE e.is_active = true
GROUP BY e.id, e.employee_id, e.first_name, e.last_name, e.department, e.designation;

-- View: Leave Balance Summary
CREATE OR REPLACE VIEW employee_leave_summary AS
SELECT 
    e.id,
    e.employee_id,
    e.first_name || ' ' || e.last_name AS full_name,
    e.paid_leaves_balance,
    e.unpaid_leaves_taken,
    (SELECT COUNT(*) FROM leave_requests lr WHERE lr.employee_id = e.id AND lr.status = 'pending') AS pending_requests,
    (SELECT COUNT(*) FROM leave_requests lr WHERE lr.employee_id = e.id AND lr.status = 'approved') AS approved_requests
FROM employees e
WHERE e.is_active = true;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE employees IS 'Stores employee information including personal, professional details and leave balance';
COMMENT ON TABLE attendance IS 'Tracks daily attendance with check-in/out times and status';
COMMENT ON TABLE leave_requests IS 'Manages leave requests with approval workflow';
COMMENT ON TABLE roles IS 'Defines user roles (admin, hr, employee)';
COMMENT ON TABLE system_settings IS 'Stores system-wide configuration settings';
COMMENT ON TABLE audit_logs IS 'Tracks all system activities for auditing purposes';

-- ================================================
-- SCHEMA COMPLETE
-- ================================================
