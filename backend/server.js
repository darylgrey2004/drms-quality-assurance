const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const dbPath = path.join(__dirname, 'registered_accounts.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Helper functions
function readDatabase() {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function generateVerificationCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Routes

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, middleInitial, gender, contactNumber, email, role, department, password, confirmPassword } = req.body;

        // Validation
        if (!firstName || !lastName || !gender || !contactNumber || !email || !role || !department || !password || !confirmPassword) {
            console.log('Validation failed - missing required fields');
            console.log('Received data:', { firstName, lastName, gender, contactNumber, email, role, department, password, confirmPassword });
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const accounts = readDatabase();
        if (accounts.some(acc => acc.email === email)) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Generate verification code and token
        const verificationCode = generateVerificationCode();
        const verificationToken = generateVerificationToken();

        // Create new account
        const fullName = `${firstName} ${middleInitial ? middleInitial + ' ' : ''}${lastName}`.trim();
        const newAccount = {
            id: crypto.randomUUID(),
            firstName,
            lastName,
            middleInitial,
            fullName,
            gender,
            contactNumber,
            email,
            role,
            department,
            password: Buffer.from(password).toString('base64'), // Basic encoding (use bcrypt in production)
            verificationCode,
            verificationToken,
            isVerified: false,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        // Save to database
        accounts.push(newAccount);
        writeDatabase(accounts);

        // Send verification email
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'DRMS-QA Email Verification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0d7377;">Welcome to DRMS-QA</h2>
                    <p>Hi ${fullName},</p>
                    <p>Thank you for registering. Please verify your email address using the code below:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #0d7377; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you did not register for this account, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">DRMS-QA System</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email error:', error);
                return res.status(500).json({ success: false, message: 'Failed to send verification email' });
            }
            res.status(201).json({
                success: true,
                message: 'Registration successful. Verification code sent to your email.',
                verificationToken,
                email
            });
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// Verify email endpoint
app.post('/api/verify-email', async (req, res) => {
    try {
        const { email, verificationCode, verificationToken } = req.body;

        if (!email || !verificationCode || !verificationToken) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const accounts = readDatabase();
        const account = accounts.find(acc => acc.email === email && acc.verificationToken === verificationToken);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        if (account.verificationCode !== verificationCode) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        // Mark as verified
        account.isVerified = true;
        account.status = 'pending_approval'; // Awaiting admin approval
        writeDatabase(accounts);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully. Your account is pending administrator approval.'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

// Get all registered accounts (for admin purposes)
app.get('/api/accounts', (req, res) => {
    try {
        const accounts = readDatabase();
        // Don't send passwords in response
        const safeAccounts = accounts.map(({ password, ...rest }) => rest);
        res.status(200).json({ success: true, accounts: safeAccounts });
    } catch (error) {
        console.error('Error reading accounts:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`DRMS-QA Backend Server running on port ${PORT}`);
});
