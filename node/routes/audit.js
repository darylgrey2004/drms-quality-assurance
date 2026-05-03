const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// @route   GET /api/audit/logs
// @desc    Get audit logs with filtering and pagination
// @access  Private (Admin, Dean)
router.get('/logs', auth, async (req, res) => {
  try {
    // Only admin and dean can access audit logs
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const {
      page = 1,
      limit = 25,
      action,
      user_id,
      entity_type,
      date_from,
      date_to,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Build WHERE conditions
    if (action && action !== 'all') {
      whereConditions.push('al.action = ?');
      queryParams.push(action);
    }

    if (user_id && user_id !== 'all') {
      whereConditions.push('al.user_id = ?');
      queryParams.push(user_id);
    }

    if (entity_type) {
      whereConditions.push('al.entity_type = ?');
      queryParams.push(entity_type);
    }

    if (date_from) {
      whereConditions.push('al.created_at >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('al.created_at <= ?');
      queryParams.push(date_to);
    }

    if (search) {
      whereConditions.push('(u.firstName LIKE ? OR u.lastName LIKE ? OR al.action LIKE ? OR d.title LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN documents d ON al.entity_type = 'document' AND al.entity_id = d.id
      ${whereClause}
    `;

    const [countResult] = await db.query(countQuery, queryParams);
    const totalRecords = countResult[0].total;

    // Get paginated logs
    const logsQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at,
        CONCAT(u.firstName, ' ', u.lastName) as user_name,
        u.role as user_role,
        d.title as document_title,
        d.category_name,
        d.department_code
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN documents d ON al.entity_type = 'document' AND al.entity_id = d.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const [logs] = await db.query(logsQuery, queryParams);

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null
    }));

    res.json({
      logs: parsedLogs,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalRecords,
        total_pages: Math.ceil(totalRecords / limit)
      }
    });

  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/audit/stats
// @desc    Get audit trail statistics
// @access  Private (Admin, Dean)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Total events
    const [totalEvents] = await db.query('SELECT COUNT(*) as count FROM audit_logs');

    // Events by type
    const [eventsByType] = await db.query(`
      SELECT 
        CASE 
          WHEN action LIKE '%DOCUMENT%' THEN 'document'
          WHEN action LIKE '%USER%' THEN 'user'
          ELSE 'system'
        END as event_type,
        COUNT(*) as count
      FROM audit_logs
      GROUP BY event_type
    `);

    // Recent activity (last 7 days)
    const [recentActivity] = await db.query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Top actions
    const [topActions] = await db.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);

    // Active users (users with recent activity)
    const [activeUsers] = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM audit_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND user_id IS NOT NULL
    `);

    res.json({
      total_events: totalEvents[0].count,
      events_by_type: eventsByType,
      recent_activity: recentActivity[0].count,
      top_actions: topActions,
      active_users: activeUsers[0].count
    });

  } catch (err) {
    console.error('Audit stats error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/audit/users
// @desc    Get list of users for filtering
// @access  Private (Admin, Dean)
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const [users] = await db.query(`
      SELECT DISTINCT 
        u.id,
        CONCAT(u.firstName, ' ', u.lastName) as name,
        u.role
      FROM users u
      INNER JOIN audit_logs al ON u.id = al.user_id
      ORDER BY name
    `);

    res.json(users);

  } catch (err) {
    console.error('Audit users error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/audit/actions
// @desc    Get list of actions for filtering
// @access  Private (Admin, Dean)
router.get('/actions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const [actions] = await db.query(`
      SELECT DISTINCT action
      FROM audit_logs
      ORDER BY action
    `);

    res.json(actions.map(a => a.action));

  } catch (err) {
    console.error('Audit actions error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/audit/export
// @desc    Export audit logs to CSV
// @access  Private (Admin, Dean)
router.get('/export', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { date_from, date_to, action, user_id } = req.query;
    
    let whereConditions = [];
    let queryParams = [];

    if (action && action !== 'all') {
      whereConditions.push('al.action = ?');
      queryParams.push(action);
    }

    if (user_id && user_id !== 'all') {
      whereConditions.push('al.user_id = ?');
      queryParams.push(user_id);
    }

    if (date_from) {
      whereConditions.push('al.created_at >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('al.created_at <= ?');
      queryParams.push(date_to);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const [logs] = await db.query(`
      SELECT 
        al.created_at as timestamp,
        CONCAT(u.firstName, ' ', u.lastName) as user_name,
        u.role as user_role,
        al.action,
        al.entity_type,
        d.title as document_title,
        d.category_name,
        d.department_code,
        al.ip_address
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN documents d ON al.entity_type = 'document' AND al.entity_id = d.id
      ${whereClause}
      ORDER BY al.created_at DESC
    `, queryParams);

    // Generate CSV
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Document', 'Category', 'Department', 'IP Address'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.user_name || 'System',
        log.user_role || 'N/A',
        log.action,
        log.entity_type || 'N/A',
        log.document_title || 'N/A',
        log.category_name || 'N/A',
        log.department_code || 'N/A',
        log.ip_address || 'N/A'
      ].map(field => `"${field}"`);
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);

  } catch (err) {
    console.error('Audit export error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
