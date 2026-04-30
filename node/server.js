const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first - MUST be before other requires
dotenv.config({ path: path.join(__dirname, '.env') });

const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const documentRoutes = require('./routes/documents');
const approvalsRoutes = require('./routes/approvals');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalsRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
