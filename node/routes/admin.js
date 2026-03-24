const express = require('express');
const router = express.Router();
const db = require('../database');
const { adminAuth } = require('../middleware/auth');

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

module.exports = router;