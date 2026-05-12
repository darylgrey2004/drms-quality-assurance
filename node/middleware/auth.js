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
      console.log('>>> Evaluator detected, checking expiry for user:', req.user.id);
      try {
        const [limits] = await db.query(
          'SELECT expiresAt FROM evaluator_access_limits WHERE user_id = ? LIMIT 1',
          [req.user.id]
        );
        
        console.log('>>> Query result:', limits);
        
        if (limits.length > 0) {
          const expiresAt = new Date(limits[0].expiresAt);
          const now = new Date();
          
          console.log('>>> Expiry from DB:', limits[0].expiresAt);
          console.log('>>> Expiry Date:', expiresAt);
          console.log('>>> Current Date:', now);
          console.log('>>> Expiry ISO:', expiresAt.toISOString());
          console.log('>>> Now ISO:', now.toISOString());
          console.log('>>> Token issued at (iat):', decoded.iat);
          console.log('>>> Token issued date:', new Date(decoded.iat * 1000).toISOString());
          console.log('>>> Is Expired (now >= expiresAt):', now >= expiresAt);
          console.log('>>> Time diff (ms):', now.getTime() - expiresAt.getTime());
          
          // Block if current time is past expiry OR if token was issued before expiry but we're now past it
          if (!Number.isNaN(expiresAt.getTime()) && now >= expiresAt) {
            console.log('>>> BLOCKING: Evaluator access expired');
            return res.status(403).json({ msg: 'Your External Evaluator access has expired. Please contact the administrator.', expired: true });
          }
          console.log('>>> Evaluator access still valid');
        } else {
          console.log('>>> No expiry limit found for this evaluator');
        }
      } catch (limitError) {
        console.error('>>> Error checking evaluator limits:', limitError);
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