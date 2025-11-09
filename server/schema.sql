CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  designation TEXT,
  password TEXT
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  date DATE,
  check_in TEXT,
  check_out TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  leave_type TEXT,
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status TEXT,
  approved_by TEXT
);

CREATE TABLE IF NOT EXISTS payroll (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  month INT,
  year INT,
  basic_salary INT,
  hra INT,
  allowances INT,
  pf INT,
  professional_tax INT,
  unpaid_days INT DEFAULT 0,
  unpaid_deduction INT DEFAULT 0,
  net_pay INT,
  generated_by TEXT
);
