require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('warehouseride.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize database tables
const initDb = async () => {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        company TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified BOOLEAN DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        message TEXT NOT NULL,
        sender TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

// Fallback to test SMTP if Gmail not configured
const testTransporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false,
});

async function sendEmail(to, subject, html) {
  try {
    const mailOptions = { from: 'hello@warehouseride.com', to, subject, html };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.warn('Email service unavailable, skipping:', error.message);
    return false;
  }
}

// Helper functions
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function resolveCustomerId(customerIdOrEmail) {
  if (!customerIdOrEmail) return null;

  // If likely a UUID, try matching directly
  let customer = await dbGet('SELECT id FROM customers WHERE id = ?', [customerIdOrEmail]);
  if (customer) {
    return customer.id;
  }

  // If this is an email, resolve to a customer ID
  if (customerIdOrEmail.includes('@')) {
    customer = await dbGet('SELECT id FROM customers WHERE email = ?', [customerIdOrEmail.toLowerCase()]);
    if (customer) {
      return customer.id;
    }
  }

  return customerIdOrEmail;
}

// AUTHENTICATION ROUTES

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingCustomer = await dbGet('SELECT id FROM customers WHERE email = ?', [email]);
    if (existingCustomer) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const passwordHash = hashPassword(password);

    await dbRun(
      `INSERT INTO customers (id, name, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id, name, email, passwordHash]
    );

    const verificationToken = generateToken();
    await sendEmail(
      email,
      'Welcome to WarehouseRide',
      `<h2>Welcome, ${name}!</h2><p>Your account has been created. Sign in to access your transport dashboard.</p>`
    );

    res.json({ success: true, customerId: id, message: 'Account created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const customer = await dbGet(
      'SELECT id, name, email, password_hash FROM customers WHERE email = ?',
      [email]
    );

    if (!customer || !verifyPassword(password, customer.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Sign in failed' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customer = await dbGet('SELECT id, name FROM customers WHERE email = ?', [email]);

    if (!customer) {
      return res.json({ success: true, message: 'If the email exists, reset instructions have been sent' });
    }

    const resetId = uuidv4();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    await dbRun(
      `INSERT INTO password_resets (id, customer_id, token, expires_at)
       VALUES (?, ?, ?, ?)`,
      [resetId, customer.id, token, expiresAt]
    );

    await sendEmail(
      email,
      'Password Reset Request',
      `<h2>Reset Your Password</h2><p>Click <a href="http://localhost:3000/reset-password.html?token=${token}">here</a> to reset your password. This link expires in 1 hour.</p>`
    );

    res.json({ success: true, message: 'Reset link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    const reset = await dbGet(
      `SELECT customer_id, expires_at FROM password_resets WHERE token = ?`,
      [token]
    );

    if (!reset || new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const passwordHash = hashPassword(newPassword);
    await dbRun('UPDATE customers SET password_hash = ? WHERE id = ?', [passwordHash, reset.customer_id]);
    await dbRun('DELETE FROM password_resets WHERE token = ?', [token]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// ENQUIRY ROUTES

// Create Enquiry
app.post('/api/enquiries', async (req, res) => {
  try {
    const { customerId, serviceType, message } = req.body;

    if (!customerId || !serviceType) {
      return res.status(400).json({ error: 'Customer ID and service type required' });
    }

    const resolvedCustomerId = await resolveCustomerId(customerId);
    if (!resolvedCustomerId) {
      return res.status(400).json({ error: 'Invalid customer reference' });
    }

    const enquiryId = uuidv4();
    await dbRun(
      `INSERT INTO enquiries (id, customer_id, service_type, message)
       VALUES (?, ?, ?, ?)`,
      [enquiryId, resolvedCustomerId, serviceType, message || '']
    );

    const customer = await dbGet('SELECT email, name FROM customers WHERE id = ?', [resolvedCustomerId]);
    if (customer) {
      await sendEmail(
        'admin@warehouseride.com',
        `New Enquiry: ${serviceType}`,
        `<h3>New transport enquiry from ${customer.name}</h3><p>Email: ${customer.email}</p><p>Service: ${serviceType}</p><p>Message: ${message}</p>`
      );
    }

    res.json({ success: true, enquiryId });
  } catch (error) {
    console.error('Enquiry error:', error);
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// Get Enquiries by Customer
app.get('/api/enquiries/:customerId', async (req, res) => {
  try {
    const enquiries = await dbAll(
      'SELECT * FROM enquiries WHERE customer_id = ? ORDER BY created_at DESC',
      [req.params.customerId]
    );
    res.json(enquiries);
  } catch (error) {
    console.error('Fetch enquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// CHAT ROUTES

// Save Chat Message
app.post('/api/chat/message', async (req, res) => {
  try {
    const { customerId, message, sender } = req.body;

    if (!customerId || !message) {
      return res.status(400).json({ error: 'Customer ID and message required' });
    }

    const resolvedCustomerId = await resolveCustomerId(customerId);
    const messageId = uuidv4();
    await dbRun(
      `INSERT INTO chat_messages (id, customer_id, message, sender)
       VALUES (?, ?, ?, ?)`,
      [messageId, resolvedCustomerId, message, sender || 'customer']
    );

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get Chat History
app.get('/api/chat/:customerId', async (req, res) => {
  try {
    const messages = await dbAll(
      'SELECT * FROM chat_messages WHERE customer_id = ? ORDER BY created_at ASC',
      [req.params.customerId]
    );
    res.json(messages);
  } catch (error) {
    console.error('Fetch chat error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// CUSTOMER PROFILE ROUTES
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    const customer = await dbGet(
      'SELECT id, name, email, phone, company, created_at FROM customers WHERE id = ?',
      [req.params.customerId]
    );
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Fetch customer profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/customers/:customerId', async (req, res) => {
  try {
    const { name, phone, company } = req.body;
    const { customerId } = req.params;

    const existingCustomer = await dbGet('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await dbRun(
      'UPDATE customers SET name = ?, phone = ?, company = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || null, phone || null, company || null, customerId]
    );

    const updatedCustomer = await dbGet(
      'SELECT id, name, email, phone, company, created_at FROM customers WHERE id = ?',
      [customerId]
    );
    res.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ADMIN ROUTES

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await dbGet(
      'SELECT id, username, password_hash FROM admin_users WHERE username = ?',
      [username]
    );

    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ success: true, adminId: admin.id, username: admin.username });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get All Customers
app.get('/api/admin/customers', async (req, res) => {
  try {
    const customers = await dbAll(
      'SELECT id, name, email, phone, company, created_at FROM customers ORDER BY created_at DESC'
    );
    res.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get All Enquiries
app.get('/api/admin/enquiries', async (req, res) => {
  try {
    const enquiries = await dbAll(`
      SELECT e.id, e.customer_id, c.name, c.email, e.service_type, e.message, e.status, e.created_at
      FROM enquiries e
      JOIN customers c ON e.customer_id = c.id
      ORDER BY e.created_at DESC
    `);
    res.json(enquiries);
  } catch (error) {
    console.error('Fetch enquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// Update Enquiry Status
app.patch('/api/admin/enquiries/:enquiryId', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await dbRun(
      'UPDATE enquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.enquiryId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update enquiry error:', error);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// Get Customer Details
app.get('/api/admin/customers/:customerId', async (req, res) => {
  try {
    const customer = await dbGet(
      'SELECT id, name, email, phone, company, created_at FROM customers WHERE id = ?',
      [req.params.customerId]
    );
    const enquiries = await dbAll(
      'SELECT * FROM enquiries WHERE customer_id = ? ORDER BY created_at DESC',
      [req.params.customerId]
    );
    const messages = await dbAll(
      'SELECT * FROM chat_messages WHERE customer_id = ? ORDER BY created_at DESC',
      [req.params.customerId]
    );

    res.json({ customer, enquiries, messages });
  } catch (error) {
    console.error('Fetch customer details error:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// Create Admin User (initialization endpoint - should be protected in production)
app.post('/api/admin/create', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }

    const existingAdmin = await dbGet(
      'SELECT id FROM admin_users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingAdmin) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const id = uuidv4();
    const passwordHash = hashPassword(password);

    await dbRun(
      `INSERT INTO admin_users (id, username, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id, username, email, passwordHash]
    );

    res.json({ success: true, adminId: id });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Initialize server
(async () => {
  await initDb();

  // Create default admin if none exists
  const adminCount = await dbGet('SELECT COUNT(*) as count FROM admin_users');
  if (adminCount.count === 0) {
    const adminId = uuidv4();
    const adminHash = hashPassword('admin123');
    await dbRun(
      `INSERT INTO admin_users (id, username, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [adminId, 'admin', 'admin@warehouseride.com', adminHash]
    );
    console.log('Default admin created: username=admin, password=admin123');
  }

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('API endpoints available at /api/*');
    console.log('Admin dashboard at http://localhost:' + PORT + '/admin.html');
  });
})();
