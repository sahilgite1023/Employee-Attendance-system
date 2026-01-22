-- ================================================
-- SEED DATA FOR DEVELOPMENT/TESTING
-- E-Attendance System
-- ================================================

-- Note: This is sample data for development.
-- DO NOT use in production without changing passwords!

-- ================================================
-- SEED ADMIN USER
-- ================================================
-- Password: Admin@123
INSERT INTO employees (
    employee_id, email, password_hash, first_name, last_name, 
    phone, designation, department, role_id, date_of_joining, is_active
) VALUES (
    'EMP001',
    'admin@company.com',
    '$2b$10$Fnwfge7v7clQ3U5R9xlR9.Ocduj4rOM20/S3qv5G/ves1hP56.BOW', -- Admin@123
    'John',
    'Doe',
    '+1234567890',
    'HR Manager',
    'Human Resources',
    (SELECT id FROM roles WHERE name = 'admin'),
    '2023-01-01',
    true
);

-- ================================================
-- SEED HR USER
-- ================================================
-- Password: Hr@123
INSERT INTO employees (
    employee_id, email, password_hash, first_name, last_name, 
    phone, designation, department, role_id, date_of_joining, is_active,
    reporting_manager_id
) VALUES (
    'EMP002',
    'hr@company.com',
    '$2b$10$O4804Ev2aavmxqosnS0EuOIpyx48Ak7HUg1fBsL750W9M01m4j/kW', -- Hr@123
    'Jane',
    'Smith',
    '+1234567891',
    'HR Executive',
    'Human Resources',
    (SELECT id FROM roles WHERE name = 'hr'),
    '2023-02-01',
    true,
    (SELECT id FROM employees WHERE employee_id = 'EMP001')
);

-- ================================================
-- SEED REGULAR EMPLOYEES
-- ================================================
-- Password: Employee@123
INSERT INTO employees (
    employee_id, email, password_hash, first_name, last_name, 
    phone, designation, department, role_id, date_of_joining, is_active,
    reporting_manager_id
) VALUES 
(
    'EMP003',
    'alice.johnson@company.com',
    '$2b$10$qbqW4laZ.CJ.eIY9n/O7lOs/4yulI0RIE7/amKtwo2FiYNgoB/b0G', -- Employee@123
    'Alice',
    'Johnson',
    '+1234567892',
    'Software Engineer',
    'Engineering',
    (SELECT id FROM roles WHERE name = 'employee'),
    '2023-03-15',
    true,
    (SELECT id FROM employees WHERE employee_id = 'EMP001')
),
(
    'EMP004',
    'bob.williams@company.com',
    '$2b$10$qbqW4laZ.CJ.eIY9n/O7lOs/4yulI0RIE7/amKtwo2FiYNgoB/b0G', -- Employee@123
    'Bob',
    'Williams',
    '+1234567893',
    'Senior Developer',
    'Engineering',
    (SELECT id FROM roles WHERE name = 'employee'),
    '2023-01-10',
    true,
    (SELECT id FROM employees WHERE employee_id = 'EMP001')
),
(
    'EMP005',
    'charlie.brown@company.com',
    '$2b$10$qbqW4laZ.CJ.eIY9n/O7lOs/4yulI0RIE7/amKtwo2FiYNgoB/b0G', -- Employee@123
    'Charlie',
    'Brown',
    '+1234567894',
    'Product Manager',
    'Product',
    (SELECT id FROM roles WHERE name = 'employee'),
    '2023-02-20',
    true,
    (SELECT id FROM employees WHERE employee_id = 'EMP001')
),
(
    'EMP006',
    'diana.prince@company.com',
    '$2b$10$qbqW4laZ.CJ.eIY9n/O7lOs/4yulI0RIE7/amKtwo2FiYNgoB/b0G', -- Employee@123
    'Diana',
    'Prince',
    '+1234567895',
    'UI/UX Designer',
    'Design',
    (SELECT id FROM roles WHERE name = 'employee'),
    '2023-04-01',
    true,
    (SELECT id FROM employees WHERE employee_id = 'EMP001')
),
(
    'EMP007',
    'edward.stark@company.com',
    '$2b$10$qbqW4laZ.CJ.eIY9n/O7lOs/4yulI0RIE7/amKtwo2FiYNgoB/b0G', -- Employee@123
    'Edward',
    'Stark',
    '+1234567896',
    'Marketing Specialist',
    'Marketing',
    (SELECT id FROM roles WHERE name = 'employee'),
    '2023-05-15',
    true,
    (SELECT id FROM employees WHERE employee_id = 'EMP001')
);

