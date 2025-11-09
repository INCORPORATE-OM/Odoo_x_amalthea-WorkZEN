-- users
INSERT INTO users (id, name, email, role, phone, department, designation, password) VALUES
('1','Admin User','admin@workzen.com','admin','+1234567890','Management','System Administrator','password123'),
('2','John Doe','john@workzen.com','employee','+1234567891','Engineering','Software Engineer','password123'),
('3','Jane Smith','jane@workzen.com','hr_officer','+1234567892','Human Resources','HR Manager','password123'),
('4','Robert Wilson','robert@workzen.com','payroll_officer','+1234567893','Finance','Payroll Manager','password123')
ON CONFLICT DO NOTHING;

-- attendance (use today's date)
INSERT INTO attendance (id, user_id, user_name, date, check_in, check_out, status) VALUES
('1','2','John Doe', CURRENT_DATE, '09:00 AM', '06:00 PM', 'present'),
('2','3','Jane Smith', CURRENT_DATE, '09:15 AM', NULL, 'present')
ON CONFLICT DO NOTHING;

-- leaves
INSERT INTO leaves (id, user_id, user_name, leave_type, start_date, end_date, reason, status, approved_by) VALUES
('1','2','John Doe','Sick Leave','2025-11-15','2025-11-16','Medical appointment','pending', NULL),
('2','3','Jane Smith','Vacation','2025-12-01','2025-12-05','Family vacation','approved','Admin User')
ON CONFLICT DO NOTHING;

-- payroll
INSERT INTO payroll (id, user_id, user_name, month, year, basic_salary, hra, allowances, pf, professional_tax, net_pay, generated_by) VALUES
('1','2','John Doe',11,2025,50000,10000,5000,6000,200,58800,'Robert Wilson')
ON CONFLICT DO NOTHING;
