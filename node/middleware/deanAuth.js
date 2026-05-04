// middleware/deanAuth.js
const { auth } = require('./auth');

// Middleware to check if user is admin or dean
function deanAuth(req, res, next) {
    auth(req, res, () => {
        const userRole = (req.user?.role || '').toString().toLowerCase().trim();
        if (userRole !== 'admin' && userRole !== 'dean') {
            return res.status(403).json({ msg: 'Access denied. Admin or Dean privileges required.' });
        }
        next();
    });
}

module.exports = deanAuth;
