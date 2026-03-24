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
        // User data from registration step 1
        firstName,
        lastName,
        email,
        password,
        role,
        // Profile data from faculty form step 2
        dateOfBirth,
        age,
        gender,
        civilStatus,
        nationality,
        phone,
        address,
        employeeId,
        position,
        department,
        employmentStatus,
        dateOfHire,
        previousPositions,
        highestDegree,
        specialization,
        institution,
        gradYear,
        license,
        continuingEd,
        subjectsTaught,
        yearLevel,
        loadUnits,
        advising,
        committeeRoles,
        researchInterests,
        publications
    } = req.body;

    // --- Step 1: Basic validation ---
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ msg: 'Initial registration data is missing. Please start over.' });
    }

    try {
        // --- Step 2: Check if user already exists ---
        let [users] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }

        // --- Step 3: Hash the password ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- Step 4: Insert into 'users' table ---
        const newUser = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || 'user', // Default to 'user' if not provided
            status: 'pending' // All new registrations are pending
        };

        const [result] = await db.query('INSERT INTO users SET ?', newUser);
        const userId = result.insertId;

        // --- Step 5: Insert into 'faculty_profiles' table ---
        const newProfile = {
            user_id: userId,
            dateOfBirth,
            age,
            gender,
            civilStatus,
            nationality,
            phone,
            address,
            employeeId,
            position,
            department,
            employmentStatus,
            dateOfHire,
            previousPositions,
            highestDegree,
            specialization,
            institution,
            gradYear,
            license,
            continuingEd,
            subjectsTaught,
            yearLevel,
            loadUnits,
            advising,
            committeeRoles,
            researchInterests,
            publications
        };

        await db.query('INSERT INTO faculty_profiles SET ?', newProfile);

        // --- Step 6: Send success response ---
        res.status(201).json({ msg: 'Registration complete! Your account is now pending for approval.' });

    } catch (err) {
        console.error('Error during faculty profile creation:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
