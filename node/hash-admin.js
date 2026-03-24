const bcrypt = require('bcrypt');
const db = require('./database');
require('dotenv').config();

// This should be the same password you used in the initial SQL INSERT statement.
const plainPassword = 'admin_password123';
const adminEmail = 'qguilmar@gmail.com';

async function hashPassword() {
  try {
    console.log(`Searching for admin user '${adminEmail}'...`);
    const [users] = await db.query('SELECT password FROM users WHERE email = ?', [adminEmail]);

    if (users.length === 0) {
      console.error(`Error: Admin user '${adminEmail}' not found.`);
      process.exit(1);
    }

    // Check if password already looks hashed
    if (users[0].password.startsWith('$2b$')) {
        console.log('Admin password already appears to be hashed. No action taken.');
        process.exit(0);
    }

    console.log('Admin user found. Hashing password...');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, adminEmail]);

    console.log('Admin password has been successfully hashed and stored in the database.');
  } catch (err) {
    console.error('An error occurred while hashing the password:', err);
  }
  // The process will exit automatically, closing the database connection.
  process.exit();
}

hashPassword();