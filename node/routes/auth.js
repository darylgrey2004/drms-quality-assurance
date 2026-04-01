const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
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
      email,
      password: hashedPassword,
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

const jwt = require('jsonwebtoken');
const transporter = require('../utils/mailer');

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

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
        if (user.status === 'pending') {
            return res.status(403).json({ msg: 'Your account is pending approval.' });
        }
        return res.status(403).json({ msg: 'Your account has not been approved.' });
    }

    // If not verified, send OTP
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

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // Token expires in 5 hours
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, role: user.role, isVerified: user.isVerified, firstName: user.firstName, lastName: user.lastName } });
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

    // OTP is valid, update user verification status
    await db.query("UPDATE users SET isVerified = TRUE WHERE email = ?", [email]);

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

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          msg: 'Account verified successfully!',
          token,
          user: { id: user.id, role: user.role, isVerified: true, firstName: user.firstName, lastName: user.lastName }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;