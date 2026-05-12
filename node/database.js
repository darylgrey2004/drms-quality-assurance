const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root directory (optional for production)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

console.log('=== Database Configuration ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error errno:', err.errno);
  } else {
    console.log('Database connected successfully');
    connection.release();
  }
});

module.exports = pool.promise();