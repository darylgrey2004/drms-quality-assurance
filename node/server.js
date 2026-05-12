const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first - MUST be before other requires
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const documentRoutes = require('./routes/documents');
const approvalsRoutes = require('./routes/approvals');
const analyticsRoutes = require('./routes/analytics');
const auditRoutes = require('./routes/audit');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
