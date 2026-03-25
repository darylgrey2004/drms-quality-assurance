const express = require('express');
const router = express.Router();
const db = require('../database');
const { adminAuth } = require('../middleware/auth');

// @route   GET api/admin/users
// @desc    Get all users with their profiles
// @access  Private (Admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, u.firstName, u.lastName, u.middleInitial, u.email, u.role, u.status, u.isVerified, u.createdAt,
        fp.department, fp.position
      FROM users u
      LEFT JOIN faculty_profiles fp ON u.id = fp.user_id
      ORDER BY u.createdAt DESC
    `;
    const [users] = await db.query(query);
    res.json(users);
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
// @desc    Delete a user and their profile
// @access  Private (Admin only)
router.delete('/users/:userId', adminAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    // Delete faculty profile first (foreign key constraint)
    await db.query('DELETE FROM faculty_profiles WHERE user_id = ?', [userId]);
    
    // Delete user
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
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
// @access  Private (Admin only)
router.get('/profile/:userId', adminAuth, async (req, res) => {
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

module.exports = router;