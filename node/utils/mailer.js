const nodemailer = require('nodemailer');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
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