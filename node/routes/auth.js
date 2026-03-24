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

// @route   POST api/auth/login
// @desc    Authenticate user and get token
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

    // User is authenticated, generate token
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
        res.json({ token, user: { id: user.id, role: user.role, isVerified: user.isVerified } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;