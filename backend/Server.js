require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'berwa_housing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to execute SQL queries
async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes

// User Registration (for secretaries)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    // Validate input
    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT * FROM Users WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    await executeQuery(
      'INSERT INTO Users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, role]
    );
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const users = await executeQuery(
      'SELECT * FROM Users WHERE username = ?', 
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Client Management Routes

// Create Client
app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { name, contactInfo, address, notes } = req.body;
    
    if (!name || !contactInfo) {
      return res.status(400).json({ error: 'Name and contact info are required' });
    }
    
    const result = await executeQuery(
      'INSERT INTO Clients (name, contactInfo, address, notes) VALUES (?, ?, ?, ?)',
      [name, contactInfo, address || null, notes || null]
    );
    
    res.status(201).json({ 
      message: 'Client created successfully',
      clientId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const clients = await executeQuery('SELECT * FROM Clients');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Single Client
app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clients = await executeQuery('SELECT * FROM Clients WHERE clientId = ?', [id]);
    
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(clients[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Client
app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactInfo, address, notes } = req.body;
    
    if (!name || !contactInfo) {
      return res.status(400).json({ error: 'Name and contact info are required' });
    }
    
    await executeQuery(
      'UPDATE Clients SET name = ?, contactInfo = ?, address = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE clientId = ?',
      [name, contactInfo, address || null, notes || null, id]
    );
    
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Client
app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await executeQuery('DELETE FROM Clients WHERE clientId = ?', [id]);
    
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report Generation

// Generate PDF Report
app.get('/api/reports/clients/pdf', authenticateToken, async (req, res) => {
  try {
    const clients = await executeQuery('SELECT * FROM Clients');
    
    const doc = new PDFDocument();
    const filename = `clients-report-${Date.now()}.pdf`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    doc.pipe(res);
    
    doc.fontSize(20).text('BERWA HOUSING - Clients Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(14).text(`Total Clients: ${clients.length}`);
    doc.moveDown(2);
    
    clients.forEach((client, index) => {
      doc.fontSize(12).text(`${index + 1}. ${client.name}`);
      doc.fontSize(10).text(`Contact: ${client.contactInfo}`);
      if (client.address) doc.text(`Address: ${client.address}`);
      if (client.notes) doc.text(`Notes: ${client.notes}`);
      doc.moveDown();
    });
    
    doc.end();
    
    // Save report record
    await executeQuery(
      'INSERT INTO Reports (userId, reportType, details) VALUES (?, ?, ?)',
      [req.user.userId, 'PDF', `Client report with ${clients.length} records`]
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate Excel Report
app.get('/api/reports/clients/excel', authenticateToken, async (req, res) => {
  try {
    const clients = await executeQuery('SELECT * FROM Clients');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clients');
    
    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'clientId', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Contact Info', key: 'contactInfo', width: 30 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Notes', key: 'notes', width: 50 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];
    
    // Add data
    clients.forEach(client => {
      worksheet.addRow(client);
    });
    
    // Add summary
    worksheet.addRow([]);
    worksheet.addRow(['Total Clients:', clients.length]);
    
    // Set response headers
    const filename = `clients-report-${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
    
    // Save report record
    await executeQuery(
      'INSERT INTO Reports (userId, reportType, details) VALUES (?, ?, ?)',
      [req.user.userId, 'Excel', `Client report with ${clients.length} records`]
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Report History
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await executeQuery(
      'SELECT r.*, u.username FROM Reports r JOIN Users u ON r.userId = u.userId ORDER BY r.generatedAt DESC'
    );
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});