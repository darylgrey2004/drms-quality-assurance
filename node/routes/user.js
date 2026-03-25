const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');
const transporter = require('../utils/mailer');

// @route   GET api/user/profile/:userId
// @desc    Get user profile
// @access  Private
router.get('/profile/:userId', auth, async (req, res) => {
  const { userId } = req.params;

  console.log('=== GET Profile Request ===');
  console.log('Requested userId:', userId);
  console.log('Authenticated user:', req.user);
  console.log('Auth check:', req.user.id, 'vs', parseInt(userId));

  // Verify user is accessing their own profile or is admin
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    console.log('Authorization failed: User not authorized');
    return res.status(403).json({ msg: 'Not authorized to view this profile' });
  }

  try {
    const query = `
      SELECT 
        u.id, u.firstName, u.lastName, u.middleInitial, u.email, u.role, u.status, u.isVerified, u.createdAt, 
        fp.* 
      FROM users u
      LEFT JOIN faculty_profiles fp ON u.id = fp.user_id
      WHERE u.id = ?
    `;

    console.log('Executing query for userId:', userId);
    const [results] = await db.query(query, [userId]);
    console.log('Query results count:', results.length);

    if (results.length === 0) {
      console.log('User not found in database');
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log('Profile data found:', results[0]);
    res.json(results[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    console.error('Full error:', err);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/user/profile/:userId
// @desc    Update user profile
// @access  Private
router.put('/profile/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  const profileData = req.body;

  // Verify user is updating their own profile or is admin
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized to update this profile' });
  }

  try {
    // Update faculty_profiles table
    const [result] = await db.query(
      'UPDATE faculty_profiles SET ? WHERE user_id = ?',
      [profileData, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    res.json({ msg: 'Profile updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/user/send-otp
// @desc    Send OTP to user's email
// @access  Private
router.post('/send-otp', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const userEmail = users[0].email;

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // Store OTP in the database
    await db.query('DELETE FROM otps WHERE email = ?', [userEmail]); // Remove old OTPs
    await db.query('INSERT INTO otps (email, otp, expiresAt) VALUES (?, ?, ?)', [userEmail, otp, expiresAt]);

    // Send the email
    const mailOptions = {
      from: `"DRMS" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Your DRMS Verification Code',
      text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
      html: `<b>Your verification code is ${otp}</b>. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ msg: 'An OTP has been sent to your email address.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/user/verify-otp
// @desc    Verify the OTP
// @access  Private
router.post('/verify-otp', auth, async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ msg: 'Please provide the OTP' });
  }

  try {
    const [users] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const userEmail = users[0].email;

    // Find the OTP in the database
    const [otps] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ?',
      [userEmail, otp]
    );

    if (otps.length === 0) {
      return res.status(400).json({ msg: 'Invalid OTP.' });
    }

    const otpRecord = otps[0];

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
    }

    // OTP is valid, update user verification status
    await db.query("UPDATE users SET isVerified = TRUE WHERE email = ?", [userEmail]);

    // Delete the OTP from the database so it can't be reused
    await db.query('DELETE FROM otps WHERE id = ?', [otpRecord.id]);

    res.json({ msg: 'Account verified successfully!' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;