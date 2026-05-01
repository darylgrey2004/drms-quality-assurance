const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'drms_db'
    });

    const hashedPassword = await bcrypt.hash('admin_password123', 10);
    
    // Try to update first
    const [updateResult] = await connection.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, 'admin@wmsu.edu.ph']
    );

    if (updateResult.affectedRows === 0) {
        // If no rows updated, insert new admin
        await connection.execute(
            `INSERT INTO users (email, password, firstName, lastName, role, status, isVerified, lastActive, createdAt)
             VALUES (?, ?, 'Admin', 'User', 'admin', 'approved', 1, NOW(), NOW())`,
            ['admin@wmsu.edu.ph', hashedPassword]
        );
        console.log('✓ New admin account created');
    } else {
        console.log('✓ Admin password updated');
    }

    console.log('Email: admin@wmsu.edu.ph');
    console.log('Password: admin_password123');
    
    await connection.end();
}

createAdmin().catch(console.error);