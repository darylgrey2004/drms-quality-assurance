const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const cors = require('cors');
const authRoutes = require('./node/routes/auth');
const adminRoutes = require('./node/routes/admin');
const userRoutes = require('./node/routes/user');
const profileRoutes = require('./node/routes/profile');
const documentRoutes = require('./node/routes/documents');
const approvalsRoutes = require('./node/routes/approvals');
const analyticsRoutes = require('./node/routes/analytics');
const auditRoutes = require('./node/routes/audit');
const reportsRoutes = require('./node/routes/reports');
const settingsRoutes = require('./node/routes/settings');
const db = require('./node/database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/uploads', express.static(path.join(__dirname, 'node/uploads')));

// Public departments endpoint (no auth required for registration)
app.get('/api/departments', async (req, res) => {
  try {
    const [departments] = await db.query(
      'SELECT id, code, name FROM departments WHERE is_active = 1 ORDER BY code ASC'
    );
    res.json(departments);
  } catch (err) {
    console.error('Get departments error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/documents/analytics', analyticsRoutes);
app.use('/api/documents/reports', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Serve frontend HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('*.html', (req, res) => {
  res.sendFile(path.join(__dirname, req.path));
});

// Start server
app.listen(port, () => {
  console.log(`DRMS-QA Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
