const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// @route   POST api/profile/faculty
// @desc    Create a new user and faculty profile
// @access  Public
router.post('/faculty', async (req, res) => {
    // Destructure the combined data from the request body
    const {
        // User data from registration
        firstName,
        lastName,
        middleInitial,
        email,
        password,
        role,
        // Employment data from faculty form (only 4 fields)
        employeeId,
        position,
        department,
        employmentStatus
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ msg: 'Registration data is missing. Please start over.' });
    }

    if (!employeeId || !position || !department || !employmentStatus) {
        return res.status(400).json({ msg: 'All employment fields are required.' });
    }

    try {
        // Check if user already exists
        let [users] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert into 'users' table
        const newUser = {
            firstName,
            lastName,
            middleInitial,
            email,
            password: hashedPassword,
            role: role,
            status: 'pending'
        };

        const [result] = await db.query('INSERT INTO users SET ?', newUser);
        const userId = result.insertId;

        // Insert into 'faculty_profiles' table (only 4 employment fields)
        const newProfile = {
            user_id: userId,
            employeeId,
            position,
            department,
            employmentStatus
        };

        await db.query('INSERT INTO faculty_profiles SET ?', newProfile);

        // Send success response
        res.status(201).json({ msg: 'Registration complete! Please log in and verify your WMSU email via OTP to activate your account.' });

    } catch (err) {
        console.error('Error during faculty profile creation:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
