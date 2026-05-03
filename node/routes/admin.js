const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const { auth, adminAuth } = require('../middleware/auth');

function deanOrAdminAuth(req, res, next) {
  auth(req, res, () => {
    const role = (req.user?.role || '').toString().toLowerCase().trim();
    if (role !== 'admin' && role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied. Dean or Admin privileges required.' });
    }
    next();
  });
}

// @route   GET api/admin/users
// @desc    Get all users with their profiles and active status
// @access  Private (Dean/Admin)
router.get('/users', deanOrAdminAuth, async (req, res) => {
  try {
    // First try with lastActive column (new schema)
    let query = `
      SELECT 
        u.id, u.firstName, u.lastName, u.middleInitial, u.email, u.role, u.status, u.isVerified, u.createdAt, u.lastActive,
        fp.department, fp.position,
        eal.expiresAt AS evaluatorExpiresAt
      FROM users u
      LEFT JOIN faculty_profiles fp ON u.id = fp.user_id
      LEFT JOIN evaluator_access_limits eal ON u.id = eal.user_id
      ORDER BY u.createdAt DESC
    `;
    
    try {
      const [users] = await db.query(query);
      res.json(users);
    } catch (err) {
      // If lastActive column doesn't exist yet, fallback to old query
      if (err.message && err.message.includes('Unknown column')) {
        const fallbackQuery = `
          SELECT 
            u.id, u.firstName, u.lastName, u.middleInitial, u.email, u.role, u.status, u.isVerified, u.createdAt, NULL as lastActive,
            fp.department, fp.position,
            eal.expiresAt AS evaluatorExpiresAt
          FROM users u
          LEFT JOIN faculty_profiles fp ON u.id = fp.user_id
          LEFT JOIN evaluator_access_limits eal ON u.id = eal.user_id
          ORDER BY u.createdAt DESC
        `;
        const [users] = await db.query(fallbackQuery);
        res.json(users);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/users
// @desc    Create a new user account (Admin only)
// @access  Private (Admin only)
router.post('/users', adminAuth, async (req, res) => {
  const {
    firstName,
    lastName,
    middleInitial,
    email,
    password,
    role,
    department,
    evaluatorExpiresAt
  } = req.body || {};

  console.log('Create user request received:', { firstName, lastName, email, role, department });

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ msg: 'Please provide first name, last name, email, password, and role.' });
  }

  const normalizedRole = String(role).toLowerCase().trim();
  const isEvaluatorRole = normalizedRole === 'evaluator' || normalizedRole === 'external evaluator';
  const requiresDepartment = normalizedRole === 'faculty' || normalizedRole === 'area-chair' || normalizedRole === 'department-head';
  let parsedEvaluatorExpiration = null;

  if (isEvaluatorRole && !evaluatorExpiresAt) {
    return res.status(400).json({ msg: 'External Evaluator accounts require an expiration date/time.' });
  }

  if (requiresDepartment && !department) {
    return res.status(400).json({ msg: 'Department is required for Faculty and Department Head roles.' });
  }

  if (isEvaluatorRole) {
    parsedEvaluatorExpiration = new Date(evaluatorExpiresAt);
    if (Number.isNaN(parsedEvaluatorExpiration.getTime())) {
      return res.status(400).json({ msg: 'Invalid evaluator expiration date/time.' });
    }
    if (parsedEvaluatorExpiration <= new Date()) {
      return res.status(400).json({ msg: 'Evaluator expiration must be set to a future date/time.' });
    }
  }

  try {
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ msg: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserPayload = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      middleInitial: middleInitial ? String(middleInitial).trim() : null,
      email: String(email).trim(),
      password: hashedPassword,
      role: String(role).trim(),
      status: 'approved',
      isVerified: 1
    };

    const [createUserResult] = await db.query('INSERT INTO users SET ?', [newUserPayload]);
    const createdUserId = createUserResult.insertId;

    // Create faculty_profiles entry if department is provided (for Faculty, Area Chair, or Dean with department)
    if (department) {
      console.log('Creating faculty_profiles entry with department:', department);
      try {
        await db.query(
          'INSERT INTO faculty_profiles (user_id, department) VALUES (?, ?)',
          [createdUserId, String(department).trim()]
        );
        console.log('Faculty profile created successfully');
      } catch (profileErr) {
        console.error('Failed to create faculty profile:', profileErr.message);
        // Continue even if profile creation fails
      }
    } else {
      console.log('No department provided, skipping faculty_profiles creation');
    }

    if (isEvaluatorRole) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS evaluator_access_limits (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          expiresAt DATETIME NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      await db.query(
        `INSERT INTO evaluator_access_limits (user_id, expiresAt)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE expiresAt = VALUES(expiresAt)`,
        [createdUserId, parsedEvaluatorExpiration]
      );
    }

    res.status(201).json({ msg: 'User account created successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/users/:userId/status
// @desc    Update user status
// @access  Private (Admin only)
router.put('/users/:userId/status', adminAuth, async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status value' });
  }

  try {
    const [result] = await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: `User status updated to ${status}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/users/:userId
// @desc    Delete a user but retain their documents
// @access  Private (Admin only)
router.delete('/users/:userId', adminAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await db.query('SELECT id, firstName, lastName FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ msg: 'User not found' });

    const { firstName, lastName } = users[0];
    const displayName = `${firstName || ''} ${lastName || ''}`.trim() || 'Deleted User';

    // Snapshot author_name on documents before breaking the FK
    await db.query(
      `UPDATE documents SET author_name = COALESCE(NULLIF(author_name,''), ?) WHERE uploader_id = ?`,
      [displayName, userId]
    );

    // Alter the FK so uploader_id can be set to NULL instead of cascade-deleting documents
    await db.query('ALTER TABLE documents DROP FOREIGN KEY documents_ibfk_1');
    await db.query('ALTER TABLE documents MODIFY uploader_id INT(11) NULL');
    await db.query('ALTER TABLE documents ADD CONSTRAINT documents_ibfk_1 FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL');

    // Now safely nullify the uploader reference
    await db.query('UPDATE documents SET uploader_id = NULL WHERE uploader_id = ?', [userId]);

    // Nullify other non-cascade FKs that reference users.id
    await db.query('UPDATE approval_workflow SET action_by = NULL WHERE action_by = ?', [userId]).catch(() => {});
    await db.query('UPDATE audit_logs SET user_id = NULL WHERE user_id = ?', [userId]).catch(() => {});
    await db.query('UPDATE document_comments SET user_id = NULL WHERE user_id = ?', [userId]).catch(() => {});
    await db.query('UPDATE document_versions SET created_by = NULL WHERE created_by = ?', [userId]).catch(() => {});

    // Delete rows that cascade or have no further use
    await db.query('DELETE FROM notifications WHERE user_id = ?', [userId]).catch(() => {});
    await db.query('DELETE FROM user_sessions WHERE user_id = ?', [userId]).catch(() => {});

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) return res.status(404).json({ msg: 'User not found' });

    res.json({ msg: 'User deleted successfully. Their documents have been retained.' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   GET api/admin/approvals
// @desc    Get all pending registration requests
// @access  Private (Admin only)
router.get('/approvals', adminAuth, async (req, res) => {
  try {
    const [pendingUsers] = await db.query(
      "SELECT id, email, firstName, lastName, createdAt FROM users WHERE status = 'pending' ORDER BY createdAt DESC"
    );
    res.json(pendingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/approve
// @desc    Approve a user registration
// @access  Private (Admin only)
router.post('/approve', adminAuth, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ msg: 'User ID is required' });
  }

  try {
    const [result] = await db.query(
      "UPDATE users SET status = 'approved' WHERE id = ? AND status = 'pending'",
      [userId]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ msg: 'User not found or already processed.' });
    }

    res.json({ msg: 'User approved successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/profile/:userId
// @desc    Get a specific user's full profile
// @access  Private (Dean/Admin)
router.get('/profile/:userId', deanOrAdminAuth, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Query to join users and faculty_profiles tables
        const query = `
            SELECT 
                u.id, u.firstName, u.lastName, u.middleInitial, u.email, u.role, u.status, u.isVerified, u.createdAt, 
                fp.* 
            FROM users u
            LEFT JOIN faculty_profiles fp ON u.id = fp.user_id
            WHERE u.id = ?
        `;

        const [results] = await db.query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(results[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/profile/:userId
// @desc    Update a specific user's profile (Admin only)
// @access  Private (Admin only)
router.put('/profile/:userId', adminAuth, async (req, res) => {
  const { userId } = req.params;
  const {
    firstName,
    lastName,
    middleInitial,
    email,
    ...profileData
  } = req.body || {};

  try {
    const userUpdates = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (middleInitial !== undefined) userUpdates.middleInitial = middleInitial;
    if (email !== undefined) userUpdates.email = email;

    if (Object.keys(userUpdates).length > 0) {
      await db.query('UPDATE users SET ? WHERE id = ?', [userUpdates, userId]);
    }

    const [profileColumns] = await db.query('SHOW COLUMNS FROM faculty_profiles');
    const allowedProfileFields = new Set(profileColumns.map((column) => column.Field));
    const sanitizedProfileData = Object.fromEntries(
      Object.entries(profileData || {}).filter(([key]) => allowedProfileFields.has(key))
    );

    const [existingProfiles] = await db.query(
      'SELECT id FROM faculty_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (existingProfiles.length > 0) {
      if (Object.keys(sanitizedProfileData).length > 0) {
        await db.query(
          'UPDATE faculty_profiles SET ? WHERE user_id = ?',
          [sanitizedProfileData, userId]
        );
      }
    } else {
      const insertPayload = { user_id: userId, ...sanitizedProfileData };
      await db.query(
        'INSERT INTO faculty_profiles SET ?',
        [insertPayload]
      );
    }

    res.json({ msg: 'Profile updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/admin/standards/:id
// @desc    Toggle is_active on a standard
// @access  Private (Admin only)
router.patch('/standards/:id', adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean' && is_active !== 0 && is_active !== 1) {
    return res.status(400).json({ msg: 'is_active must be a boolean' });
  }
  try {
    const [result] = await db.query(
      'UPDATE standards SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ msg: 'Standard not found' });
    res.json({ msg: 'Standard updated', id, is_active: !!is_active });
  } catch (err) {
    console.error('Update standard error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;