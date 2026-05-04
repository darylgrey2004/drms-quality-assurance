const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// @route   POST /api/reports/generate
// @desc    Generate a report based on parameters
// @access  Private (Admin, Dean)
router.post('/generate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { 
      report_type, // 'overview', 'completeness', 'department', 'category'
      period, // 'this-month', 'last-month', 'this-quarter', 'this-year', 'custom'
      date_from,
      date_to,
      format, // 'pdf', 'excel', 'csv'
      filters // { category, department, status }
    } = req.body;

    // Build date range
    let dateCondition = '';
    let dateParams = [];

    if (period === 'custom' && date_from && date_to) {
      dateCondition = 'AND d.created_at BETWEEN ? AND ?';
      dateParams = [date_from, date_to];
    } else {
      const periodMap = {
        'today': 'DATE(d.created_at) = CURDATE()',
        'this-week': 'd.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        'this-month': 'MONTH(d.created_at) = MONTH(NOW()) AND YEAR(d.created_at) = YEAR(NOW())',
        'last-month': 'MONTH(d.created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(d.created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))',
        'this-quarter': 'QUARTER(d.created_at) = QUARTER(NOW()) AND YEAR(d.created_at) = YEAR(NOW())',
        'last-quarter': 'QUARTER(d.created_at) = QUARTER(DATE_SUB(NOW(), INTERVAL 3 MONTH)) AND YEAR(d.created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 3 MONTH))',
        'this-year': 'YEAR(d.created_at) = YEAR(NOW())'
      };
      dateCondition = periodMap[period] ? `AND ${periodMap[period]}` : '';
    }

    // Build filter conditions
    let filterConditions = [];
    let filterParams = [];

    if (filters?.category) {
      filterConditions.push('d.category_name = ?');
      filterParams.push(filters.category);
    }

    if (filters?.department) {
      filterConditions.push('d.department_code = ?');
      filterParams.push(filters.department);
    }

    if (filters?.status) {
      filterConditions.push('d.workflow_status = ?');
      filterParams.push(filters.status);
    }

    const filterClause = filterConditions.length > 0 
      ? 'AND ' + filterConditions.join(' AND ')
      : '';

    const allParams = [...dateParams, ...filterParams];

    // Generate report data based on type
    let reportData = {};

    if (report_type === 'overview') {
      // Overall statistics
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_documents,
          SUM(CASE WHEN workflow_status = 'approved' OR workflow_status = 'locked' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN workflow_status = 'pending' OR workflow_status = 'validated' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM documents d
        WHERE 1=1 ${dateCondition} ${filterClause}
      `, allParams);

      // Category breakdown
      const [categoryBreakdown] = await db.query(`
        SELECT 
          d.category_name,
          COUNT(*) as total,
          SUM(CASE WHEN d.workflow_status = 'approved' OR d.workflow_status = 'locked' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN d.workflow_status = 'pending' OR d.workflow_status = 'validated' THEN 1 ELSE 0 END) as pending
        FROM documents d
        WHERE 1=1 ${dateCondition} ${filterClause}
        GROUP BY d.category_name
      `, allParams);

      // Department breakdown
      const [deptBreakdown] = await db.query(`
        SELECT 
          d.department_code,
          COUNT(*) as total,
          SUM(CASE WHEN d.workflow_status = 'approved' OR d.workflow_status = 'locked' THEN 1 ELSE 0 END) as approved
        FROM documents d
        WHERE 1=1 ${dateCondition} ${filterClause}
        GROUP BY d.department_code
      `, allParams);

      reportData = {
        statistics: stats[0],
        category_breakdown: categoryBreakdown,
        department_breakdown: deptBreakdown
      };
    } else if (report_type === 'completeness') {
      // Completeness by category and department
      const [completeness] = await db.query(`
        SELECT 
          cr.category_id,
          c.display_name as category_name,
          cr.department_id,
          dept.code as department_code,
          dept.name as department_name,
          cr.expected_documents as required,
          COUNT(d.id) as uploaded,
          SUM(CASE WHEN d.workflow_status = 'approved' OR d.workflow_status = 'locked' THEN 1 ELSE 0 END) as verified,
          ROUND((COUNT(d.id) / cr.expected_documents) * 100, 2) as completeness_percentage
        FROM category_requirements cr
        INNER JOIN categories c ON cr.category_id = c.id
        INNER JOIN departments dept ON cr.department_id = dept.id
        LEFT JOIN documents d ON d.category_id = cr.category_id AND d.department_id = cr.department_id
        WHERE c.is_active = 1 AND dept.is_active = 1
        GROUP BY cr.category_id, cr.department_id, c.display_name, dept.code, dept.name, cr.expected_documents
        ORDER BY dept.code, c.display_name
      `);

      reportData = { completeness };
    }

    // Save report metadata
    const [result] = await db.query(`
      INSERT INTO report_history 
      (report_type, period, date_from, date_to, format, filters, generated_by, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      report_type,
      period,
      date_from || null,
      date_to || null,
      format,
      JSON.stringify(filters || {}),
      req.user.id
    ]);

    res.json({
      report_id: result.insertId,
      report_type,
      period,
      format,
      data: reportData,
      generated_at: new Date(),
      generated_by: `${req.user.firstName} ${req.user.lastName}`
    });

  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET /api/reports/history
// @desc    Get report generation history
// @access  Private (Admin, Dean)
router.get('/history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { limit = 10 } = req.query;

    const [reports] = await db.query(`
      SELECT 
        rh.id,
        rh.report_type,
        rh.period,
        rh.format,
        rh.generated_at,
        CONCAT(u.firstName, ' ', u.lastName) as generated_by
      FROM report_history rh
      LEFT JOIN users u ON rh.generated_by = u.id
      ORDER BY rh.generated_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json(reports);

  } catch (err) {
    console.error('Report history error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/reports/export
// @desc    Export report data in specified format
// @access  Private (Admin, Dean)
router.post('/export', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { data, format, report_type } = req.body;

    if (format === 'csv') {
      // Generate CSV
      let csv = '';
      
      if (report_type === 'overview') {
        // Statistics CSV
        csv += 'Metric,Value\n';
        csv += `Total Documents,${data.statistics.total_documents}\n`;
        csv += `Approved,${data.statistics.approved}\n`;
        csv += `Pending,${data.statistics.pending}\n`;
        csv += `Rejected,${data.statistics.rejected}\n\n`;
        
        // Category breakdown
        csv += 'Category,Total,Approved,Pending\n';
        data.category_breakdown.forEach(cat => {
          csv += `${cat.category_name},${cat.total},${cat.approved},${cat.pending}\n`;
        });
      } else if (report_type === 'completeness') {
        csv += 'Department,Category,Required,Uploaded,Verified,Completeness %\n';
        data.completeness.forEach(item => {
          csv += `${item.department_code},${item.category_name},${item.required},${item.uploaded},${item.verified},${item.completeness_percentage}\n`;
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${report_type}-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // For PDF and Excel, return JSON for now (client-side generation)
      res.json({ 
        msg: 'Export data prepared',
        format,
        data 
      });
    }

  } catch (err) {
    console.error('Report export error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/reports/gap-analysis
// @desc    Generate gap analysis report
// @access  Private (Admin, Dean)
router.get('/gap-analysis', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'dean') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const [gaps] = await db.query(`
      SELECT 
        cr.category_id,
        c.display_name as category_name,
        cr.department_id,
        dept.code as department_code,
        dept.name as department_name,
        cr.expected_documents as required,
        COUNT(d.id) as uploaded,
        (cr.expected_documents - COUNT(d.id)) as missing,
        CASE 
          WHEN COUNT(d.id) >= cr.expected_documents THEN 'Complete'
          WHEN COUNT(d.id) >= (cr.expected_documents * 0.8) THEN 'Near Complete'
          WHEN COUNT(d.id) >= (cr.expected_documents * 0.5) THEN 'Partial'
          ELSE 'Critical'
        END as status
      FROM category_requirements cr
      INNER JOIN categories c ON cr.category_id = c.id
      INNER JOIN departments dept ON cr.department_id = dept.id
      LEFT JOIN documents d ON d.category_id = cr.category_id 
        AND d.department_id = cr.department_id
        AND (d.workflow_status = 'approved' OR d.workflow_status = 'locked')
      WHERE c.is_active = 1 AND dept.is_active = 1
      GROUP BY cr.category_id, cr.department_id, c.display_name, dept.code, dept.name, cr.expected_documents
      HAVING missing > 0
      ORDER BY missing DESC, dept.code
    `);

    res.json({ gaps });

  } catch (err) {
    console.error('Gap analysis error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
