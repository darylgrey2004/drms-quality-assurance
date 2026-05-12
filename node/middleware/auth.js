const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

function auth(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  console.log('=== Auth Middleware ===');
  console.log('Token received:', token ? 'Yes' : 'No');
  console.log('Token preview:', token?.substring(0, 20) + '...');

  // Check if not token
  if (!token) {
    console.log('Auth failed: No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    // Add user from payload
    req.user = decoded.user;
    console.log('User set in request:', req.user);
    next();
  } catch (e) {
    console.log('Auth failed: Token verification error:', e.message);
    res.status(400).json({ msg: 'Token is not valid' });
  }
}

function adminAuth(req, res, next) {
    auth(req, res, () => {
        const userRole = (req.user?.role || '').toString().toLowerCase().trim();
        if (userRole !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
        }
        next();
    });
}

module.exports = { auth, adminAuth };