-- ================================================
-- SEED SAMPLE ATTENDANCE DATA (Last 7 days)
-- ================================================
DO $$
DECLARE
    emp_record RECORD;
    day_offset INTEGER;
    attendance_date DATE;
BEGIN
    -- Loop through last 7 days
    FOR day_offset IN 0..6 LOOP
        attendance_date := CURRENT_DATE - day_offset;
        
        -- Skip weekends (Saturday=6, Sunday=0)
        IF EXTRACT(DOW FROM attendance_date) NOT IN (0, 6) THEN
            -- Add attendance for each employee
            FOR emp_record IN SELECT id FROM employees WHERE is_active = true LOOP
                -- Randomly generate attendance (80% present, 10% late, 10% absent)
                IF RANDOM() < 0.8 THEN
                    -- Present (on-time)
                    INSERT INTO attendance (
                        employee_id, attendance_date, check_in_time, check_out_time,
                        status, is_late, late_by_minutes, total_hours
                    ) VALUES (
                        emp_record.id,
                        attendance_date,
                        attendance_date + TIME '09:00:00' + (RANDOM() * INTERVAL '15 minutes'),
                        attendance_date + TIME '18:00:00' + (RANDOM() * INTERVAL '30 minutes'),
                        'present',
                        false,
                        0,
                        8.5 + (RANDOM() * 1)
                    );
                ELSIF RANDOM() < 0.5 THEN
                    -- Late
                    INSERT INTO attendance (
                        employee_id, attendance_date, check_in_time, check_out_time,
                        status, is_late, late_by_minutes, total_hours
                    ) VALUES (
                        emp_record.id,
                        attendance_date,
                        attendance_date + TIME '09:00:00' + INTERVAL '45 minutes',
                        attendance_date + TIME '18:00:00' + (RANDOM() * INTERVAL '30 minutes'),
                        'late',
                        true,
                        45,
                        8.0
                    );
                ELSE
                    -- Absent
                    INSERT INTO attendance (
                        employee_id, attendance_date, check_in_time, check_out_time,
                        status, is_late, late_by_minutes, total_hours
                    ) VALUES (
                        emp_record.id,
                        attendance_date,
                        NULL,
                        NULL,
                        'absent',
                        false,
                        0,
                        0
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- ================================================
-- SEED SAMPLE LEAVE REQUESTS
-- ================================================
INSERT INTO leave_requests (
    employee_id, leave_type, start_date, end_date, total_days,
    reason, status, reviewed_by, reviewed_at, review_remarks
) VALUES 
-- Approved leave
(
    (SELECT id FROM employees WHERE employee_id = 'EMP003'),
    'paid',
    CURRENT_DATE + 5,
    CURRENT_DATE + 6,
    2,
    'Family function',
    'approved',
    (SELECT id FROM employees WHERE employee_id = 'EMP001'),
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    'Approved. Enjoy your time.'
),
-- Pending leave
(
    (SELECT id FROM employees WHERE employee_id = 'EMP004'),
    'paid',
    CURRENT_DATE + 10,
    CURRENT_DATE + 12,
    3,
    'Medical appointment',
    'pending',
    NULL,
    NULL,
    NULL
),
-- Rejected leave
(
    (SELECT id FROM employees WHERE employee_id = 'EMP005'),
    'paid',
    CURRENT_DATE + 3,
    CURRENT_DATE + 4,
    2,
    'Personal work',
    'rejected',
    (SELECT id FROM employees WHERE employee_id = 'EMP001'),
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'Peak business period. Please reschedule.'
);

-- ================================================
-- SEED COMPLETE
-- ================================================

-- Display summary
SELECT 
    'Roles' as entity, COUNT(*) as count FROM roles
UNION ALL
SELECT 
    'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 
    'Attendance Records', COUNT(*) FROM attendance
UNION ALL
SELECT 
    'Leave Requests', COUNT(*) FROM leave_requests;

-- Display test credentials
SELECT 
    'TEST CREDENTIALS' as info,
    employee_id,
    email,
    CASE 
        WHEN employee_id = 'EMP001' THEN 'Admin@123'
        WHEN employee_id = 'EMP002' THEN 'Hr@123'
        ELSE 'Employee@123'
    END as password,
    r.name as role
FROM employees e
JOIN roles r ON e.role_id = r.id
ORDER BY e.id;
