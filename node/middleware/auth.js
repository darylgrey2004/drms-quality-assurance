const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const db = require('../database');

async function auth(req, res, next) {
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
    
    // Check if user is external evaluator and if access has expired
    const userRole = (req.user?.role || '').toString().toLowerCase().trim();
    const isEvaluator = userRole === 'evaluator' || userRole === 'external evaluator';
    
    if (isEvaluator) {
      try {
        const [limits] = await db.query(
          'SELECT expiresAt FROM evaluator_access_limits WHERE user_id = ? LIMIT 1',
          [req.user.id]
        );
        
        if (limits.length > 0) {
          const expiresAt = new Date(limits[0].expiresAt);
          const now = new Date();
          // Set expiry to end of day for fair comparison
          expiresAt.setHours(23, 59, 59, 999);
          if (!Number.isNaN(expiresAt.getTime()) && expiresAt < now) {
            console.log('Auth failed: Evaluator access expired');
            return res.status(403).json({ msg: 'Your External Evaluator access has expired. Please contact the administrator.', expired: true });
          }
        }
      } catch (limitError) {
        if (limitError?.code !== 'ER_NO_SUCH_TABLE') {
          console.error('Error checking evaluator limits:', limitError);
        }
      }
    }
    
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