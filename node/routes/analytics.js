const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// @route   GET /api/documents/analytics/overview
// @desc    Get analytics overview data
// @access  Private (Admin, Dean)
router.get('/overview', auth, async (req, res) => {
  try {
    // Status distribution
    const [statusDist] = await db.query(`
      SELECT 
        workflow_status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documents)), 2) as percentage
      FROM documents
      GROUP BY workflow_status
      ORDER BY count DESC
    `);

    // Category breakdown
    const [categoryBreakdown] = await db.query(`
      SELECT 
        c.display_name as category,
        COUNT(d.id) as total,
        SUM(CASE WHEN d.workflow_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN d.workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN d.workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND((SUM(CASE WHEN d.workflow_status = 'approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(d.id)), 2) as approval_rate
      FROM categories c
      LEFT JOIN documents d ON c.id = d.category_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.display_name
      ORDER BY total DESC
    `);

    // Department breakdown
    const [deptBreakdown] = await db.query(`
      SELECT 
        COALESCE(dept.code, d.department_code, 'Unknown') as department_code,
        COUNT(d.id) as total,
        SUM(CASE WHEN d.workflow_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN d.workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN d.workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM documents d
      LEFT JOIN departments dept ON d.department_id = dept.id
      GROUP BY department_code
      ORDER BY total DESC
    `);

    // Monthly trends (last 6 months)
    const [monthlyTrends] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as documents_uploaded,
        SUM(CASE WHEN workflow_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM documents
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month DESC
    `);

    // Top uploaders
    const [topUploaders] = await db.query(`
      SELECT 
        u.firstName,
        u.lastName,
        COUNT(d.id) as documents_uploaded
      FROM users u
      INNER JOIN documents d ON u.id = d.uploader_id
      GROUP BY u.id, u.firstName, u.lastName
      ORDER BY documents_uploaded DESC
      LIMIT 10
    `);

    res.json({
      status_distribution: statusDist,
      category_breakdown: categoryBreakdown,
      department_breakdown: deptBreakdown,
      monthly_trends: monthlyTrends,
      top_uploaders: topUploaders
    });

  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/reports/summary
// @desc    Get report summary data
// @access  Private (Admin, Dean)
router.get('/summary', auth, async (req, res) => {
  try {
    // Overall statistics
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(*) as total_documents,
        SUM(CASE WHEN workflow_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND((SUM(CASE WHEN workflow_status = 'approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as approval_rate
      FROM documents
    `);

    // Category performance
    const [categoryPerf] = await db.query(`
      SELECT 
        c.display_name as category,
        COUNT(d.id) as total,
        SUM(CASE WHEN d.workflow_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN d.workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN d.workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND((SUM(CASE WHEN d.workflow_status = 'approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(d.id)), 2) as approval_rate
      FROM categories c
      LEFT JOIN documents d ON c.id = d.category_id
      WHERE c.is_active = 1
      GROUP BY c.id, c.display_name
      ORDER BY total DESC
    `);

    // Department performance
    const [deptPerf] = await db.query(`
      SELECT 
        COALESCE(dept.code, d.department_code, 'Unknown') as department_code,
        COUNT(d.id) as total,
        SUM(CASE WHEN d.workflow_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN d.workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN d.workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND((SUM(CASE WHEN d.workflow_status = 'approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(d.id)), 2) as approval_rate
      FROM documents d
      LEFT JOIN departments dept ON d.department_id = dept.id
      GROUP BY department_code
      ORDER BY total DESC
    `);

    // Workflow efficiency
    const [workflowEff] = await db.query(`
      SELECT 
        AVG(DATEDIFF(updated_at, created_at)) as avg_days_to_approval
      FROM documents
      WHERE workflow_status = 'approved'
    `);

    // File statistics
    const [fileStats] = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        AVG(size_bytes) as avg_file_size,
        MAX(size_bytes) as max_file_size,
        MIN(size_bytes) as min_file_size
      FROM document_files
    `);

    res.json({
      overall_statistics: overallStats[0],
      category_performance: categoryPerf,
      department_performance: deptPerf,
      workflow_efficiency: workflowEff[0],
      file_statistics: fileStats[0]
    });

  } catch (err) {
    console.error('Report summary error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
