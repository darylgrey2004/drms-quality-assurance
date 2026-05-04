const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const { auth } = require('../middleware/auth');

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
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
});

// @route   PUT api/profile/update
// @desc    Update user profile information
// @access  Private
router.put('/update', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            firstName,
            lastName,
            middleInitial,
            dateOfBirth,
            age,
            gender,
            civilStatus,
            nationality,
            phone,
            address
        } = req.body;

        // Update users table
        await db.query(
            'UPDATE users SET firstName = ?, lastName = ?, middleInitial = ? WHERE id = ?',
            [firstName, lastName, middleInitial, userId]
        );

        // Check if faculty profile exists
        const [profile] = await db.query('SELECT id FROM faculty_profiles WHERE user_id = ?', [userId]);
        
        if (profile.length > 0) {
            // Update existing profile
            await db.query(
                `UPDATE faculty_profiles SET 
                    dateOfBirth = ?, age = ?, gender = ?, civilStatus = ?, 
                    nationality = ?, phone = ?, address = ?
                WHERE user_id = ?`,
                [dateOfBirth, age, gender, civilStatus, nationality, phone, address, userId]
            );
        } else {
            // Create new profile
            await db.query(
                `INSERT INTO faculty_profiles 
                (user_id, dateOfBirth, age, gender, civilStatus, nationality, phone, address) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, dateOfBirth, age, gender, civilStatus, nationality, phone, address]
            );
        }

        res.json({ msg: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [users] = await db.query(
            'SELECT id, email, firstName, lastName, middleInitial, role, status FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        const user = users[0];
        
        // Get faculty profile if exists
        const [profiles] = await db.query(
            'SELECT * FROM faculty_profiles WHERE user_id = ?',
            [userId]
        );
        
        const profile = profiles.length > 0 ? profiles[0] : null;
        
        res.json({
            user,
            profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
