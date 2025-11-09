const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'example',
  database: process.env.DB_NAME || 'humancare',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

async function ensureSchema() {
  const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
  await pool.query(sql);
}

async function seedIfEmpty() {
  const res = await pool.query('select count(*)::int as c from users');
  if (res.rows[0].c === 0) {
    console.log('Seeding database...');
    const seed = fs.readFileSync(__dirname + '/seed.sql', 'utf8');
    await pool.query(seed);
    console.log('Seed complete');
  }
}

async function ensureMigration() {
  // add unpaid column to leaves if not exists
  try {
    await pool.query("ALTER TABLE leaves ADD COLUMN IF NOT EXISTS unpaid BOOLEAN DEFAULT FALSE;");
  } catch (err) {
    console.warn('Migration check failed', err.message || err);
  }
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await pool.query('select * from users where email=$1', [email]);
    if (r.rows.length && password && r.rows[0].password === password) {
      const user = r.rows[0];
      return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: 'failed' });
  }
});

app.get('/api/users/current', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: 'email required' });
    const r = await pool.query('select id, name, email, role, phone, department, designation from users where email=$1', [email]);
    if (!r.rows.length) return res.status(404).json({ message: 'not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const r = await pool.query('select id, name, email, role, phone, department, designation from users order by name');
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, name, email, role, phone, department, designation, password } = req.body;
    const nid = id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await pool.query(
      `insert into users(id, name, email, role, phone, department, designation, password)
       values($1,$2,$3,$4,$5,$6,$7,$8)`,
      [nid, name, email, role, phone || null, department || null, designation || null, password || 'password123']
    );
    const r = await pool.query('select id, name, email, role, phone, department, designation from users where id=$1', [nid]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    if (err && err.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    const msg = err && err.message ? err.message : 'failed';
    res.status(500).json({ message: msg });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const r = await pool.query('select * from attendance order by date desc');
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { id, userId, userName, date, checkIn, checkOut, status } = req.body;
    const nid = id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // Enforce that the number of 'present' attendance records for a given date cannot exceed
    // the total number of employees in the users table. Also avoid creating duplicate records
    // for the same user+date.
    const dateOnly = date ? (new Date(date)).toISOString().split('T')[0] : (new Date()).toISOString().split('T')[0];

  // total employee count: count only users with role 'employee'
  const totalUsersRes = await pool.query("select count(*)::int as c from users where role = 'employee'");
    const totalUsers = totalUsersRes.rows[0].c || 0;

    // how many present records already exist for the date
    const presentRes = await pool.query("select count(*)::int as c from attendance where date = $1 and status = 'present'", [dateOnly]);
    const presentCount = presentRes.rows[0].c || 0;

    // check if this user already has a record for the date
    const dupRes = await pool.query('select * from attendance where user_id = $1 and date = $2', [userId, dateOnly]);
    if (dupRes.rows.length > 0) {
      return res.status(409).json({ message: 'Attendance for this user on this date already exists', record: dupRes.rows[0] });
    }

    if (presentCount >= totalUsers) {
      return res.status(400).json({ message: 'Attendance limit reached for this date' });
    }

    await pool.query(
      `insert into attendance(id, user_id, user_name, date, check_in, check_out, status)
       values($1,$2,$3,$4,$5,$6,$7)`,
      [nid, userId, userName, dateOnly, checkIn || null, checkOut || null, status || 'present']
    );
    const r = await pool.query('select * from attendance where id=$1', [nid]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.put('/api/attendance/:id', async (req, res) => {
  try {
    const attendanceId = req.params.id;
    const { checkOut } = req.body;
    await pool.query('update attendance set check_out=$1 where id=$2', [checkOut || null, attendanceId]);
    const r = await pool.query('select * from attendance where id=$1', [attendanceId]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.get('/api/leaves', async (req, res) => {
  try {
    const r = await pool.query('select * from leaves order by start_date desc');
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.post('/api/leaves', async (req, res) => {
  try {
    const { id, userId, userName, leaveType, startDate, endDate, reason, unpaid } = req.body;
    const nid = id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await pool.query(
      `insert into leaves(id, user_id, user_name, leave_type, start_date, end_date, reason, status, unpaid)
       values($1,$2,$3,$4,$5,$6,$7,'pending',$8)`,
      [nid, userId, userName, leaveType, startDate, endDate, reason, unpaid ? true : false]
    );
    const r = await pool.query('select * from leaves where id=$1', [nid]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.post('/api/leaves/:id/action', async (req, res) => {
  try {
    const id = req.params.id;
    const { action, approvedBy } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'invalid' });
    const status = action === 'approve' ? 'approved' : 'rejected';
    await pool.query('update leaves set status=$1, approved_by=$2 where id=$3', [status, approvedBy || null, id]);
    const r = await pool.query('select * from leaves where id=$1', [id]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.get('/api/payroll', async (req, res) => {
  try {
    const r = await pool.query('select * from payroll order by year desc, month desc');
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

app.post('/api/payroll', async (req, res) => {
  try {
    const { id, userId, userName, month, year, basicSalary, hra, allowances, professionalTax, unpaidDays, unpaidDeduction } = req.body;
    const nid = id || `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pf = Math.round((basicSalary || 0) * 0.12);
    const profTax = professionalTax != null ? professionalTax : 200;
    const unpaidDed = unpaidDeduction != null ? Number(unpaidDeduction) : 0;
    const netPay = Math.round((basicSalary || 0) + (hra || 0) + (allowances || 0) - pf - profTax - unpaidDed);
    await pool.query(
      `insert into payroll(id, user_id, user_name, month, year, basic_salary, hra, allowances, pf, professional_tax, unpaid_days, unpaid_deduction, net_pay, generated_by)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [nid, userId, userName, month, year, basicSalary, hra, allowances, pf, profTax, unpaidDays || 0, unpaidDed, netPay, req.body.generatedBy || null]
    );
    const r = await pool.query('select * from payroll where id=$1', [nid]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed' });
  }
});

const port = process.env.PORT || 4000;
ensureSchema()
  .then(ensureMigration)
  .then(seedIfEmpty)
  .then(() => {
    app.listen(port, () => console.log('Server started on', port));
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
