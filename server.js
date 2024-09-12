const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '@Priyanshu100', // use environment variable
  database: process.env.DB_NAME || 'cb_admin'  // use environment variable
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static file serving for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Function to execute queries
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Routes
app.get('/Update/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const query = 'SELECT * FROM employee WHERE employee_id = ?';

  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Error fetching employee data:', err);
      return res.status(500).send('Error fetching employee data');
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send('Employee not found');
    }
  });
});
// Add Site
app.post('/addsite', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const sql = 'INSERT INTO sites (name) VALUES (?)';
  try {
    await query(sql, [name]);
    res.status(200).json({ message: 'Site added successfully' });
  } catch (err) {
    console.error('Error adding site:', err);
    res.status(500).json({ message: 'Error adding site' });
  }
});

// Add Holiday
app.post('/AddHolidayScreen', async (req, res) => {
  const { holiday_name, holiday_date } = req.body;
  try {
    await query('INSERT INTO holidays (holiday_name, holiday_date) VALUES (?, ?)', [holiday_name, holiday_date]);
    res.status(201).json({ message: 'Holiday added successfully' });
  } catch (err) {
    console.error('Error adding holiday:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Holiday List
app.get('/HolidayList', async (req, res) => {
  try {
    const results = await query('SELECT * FROM holidays');
    res.json(results);
  } catch (err) {
    console.error('Error fetching holidays:', err);
    res.status(500).json({ error: 'Error fetching holidays' });
  }
});

// Add Employee

app.post('/AddEmployee', async (req, res) => {
  const {
    employee_username,
    employee_name,
    employee_address,
    date_of_birth,
    mobile_no,
    email_address,
    password,
    designation,
    currency_symbol,
    current_salary,
    working_hours_from,
    working_hours_to,
    salary_type,
  } = req.body;

  // Basic validation
  if (
    !employee_username || 
    !employee_name || 
    !employee_address || 
    !date_of_birth || 
    !mobile_no || 
    !email_address || 
    !password || 
    !designation || 
    !currency_symbol || 
    !current_salary || 
    !working_hours_from || 
    !working_hours_to || 
    !salary_type
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `INSERT INTO employee 
    (employee_username, employee_name, employee_address, date_of_birth, mobile_no, email_address, password, designation, currency_symbol, current_salary, salary_type, working_hours_from, working_hours_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    await query(sql, [
      employee_username,
      employee_name,
      employee_address,
      date_of_birth,
      mobile_no,
      email_address,
      password, // Store the plain password
      designation,
      currency_symbol,
      current_salary,
      salary_type,
      working_hours_from,
      working_hours_to
    ]);
    res.status(200).json({ message: 'Employee added successfully' });
  } catch (err) {
    console.error('Error adding employee:', err.message); // Log the error message for debugging
    res.status(500).json({ message: 'Error adding employee', error: err.message });
  }
});


// Add Notice
app.post('/AddNoticeScreen', async (req, res) => {
  const { text } = req.body;
  try {
    await query('INSERT INTO notices (text) VALUES (?)', [text]);
    res.status(201).json({ message: 'Notice added successfully' });
  } catch (err) {
    console.error('Error adding notice:', err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/Employee', async (req, res) => {
  try {
    const results = await query('SELECT * FROM employee');
    res.json(results);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Notice List
app.get('/Notice', async (req, res) => {
  try {
    const results = await query('SELECT * FROM notices ORDER BY timestamp DESC');
    res.json(results);
  } catch (err) {
    console.error('Error fetching notices:', err);
    res.status(500).json({ error: 'Error fetching notices' });
  }
});

// Delete Notice
app.delete('/Notice/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM notices WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting notice:', err);
    res.status(500).json({ error: 'Error deleting notice' });
  }
});



// Get Salary Details by Username
app.get('/Page/:employeeUsername', async (req, res) => {
  const { employeeUsername } = req.params;

  if (!employeeUsername) {
    return res.status(400).json({ error: 'Employee Username is required' });
  }

  try {
    const results = await query('SELECT * FROM salary_details WHERE employee_username = ?', [employeeUsername]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Salary details not found' });
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching salary details:', err);
    res.status(500).json({ error: 'An error occurred while fetching salary details' });
  }
});


app.get('/ConfirmedEmployee/:employeeUsername', async (req, res) => {
  const { employeeUsername } = req.params;

  if (!employeeUsername) {
    return res.status(400).json({ error: 'Employee Username is required' });
  }

  try {
    const results = await query('SELECT * FROM confirm_salary WHERE employee_username = ?', [employeeUsername]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No confirmed salary details found' });
    }

    res.json(results); // Return all results
  } catch (err) {
    console.error('Error fetching confirmed salary details:', err);
    res.status(500).json({ error: 'An error occurred while fetching confirmed salary details' });
  }
});

// app.post('/Login', (req, res) => {
//   const { email, password } = req.body;
//   const query = 'SELECT * FROM employee WHERE email_address = ? AND password = ?';
//   db.query(query, [email, password], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     if (results.length > 0) {
//       return res.status(200).json({ success: true, employee: results[0] });
//     } else {
//       return res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }
//   });
// });

const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey'; // Replace this with a strong secret key and consider storing it in environment variables

app.post('/Login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM employee WHERE email_address = ? AND password = ?';
  
  console.log(`Received login request for email: ${email}`);

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log('Database query results:', results);

    if (results.length > 0) {
      const employee = results[0];
      
      // Generate a token
      const token = jwt.sign(
        { id: employee.id, email: employee.email_address },
        secretKey,
        { expiresIn: '1h' } // Token expires in 1 hour
      );

      console.log('Token generated:', token);

      return res.status(200).json({
        success: true,
        employee: employee,
        token: token
      });
    } else {
      console.log('Invalid credentials for email:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Get Sites
app.get('/site', async (req, res) => {
  try {
    const results = await query('SELECT * FROM sites');
    res.json(results);
  } catch (err) {
    console.error('Error fetching sites:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Employee by ID
app.put('/Update/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  const {
    employee_name,
    employee_username,
    employee_address,
    date_of_birth,
    mobile_no,
    email_address,
    password,
    designation,
    currency_symbol,
    salary_type,
    current_salary,
    working_hours_from,
    working_hours_to,
  } = req.body;

  const sql = `UPDATE employee
    SET
      employee_name = ?,
      employee_username = ?,
      employee_address = ?,
      date_of_birth = ?,
      mobile_no = ?,
      email_address = ?,
      password = ?,
      designation = ?,
      currency_symbol = ?,
      salary_type = ?,
      current_salary = ?,
      working_hours_from = ?,
      working_hours_to = ?
    WHERE employee_id = ?`;

  try {
    await query(sql, [
      employee_name,
      employee_username,
      employee_address,
      date_of_birth,
      mobile_no,
      email_address,
      password,
      designation,
      currency_symbol,
      salary_type,
      current_salary,
      working_hours_from,
      working_hours_to,
      employeeId
    ]);
    res.status(200).json({ message: 'Employee updated successfully' });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Error updating employee' });
  }
});

app.get('/ViewAtt/:employeeUsername', (req, res) => {
  const employeeUsername = req.params.employeeUsername;
  const status = req.query.status;
  const month = req.query.month; // Assuming month is passed as 'MM'
  const year = req.query.year;   // Assuming year is passed as 'YYYY'

  let query;
  let queryParams = [employeeUsername];

  if (status === 'On Leave') {
    query = `
      SELECT * FROM leave_application 
      WHERE employee_username = ? 
      AND MONTH(applied_on) = ? 
      AND YEAR(applied_on) = ?`;
    queryParams.push(month, year);
  } else if (status === 'Present') {
    query = `
      SELECT * FROM mark_attendance 
      WHERE employee_username = ? 
      AND MONTH(attendance_date) = ? 
      AND YEAR(attendance_date) = ?`;
    queryParams.push(month, year);
  } else {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.query(query, queryParams, (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/ListEmp', async (req, res) => {
  try {
    const results = await query('SELECT * FROM employee');
    res.json(results);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/site/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM sites WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).send('Server error');
    }
    res.send('Site deleted successfully');
  });
});
app.get('/Leave', (req, res) => {
  const sql = 'SELECT * FROM leave_application';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.post('/Salary/:employeeUsername', async (req, res) => {
  const { employeeUsername } = req.params;
  const { total_salary, advance_taken_amount, advance_taken_date, bonus_amount, bonus_date, final_salary, advance_reason, bonus_reason } = req.body;

  const queryStr = `
    INSERT INTO salary_details (employee_username, total_salary, advance_taken_amount, advance_taken_date, bonus_amount, bonus_date, final_salary, advance_reason, bonus_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    total_salary = VALUES(total_salary),
    advance_taken_amount = VALUES(advance_taken_amount),
    advance_taken_date = VALUES(advance_taken_date),
    bonus_amount = VALUES(bonus_amount),
    bonus_date = VALUES(bonus_date),
    final_salary = VALUES(final_salary),
    advance_reason = VALUES(advance_reason),
    bonus_reason = VALUES(bonus_reason);
  `;

  try {
    await query(queryStr, [
      employeeUsername, 
      total_salary, 
      advance_taken_amount, 
      advance_taken_date, 
      bonus_amount, 
      bonus_date, 
      final_salary, 
      advance_reason, 
      bonus_reason
    ]);
    res.status(200).send('Salary data saved successfully');
  } catch (err) {
    console.error('Error saving salary data:', err);
    res.status(500).send('Error saving salary data');
  }
});

app.get('/List', async (req, res) => {
  try {
    const results = await query('SELECT * FROM employee');
    res.json(results);
  } catch (err) {
    console.error('Error fetching employee list:', err);
    res.status(500).json({ error: err.message });
  }
});
app.delete('/List/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM employee WHERE employee_id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});
// Endpoint to fetch confirmations for a specific notice
app.get('/NoticeDetailsScreen/:noticeId', (req, res) => {
  const { noticeId } = req.params;
  const sql = `
    SELECT employee_username, confirmed_at 
    FROM notice_confirmations 
    WHERE notice_id = ?
  `;

  db.query(sql, [noticeId], (err, results) => {
    if (err) {
      console.error('Error fetching confirmations:', err);
      res.status(500).send('Failed to fetch confirmations');
    } else {
      res.json(results);
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
