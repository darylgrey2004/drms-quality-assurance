const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables (optional for production)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

console.log('=== DRMS-QA Starting ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('EMAIL_USER:', process.env.EMAIL_USER);

try {
  console.log('Loading dependencies...');
  const cors = require('cors');
  console.log('Loading routes...');
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
  console.log('Loading database...');
  const db = require('./node/database');
  console.log('All modules loaded successfully');

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
  console.log('Starting server on port:', port);
  app.listen(port, '0.0.0.0', () => {
    console.log(`DRMS-QA Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('FATAL ERROR during startup:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}
