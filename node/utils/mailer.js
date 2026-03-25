const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com'
  port: process.env.EMAIL_PORT, // 587 for TLS, 465 for SSL
  secure: process.env.EMAIL_PORT == 465, // `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

// Verify the connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Error with email transporter configuration:', error);
  } else {
    console.log('Email transporter is configured and ready to send emails.');
  }
});

module.exports = transporter;