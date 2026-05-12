const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const db = require('../database');
const crypto = require('crypto');
const UAParser = require('ua-parser-js');
const jwt = require('jsonwebtoken');
const transporter = require('../utils/mailer');

// Helper function to generate unique session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to create a session
async function createSession(userId, req) {
  try {
    const sessionToken = generateSessionToken();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    const browserInfo = `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim();
    const deviceInfo = `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim();
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'Unknown';

    await db.query(
      'INSERT INTO sessions (user_id, session_token, browser_info, device_info, ip_address, lastActive) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, sessionToken, browserInfo, deviceInfo, ipAddress]
    );

    return { sessionToken, browserInfo, deviceInfo, ipAddress };
  } catch (err) {
    console.error('Error creating session:', err.message);
    return null;
  }
}

// @route   GET api/auth/check-email-config
// @desc    Check email configuration (admin only)
// @access  Public (for debugging)
router.get('/check-email-config', async (req, res) => {
  res.json({
    emailUser: process.env.EMAIL_USER || 'NOT SET',
    hasEmailPassword: !!process.env.EMAIL_PASSWORD,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// @route   GET api/departments
// @desc    Get all active departments (public endpoint for registration)
// @access  Public
router.get('/departments', async (req, res) => {
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

// @route   GET api/auth/check-dept-head/:department
// @desc    Check if department head exists for a department
// @access  Public
router.get('/check-dept-head/:department', async (req, res) => {
  const { department } = req.params;

  try {
    // Check in faculty_profiles table for department heads
    // Department field stores full name like "Bachelor of Elementary Education (BEED)"
    const [profiles] = await db.query(
      `SELECT fp.id FROM faculty_profiles fp
       INNER JOIN users u ON fp.user_id = u.id
       WHERE u.role = 'department-head' AND fp.department LIKE ?
       LIMIT 1`,
      [`%${department}%`]
    );

    res.json({ exists: profiles.length > 0 });
  } catch (err) {
    console.error('Check dept head error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { firstName, lastName, middleInitial, email, password, role } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Validate role against ENUM values (only faculty and department-head allowed for registration)
  const validRoles = ['faculty', 'department-head'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ msg: 'Invalid role selected. Only Faculty and Department Head can register.' });
  }

  // Check if department head already exists for the department
  if (role === 'department-head') {
    const { department } = req.body;
    if (!department) {
      return res.status(400).json({ msg: 'Department is required for Department Head role' });
    }

    try {
      const [existingDeptHead] = await db.query(
        `SELECT fp.id FROM faculty_profiles fp
         INNER JOIN users u ON fp.user_id = u.id
         WHERE u.role = 'department-head' AND fp.department LIKE ?
         LIMIT 1`,
        [`%${department}%`]
      );

      if (existingDeptHead.length > 0) {
        return res.status(400).json({ msg: `A Department Head for ${department} already exists` });
      }
    } catch (checkErr) {
      console.error('Dept head check error:', checkErr.message);
      return res.status(500).json({ msg: 'Error checking department head availability' });
    }
  }

  try {
    // Check for existing user
    const [users] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const newUser = {
      firstName,
      lastName,
      middleInitial: middleInitial || null,
      email,
      password: hashedPassword,
      role,
      status: 'pending', // Default status
    };

    await db.query('INSERT INTO users SET ?', newUser);

    res.status(201).json({
      msg: 'Registration successful! Your account is pending approval from an administrator.',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user and send OTP if approved
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide an email and password' });
  }

  try {
    // Check for user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const user = users[0];
    const normalizedRole = (user.role || '').toString().toLowerCase().trim();
    const isEvaluatorRole = normalizedRole === 'evaluator' || normalizedRole === 'external evaluator';

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (isEvaluatorRole) {
      try {
        const [limits] = await db.query(
          'SELECT expiresAt FROM evaluator_access_limits WHERE user_id = ? LIMIT 1',
          [user.id]
        );
        if (limits.length > 0) {
          const expiresAt = new Date(limits[0].expiresAt);
          if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date()) {
            return res.status(403).json({ msg: 'Your External Evaluator access has expired. Please contact the administrator.' });
          }
        }
      } catch (limitError) {
        if (limitError?.code !== 'ER_NO_SUCH_TABLE') {
          throw limitError;
        }
      }
    }

    // Check if user is rejected
    if (user.status === 'rejected') {
        return res.status(403).json({ msg: 'Your account has been rejected. Please contact an administrator.' });
    }

    // If not verified (pending or approved but not yet verified), send OTP
    if (!user.isVerified) {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

      // Store OTP in the database
      await db.query('DELETE FROM otps WHERE email = ?', [email]); // Remove old OTPs
      await db.query('INSERT INTO otps (email, otp, expiresAt) VALUES (?, ?, ?)', [email, otp, expiresAt]);

      // Send the email
      try {
        const mailOptions = {
          from: `"DRMS-QA" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your DRMS-QA Verification Code',
          text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>DRMS-QA Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #0d9488; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>`,
        };
        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
        // Continue even if email fails
      }

      return res.json({ 
        requiresOTP: true, 
        userId: user.id,
        msg: 'An OTP has been sent to your email address.' 
      });
    }

    // User is authenticated and verified, generate token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Fetch faculty profile if exists (for department info)
    let department = null;
    try {
      const [profiles] = await db.query(
        'SELECT department FROM faculty_profiles WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (profiles.length > 0) {
        department = profiles[0].department;
      }
    } catch (profileErr) {
      // Profile table may not exist or no profile for this user
      console.log('Profile lookup skipped:', profileErr.message);
    }

    // Update lastActive timestamp on successful login
    try {
      await db.query(
        'UPDATE users SET lastActive = NOW() WHERE id = ?',
        [user.id]
      );
    } catch (updateErr) {
      // If column doesn't exist yet, continue anyway
      if (!updateErr.message || !updateErr.message.includes('Unknown column')) {
        console.error('Error updating lastActive:', updateErr.message);
      }
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // Token expires in 5 hours
      async (err, token) => {
        if (err) throw err;
        
        // Create session for this login
        const sessionData = await createSession(user.id, req);
        
        res.json({ 
          token, 
          sessionToken: sessionData?.sessionToken,
          user: { 
            id: user.id, 
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role, 
            isVerified: user.isVerified,
            department: department
          },
          session: sessionData
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and complete login
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ msg: 'Please provide email and OTP' });
  }

  try {
    // Find the OTP in the database
    const [otps] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ?',
      [email, otp]
    );

    if (otps.length === 0) {
      return res.status(400).json({ msg: 'Invalid OTP.' });
    }

    const otpRecord = otps[0];

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
    }

    // OTP is valid, update user verification status and approve the account
    await db.query("UPDATE users SET isVerified = TRUE, status = 'approved', lastActive = NOW() WHERE email = ?", [email]);

    // Delete the OTP from the database
    await db.query('DELETE FROM otps WHERE id = ?', [otpRecord.id]);

    // Get user info and generate token
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Fetch faculty profile if exists (for department info)
    let department = null;
    try {
      const [profiles] = await db.query(
        'SELECT department FROM faculty_profiles WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (profiles.length > 0) {
        department = profiles[0].department;
      }
    } catch (profileErr) {
      // Profile table may not exist or no profile for this user
      console.log('Profile lookup skipped:', profileErr.message);
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      async (err, token) => {
        if (err) throw err;
        
        // Create session for this login
        const sessionData = await createSession(user.id, req);
        
        res.json({ 
          msg: 'Account verified successfully!',
          token, 
          sessionToken: sessionData?.sessionToken,
          user: { 
            id: user.id, 
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role, 
            isVerified: true,
            department: department
          },
          session: sessionData
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: 'Please provide an email address' });
  }

  try {
    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ msg: 'No account found with this email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.query('DELETE FROM otps WHERE email = ?', [email]);
    await db.query('INSERT INTO otps (email, otp, expiresAt) VALUES (?, ?, ?)', [email, otp, expiresAt]);

    // Send email
    try {
      const mailOptions = {
        from: `"DRMS-QA" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Verification Code',
        text: `Your password reset verification code is ${otp}. It will expire in 10 minutes.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Your verification code is:</p>
          <h1 style="color: #0d9488; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>`,
      };
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      return res.status(500).json({ msg: 'Failed to send verification email' });
    }

    res.json({ msg: 'Verification code sent to your email address' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/verify-reset-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ msg: 'Please provide email and OTP' });
  }

  try {
    // Find OTP in database
    const [otps] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ?',
      [email, otp]
    );

    if (otps.length === 0) {
      return res.status(400).json({ msg: 'Invalid verification code' });
    }

    const otpRecord = otps[0];

    // Check if OTP expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ msg: 'Verification code has expired. Please request a new one.' });
    }

    // OTP is valid - don't delete yet, will delete after password reset
    res.json({ msg: 'Verification code confirmed' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password after OTP verification
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ msg: 'Please provide email and new password' });
  }

  try {
    // Verify user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Delete OTP
    await db.query('DELETE FROM otps WHERE email = ?', [email]);

    res.json({ msg: 'Password reset successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/change-password
// @desc    Change password for logged-in user
// @access  Private
const { auth } = require('../middleware/auth');

router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: 'Please provide current password and new password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'New password must be at least 6 characters long' });
  }

  try {
    // Get user from database
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    // Log the password change in audit logs
    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES (?, 'PASSWORD_CHANGED', 'user', ?, ?, ?)`,
        [req.user.id, req.user.id, ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) {
      console.log('Audit log skipped:', auditErr.message);
    }

    res.json({ msg: 'Password changed successfully' });

  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/change-email/send-otp
// @desc    Send OTP to current email for email change verification
// @access  Private
router.post('/change-email/send-otp', auth, async (req, res) => {
  const { newEmail } = req.body;

  if (!newEmail) {
    return res.status(400).json({ msg: 'Please provide a new email address' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ msg: 'Please provide a valid email address' });
  }

  try {
    // Get current user
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const user = users[0];
    const currentEmail = user.email;

    // Check if new email is same as current
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      return res.status(400).json({ msg: 'New email must be different from current email' });
    }

    // Check if new email already exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, req.user.id]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ msg: 'This email is already registered to another account' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with current email (not new email) and include new email in a separate field
    await db.query('DELETE FROM otps WHERE email = ?', [currentEmail]);
    await db.query(
      'INSERT INTO otps (email, otp, expiresAt) VALUES (?, ?, ?)',
      [currentEmail, otp, expiresAt]
    );

    // Send OTP to CURRENT email for verification
    try {
      const mailOptions = {
        from: `"DRMS-QA" <${process.env.EMAIL_USER}>`,
        to: currentEmail,
        subject: 'Email Change Verification Code',
        text: `You requested to change your email to ${newEmail}. Your verification code is ${otp}. It will expire in 10 minutes.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Change Request</h2>
          <p>You requested to change your email address to: <strong>${newEmail}</strong></p>
          <p>Your verification code is:</p>
          <h1 style="color: #0d9488; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email and secure your account.</p>
        </div>`,
      };
      await transporter.sendMail(mailOptions);
      console.log('Email change OTP sent successfully to current email:', currentEmail);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      console.error('Email config:', { user: process.env.EMAIL_USER, hasPassword: !!process.env.EMAIL_PASSWORD });
      return res.status(500).json({ msg: 'Failed to send verification email. Please check your email configuration.' });
    }

    res.json({ msg: `Verification code sent to your current email address (${currentEmail})` });

  } catch (err) {
    console.error('Send OTP error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   POST api/auth/change-email/verify-otp
// @desc    Verify OTP from current email and change to new email
// @access  Private
router.post('/change-email/verify-otp', auth, async (req, res) => {
  const { newEmail, otp } = req.body;

  if (!newEmail || !otp) {
    return res.status(400).json({ msg: 'Please provide email and OTP' });
  }

  try {
    // Get current user
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const user = users[0];
    const currentEmail = user.email;

    // Find OTP in database using CURRENT email (not new email)
    const [otps] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ?',
      [currentEmail, otp]
    );

    if (otps.length === 0) {
      return res.status(400).json({ msg: 'Invalid verification code' });
    }

    const otpRecord = otps[0];

    // Check if OTP expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ msg: 'Verification code has expired. Please request a new one.' });
    }

    // Check if new email already exists (double check)
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, req.user.id]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ msg: 'This email is already registered to another account' });
    }

    // Update user email
    await db.query('UPDATE users SET email = ? WHERE id = ?', [newEmail, req.user.id]);

    // Delete OTP
    await db.query('DELETE FROM otps WHERE id = ?', [otpRecord.id]);

    // Log the email change in audit logs
    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES (?, 'EMAIL_CHANGED', 'user', ?, ?, ?)`,
        [req.user.id, req.user.id, ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) {
      console.log('Audit log skipped:', auditErr.message);
    }

    res.json({ msg: 'Email changed successfully' });

  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;