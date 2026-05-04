const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

// REMOVED: SQL file auto-update function
// Reason: SQL files should be version-controlled, not auto-updated
// This functionality was causing unnecessary complexity and is not needed for production

function normalizeRole(role) {
  return (role || '').toString().toLowerCase().trim();
}

function canUpload(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'faculty' || r === 'area-chair' || r === 'department-head' || r === 'dean';
}

function canViewAll(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean';
}

function canApprove(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean';
}

// Ensure uploads dir exists
const uploadRoot = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadRoot);
  },
  filename: function (_req, file, cb) {
    const safeOriginal = (file.originalname || 'file').replace(/[^\w.\-()+ ]+/g, '_');
    const stamp = Date.now();
    cb(null, `${stamp}-${Math.round(Math.random() * 1e9)}-${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: function (_req, file, cb) {
    const allowedTypes = /pdf|docx|xlsx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, XLSX, JPG, and PNG files are allowed'));
    }
  }
});

// @route   POST /api/documents/upload
// @desc    Upload document with files
// @access  Private (Admin, Dean, Faculty, Dept. Head)
router.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!canUpload(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to upload documents' });
    }

    const {
      title,
      category_id,
      department,
      author,
      version,
      description,
      keywords,
      workflow,
      expiryDate,
      standard_id
    } = req.body || {};

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ msg: 'No files uploaded' });
    if (!title || !category_id || !department || !author) {
      return res.status(400).json({ msg: 'Missing required fields: title, category, department, author' });
    }

    // Map workflow to status
    const workflowMap = {
      submit: 'pending',
      draft: 'draft',
      approve: 'approved'
    };
    const status = workflowMap[String(workflow || 'submit')] || 'pending';

    // Get category name from categories table using category_id
    const [categories] = await db.query(
      'SELECT id, name, display_name FROM categories WHERE id = ? LIMIT 1',
      [category_id]
    );
    const categoryRow = categories.length > 0 ? categories[0] : null;
    const categoryName = categoryRow ? categoryRow.name : String(category_id);
    const resolvedCategoryId = categoryRow ? categoryRow.id : null;

    // Get department_id from departments table — STANDARDIZED: exact match only
    const [departments] = await db.query(
      'SELECT id, code FROM departments WHERE UPPER(code) = UPPER(?) OR LOWER(name) = LOWER(?) LIMIT 1',
      [department, department]
    );
    const departmentId = departments.length > 0 ? departments[0].id : null;
    const departmentCode = departments.length > 0 ? departments[0].code : department.toUpperCase();
    
    if (!departmentId) {
      console.warn(`Department not found in departments table: "${department}". Document will be created with null department_id.`);
    }

    // Insert document record
    const [result] = await db.query(
      `INSERT INTO documents
        (title, category, category_id, area, department_id, version, description, keywords, 
         workflow_status, uploader_id, author_name, category_name, department_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        categoryName,
        resolvedCategoryId,
        department,
        departmentId,
        version || 'v1.0',
        description || null,
        keywords || null,
        status,
        req.user.id,
        author,
        categoryName,
        department.toUpperCase()
      ]
    );

    const documentId = result.insertId;

    // Log a warning if department_id could not be resolved — helps debugging
    if (!departmentId) {
      console.warn(`Upload warning: could not resolve department_id for value "${department}". Document ${documentId} stored with null department_id.`);
    }

    // Insert all uploaded files
    for (const f of files) {
      const relPath = `/uploads/${path.basename(f.path)}`;
      await db.query(
        `INSERT INTO document_files
          (document_id, original_name, stored_name, mime_type, size_bytes, url_path)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          documentId,
          f.originalname,
          path.basename(f.path),
          f.mimetype,
          f.size,
          relPath
        ]
      );
    }

    // Save selected standard into document_standards join table
    if (standard_id && Number(standard_id)) {
      try {
        await db.query(
          'INSERT IGNORE INTO document_standards (document_id, standard_id) VALUES (?, ?)',
          [documentId, Number(standard_id)]
        );
      } catch (stdErr) {
        console.warn('document_standards insert skipped:', stdErr.message);
      }
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_UPLOAD', 'document', ?, ?, ?, ?)`,
        [req.user.id, documentId, JSON.stringify({ title, category: categoryName, department, status }), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) { console.log('Audit log skipped:', auditErr.message); }

    // SQL file auto-update removed - not needed for production

    res.status(201).json({
      msg: 'Document uploaded successfully',
      document: {
        id: documentId,
        title,
        category: categoryName,
        department,
        version: version || 'v1.0',
        workflow_status: status,
        files_count: files.length
      },
      realtime: true // Flag to trigger immediate dashboard refresh
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ msg: 'Server error during upload' });
  }
});

// Test route removed - SQL auto-update functionality removed

// @route   GET /api/documents/stats/dashboard
// @desc    Get real dashboard statistics from database
// @access  Private
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    console.log('Fetching real dashboard statistics from database...');
    
    // Get total documents count
    const [totalDocsResult] = await db.query('SELECT COUNT(*) as total FROM documents');
    const totalDocuments = totalDocsResult[0].total;
    
    // Get documents by status
    const [statusResult] = await db.query(`
      SELECT workflow_status, COUNT(*) as count 
      FROM documents 
      GROUP BY workflow_status
    `);
    
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let lockedCount = 0;
    
    statusResult.forEach(row => {
      switch(row.workflow_status) {
        case 'approved':
        case 'locked':
          approvedCount += row.count;
          break;
        case 'pending':
          pendingCount += row.count;
          break;
        case 'rejected':
          rejectedCount += row.count;
          break;
      }
    });
    
    // Get documents by category
    const [categoryResult] = await db.query(`
      SELECT c.display_name, COUNT(*) as count 
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      GROUP BY c.display_name
    `);
    
    const categoryStats = {};
    for (const row of categoryResult) {
      const categoryName = row.display_name || 'Unknown';
      const total = row.count;
      
      // Get approved count for this category
      const [approvedCategoryResult] = await db.query(`
        SELECT COUNT(*) as approved_count 
        FROM documents d
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE c.display_name = ? AND (d.workflow_status = 'approved' OR d.workflow_status = 'locked')
      `, [categoryName]);
      
      const approvedCount = approvedCategoryResult[0].approved_count;
      const percentage = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
      
      categoryStats[categoryName.toLowerCase()] = {
        total: total,
        completed: approvedCount,
        percentage: percentage
      };
    }
    
    // Calculate monthly change (documents created this month vs last month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const [currentMonthResult] = await db.query(`
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
    `, [currentMonth + 1, currentYear]);
    
    const [lastMonthResult] = await db.query(`
      SELECT COUNT(*) as count 
      FROM documents 
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
    `, [lastMonth + 1, lastMonthYear]);
    
    const monthlyChange = currentMonthResult[0].count - lastMonthResult[0].count;
    
    const stats = {
      total_documents: totalDocuments,
      approved_count: approvedCount,
      pending_count: pendingCount,
      rejected_count: rejectedCount,
      expiring_count: 0, // Could be calculated based on some expiry logic
      monthly_change: monthlyChange,
      urgent_count: pendingCount, // Pending documents as urgent
      instruction: categoryStats['instruction'] || { total: 0, completed: 0, percentage: 0 },
      research: categoryStats['research'] || { total: 0, completed: 0, percentage: 0 },
      extension: categoryStats['extension'] || { total: 0, completed: 0, percentage: 0 },
      employment: categoryStats['employment'] || { total: 0, completed: 0, percentage: 0 }
    };
    
    console.log('Real dashboard stats calculated:', stats);
    res.json(stats);
    
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/activity
// @desc    Get recent activities from audit_logs
// @access  Private
router.get('/activity', auth, async (req, res) => {
  try {
    console.log('Fetching activities from database...');
    
    // Get recent activities from audit_logs with user information
    const [activities] = await db.query(`
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.new_values,
        al.created_at,
        u.firstName,
        u.lastName,
        d.title as document_title
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN documents d ON al.entity_id = d.id AND al.entity_type = 'document'
      WHERE al.action IN ('DOCUMENT_UPLOAD', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'DOCUMENT_VALIDATED', 'DOCUMENT_LOCKED', 'DOCUMENT_DELETE')
      ORDER BY al.created_at DESC
      LIMIT 10
    `);
    
    console.log('Raw activities from database:', activities.length);
    
    // Format activities for frontend
    const formattedActivities = activities.map(activity => {
      let user_name = 'System';
      let initial = 'S';
      
      if (activity.user_id) {
        if (activity.firstName || activity.lastName) {
          user_name = `${activity.firstName || ''} ${activity.lastName || ''}`.trim();
          initial = (activity.firstName || 'U')[0].toUpperCase();
        } else {
          user_name = 'Unknown User';
          initial = 'U';
        }
      }
      
      let document_title = activity.document_title;
      if (!document_title && activity.new_values) {
        try {
          const parsed = JSON.parse(activity.new_values || '{}');
          document_title = parsed.title;
        } catch (e) {
          document_title = null;
        }
      }
      
      return {
        id: activity.id,
        user_name: user_name,
        action: activity.action,
        document_title: document_title,
        created_at: activity.created_at,
        initial: initial
      };
    });
    
    console.log('Formatted activities:', formattedActivities.length);
    console.log('Sample activity:', formattedActivities[0]);
    
    res.json(formattedActivities);
    
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/analytics/overview
// @desc    Get comprehensive analytics overview from database
// @access  Private
router.get('/analytics/overview', auth, async (req, res) => {
  try {
    console.log('Fetching comprehensive analytics from database...');
    
    // Total documents by status
    const [statusStats] = await db.query(`
      SELECT 
        workflow_status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM documents), 2) as percentage
      FROM documents 
      GROUP BY workflow_status
      ORDER BY count DESC
    `);
    
    // Documents by category
    const [categoryStats] = await db.query(`
      SELECT 
        c.display_name as category,
        COUNT(*) as total,
        SUM(CASE WHEN d.workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN d.workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN d.workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND(SUM(CASE WHEN d.workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as approval_rate
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      GROUP BY c.display_name
      ORDER BY total DESC
    `);
    
    // Documents by department
    const [departmentStats] = await db.query(`
      SELECT 
        department_code,
        COUNT(*) as total,
        SUM(CASE WHEN workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM documents 
      GROUP BY department_code
      ORDER BY total DESC
    `);
    
    // Monthly trends (last 6 months)
    const [monthlyTrends] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as documents_uploaded,
        SUM(CASE WHEN workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM documents 
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);
    
    // Recent activity summary
    const [recentActivity] = await db.query(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
      GROUP BY action
      ORDER BY count DESC
    `);
    
    // Top uploaders
    const [topUploaders] = await db.query(`
      SELECT 
        u.firstName,
        u.lastName,
        COUNT(d.id) as documents_uploaded
      FROM documents d
      LEFT JOIN users u ON d.uploader_id = u.id
      WHERE d.uploader_id IS NOT NULL
      GROUP BY u.id, u.firstName, u.lastName
      ORDER BY documents_uploaded DESC
      LIMIT 5
    `);
    
    const analytics = {
      status_distribution: statusStats,
      category_breakdown: categoryStats,
      department_breakdown: departmentStats,
      monthly_trends: monthlyTrends,
      recent_activity_summary: recentActivity,
      top_uploaders: topUploaders,
      generated_at: new Date().toISOString()
    };
    
    console.log('Analytics overview generated successfully');
    res.json(analytics);
    
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/reports/summary
// @desc    Get detailed report summary from database
// @access  Private
router.get('/reports/summary', auth, async (req, res) => {
  try {
    console.log('Generating detailed report summary from database...');
    
    // Overall statistics
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(*) as total_documents,
        SUM(CASE WHEN workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        AVG(CASE WHEN workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) * 100 as approval_rate
      FROM documents
    `);
    
    // Category performance
    const [categoryPerformance] = await db.query(`
      SELECT 
        c.display_name as category,
        COUNT(*) as total,
        SUM(CASE WHEN d.workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN d.workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN d.workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND(AVG(CASE WHEN d.workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) * 100, 2) as approval_rate
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      GROUP BY c.display_name
      ORDER BY approval_rate DESC
    `);
    
    // Department performance
    const [departmentPerformance] = await db.query(`
      SELECT 
        department_code,
        COUNT(*) as total,
        SUM(CASE WHEN workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN workflow_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        ROUND(AVG(CASE WHEN workflow_status IN ('approved', 'locked') THEN 1 ELSE 0 END) * 100, 2) as approval_rate
      FROM documents 
      GROUP BY department_code
      ORDER BY approval_rate DESC
    `);
    
    // Workflow efficiency (time to approval)
    const [workflowEfficiency] = await db.query(`
      SELECT 
        AVG(DATEDIFF(
          (SELECT MAX(created_at) FROM audit_logs al2 WHERE al2.entity_id = d.id AND al2.action IN ('DOCUMENT_APPROVED', 'DOCUMENT_LOCKED')),
          d.created_at
        )) as avg_days_to_approval
      FROM documents d
      WHERE d.workflow_status IN ('approved', 'locked')
      AND EXISTS (
        SELECT 1 FROM audit_logs al 
        WHERE al.entity_id = d.id AND al.action IN ('DOCUMENT_APPROVED', 'DOCUMENT_LOCKED')
      )
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
    
    const reportSummary = {
      overall_statistics: overallStats[0],
      category_performance: categoryPerformance,
      department_performance: departmentPerformance,
      workflow_efficiency: workflowEfficiency[0],
      file_statistics: fileStats[0],
      generated_at: new Date().toISOString()
    };
    
    console.log('Report summary generated successfully');
    res.json(reportSummary);
    
  } catch (err) {
    console.error('Report summary error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents
// @desc    Get documents with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { scope, status, category, department } = req.query || {};
    const normalizedRole = normalizeRole(req.user.role);
    const isEvaluator = normalizedRole === 'evaluator';
    const isDeptHead = normalizedRole === 'area-chair' || normalizedRole === 'department-head';
    const viewAll = canViewAll(req.user.role);

    const where = [];
    const params = [];

    // Evaluators can only see locked documents
    if (isEvaluator) {
      where.push('d.workflow_status = ?');
      params.push('locked');
    } else if (isDeptHead) {
      // Dept. Head can see their own documents + documents from their department faculty
      // First get the Dept. Head's department
      const [deptHeadProfile] = await db.query(
        'SELECT department FROM faculty_profiles WHERE user_id = ?',
        [req.user.id]
      );
      
      if (deptHeadProfile.length > 0 && deptHeadProfile[0].department) {
        const deptName = deptHeadProfile[0].department;
        // STANDARDIZED: Get department_id using exact match only
        const [deptInfo] = await db.query(
          'SELECT id FROM departments WHERE LOWER(name) = LOWER(?) OR UPPER(code) = UPPER(?) LIMIT 1',
          [deptName, deptName]
        );
        
        if (deptInfo.length > 0) {
          // Show documents uploaded by Dept. Head OR documents from their department
          where.push('(d.uploader_id = ? OR d.department_id = ?)');
          params.push(req.user.id, deptInfo[0].id);
        } else {
          console.warn(`Department not found for Dept. Head: "${deptName}". Showing only own documents.`);
          // If department not found by exact match, only show their own documents
          where.push('d.uploader_id = ?');
          params.push(req.user.id);
        }
      } else {
        // If no department profile, only show their own documents
        where.push('d.uploader_id = ?');
        params.push(req.user.id);
      }
    } else if (!viewAll || String(scope || '').toLowerCase() === 'mine') {
      // Regular users see only their own documents unless they have viewAll permission
      where.push('d.uploader_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      where.push('d.workflow_status = ?');
      params.push(status);
    }
    if (category) {
      where.push('d.category = ?');
      params.push(category);
    }
    if (department) {
      where.push('d.department_code = ?');
      params.push(department.toUpperCase());
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    
    const [rows] = await db.query(
      `
      SELECT 
        d.*,
        u.firstName AS uploader_firstName,
        u.lastName AS uploader_lastName,
        c.display_name AS category_display_name,
        dept.name AS department_name,
        (SELECT COUNT(*) FROM document_files df WHERE df.document_id = d.id) AS files_count,
        (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      ${whereSql}
      ORDER BY d.created_at DESC
      LIMIT 500
      `,
      params
    );

    // Attach standards via document_standards join table (specific per document)
    if (rows.length > 0) {
      const docIds = rows.map(r => r.id);
      const [stdRows] = await db.query(
        `SELECT ds.document_id, s.name
         FROM document_standards ds
         JOIN standards s ON ds.standard_id = s.id
         WHERE ds.document_id IN (?) AND s.is_active = 1
         ORDER BY s.sort_order ASC`,
        [docIds]
      );
      const stdMap = {};
      stdRows.forEach(s => {
        if (!stdMap[s.document_id]) stdMap[s.document_id] = [];
        stdMap[s.document_id].push(s.name);
      });
      rows.forEach(r => { r.standards = stdMap[r.id] || []; });
    }

    res.json(rows);
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/categories
// @desc    Get all active categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    res.json(categories);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/departments
// @desc    Get all active departments
// @access  Private
router.get('/departments', auth, async (req, res) => {
  try {
    const [departments] = await db.query(
      'SELECT * FROM departments WHERE is_active = 1 ORDER BY code ASC'
    );
    res.json(departments);
  } catch (err) {
    console.error('Departments error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/user/department
// @desc    Get current user's department from faculty_profiles
// @access  Private
router.get('/user/department', auth, async (req, res) => {
  try {
    // First try joining faculty_profiles to departments
    const [profile] = await db.query(
      `SELECT fp.department AS raw_department,
              d.id AS department_id, d.name AS department_name, d.code AS department_code
       FROM faculty_profiles fp
       LEFT JOIN departments d ON (
         d.name = fp.department OR
         d.code = fp.department OR
         d.name LIKE CONCAT('%', fp.department, '%') OR
         fp.department LIKE CONCAT('%', d.code, '%')
       )
       WHERE fp.user_id = ?
       ORDER BY d.id IS NOT NULL DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (profile.length > 0) {
      // If join resolved a real department row, return it
      if (profile[0].department_id) {
        return res.json(profile[0]);
      }
      // Join didn't resolve — try a direct lookup using the raw stored value
      const raw = (profile[0].raw_department || '').trim();
      if (raw) {
        // STANDARDIZED: Exact match only on name or code
        const [dept] = await db.query(
          'SELECT id AS department_id, name AS department_name, code AS department_code FROM departments WHERE LOWER(name) = LOWER(?) OR UPPER(code) = UPPER(?) LIMIT 1',
          [raw, raw]
        );
        if (dept.length) return res.json(dept[0]);
        
        console.warn(`Department not found for user ${req.user.id}: "${raw}"`);
      }
      // Return raw value so the upload form at least shows something
      return res.json({ department_id: null, department_name: profile[0].raw_department, department_code: null });
    }

    res.json({ department_id: null, department_name: null, department_code: null });
  } catch (err) {
    console.error('User department error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/approvals
// @desc    Get documents pending approval
// @access  Private (Admin, Dean)
router.get('/approvals', auth, async (req, res) => {
  try {
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view approvals' });
    }
    
    const [rows] = await db.query(
      `
      SELECT 
        d.*,
        u.firstName AS uploader_firstName,
        u.lastName AS uploader_lastName,
        u.email AS uploader_email,
        c.display_name AS category_display_name,
        dept.name AS department_name,
        (SELECT COUNT(*) FROM document_files df WHERE df.document_id = d.id) AS files_count,
        (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.workflow_status IN ('pending','validated')
      ORDER BY d.created_at DESC
      LIMIT 200
      `
    );
    
    // Attach standards for each document
    if (rows.length > 0) {
      const docIds = rows.map(r => r.id);
      const [stdRows] = await db.query(
        `SELECT ds.document_id, s.name
         FROM document_standards ds
         JOIN standards s ON ds.standard_id = s.id
         WHERE ds.document_id IN (?) AND s.is_active = 1
         ORDER BY s.sort_order ASC`,
        [docIds]
      );
      const stdMap = {};
      stdRows.forEach(s => {
        if (!stdMap[s.document_id]) stdMap[s.document_id] = [];
        stdMap[s.document_id].push(s.name);
      });
      rows.forEach(r => { r.standards = stdMap[r.id] || []; });
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Approvals error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/stats/evaluator
// @desc    Get dashboard statistics for evaluator (locked documents only)
// @access  Private (Evaluator)
router.get('/stats/evaluator', auth, async (req, res) => {
  try {
    const normalizedRole = normalizeRole(req.user.role);
    const isEvaluator = normalizedRole === 'evaluator';
    
    if (!isEvaluator) {
      return res.status(403).json({ msg: 'This endpoint is for evaluators only' });
    }
    
    // Evaluators can see locked documents in the main view, but stats show all approved+locked
    const statusFilter = "WHERE d.workflow_status = 'locked'";
    
    // Get total locked documents count (for main stats and categories)
    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total FROM documents d ${statusFilter}`
    );
    const totalDocuments = totalResult[0]?.total || 0;
    
    // Get total required documents from category_requirements (sum across all categories and departments)
    const [totalRequiredResult] = await db.query(
      `SELECT SUM(expected_documents) as total_required FROM category_requirements`
    );
    const totalRequiredDocuments = totalRequiredResult[0]?.total_required || 0;
    
    // Get total active departments count
    const [totalDepartmentsResult] = await db.query(
      `SELECT COUNT(*) as total FROM departments WHERE is_active = 1`
    );
    const totalDepartmentsCount = totalDepartmentsResult[0]?.total || 0;
    
    // Get ALL approved documents count (approved + locked, since locked is also approved)
    const [approvedResult] = await db.query(
      `SELECT COUNT(*) as total FROM documents WHERE workflow_status IN ('approved', 'locked')`
    );
    const approvedDocuments = approvedResult[0]?.total || 0;
    
    // Get locked documents count separately
    const [lockedResult] = await db.query(
      `SELECT COUNT(*) as total FROM documents WHERE workflow_status = 'locked'`
    );
    const lockedDocuments = lockedResult[0]?.total || 0;
    
    // Get pending documents count
    const [pendingResult] = await db.query(
      `SELECT COUNT(*) as total FROM documents WHERE workflow_status IN ('pending', 'validated')`
    );
    const pendingDocuments = pendingResult[0]?.total || 0;
    
    // Get counts by category (only locked documents) with requirements from category_requirements
    const [categoryStats] = await db.query(
      `SELECT 
        c.name,
        c.display_name,
        COUNT(d.id) as count,
        ROUND((COUNT(d.id) * 100.0 / ?), 1) as percentage,
        SUM(cr.expected_documents) as total_required
       FROM categories c
       LEFT JOIN documents d ON c.id = d.category_id AND d.workflow_status = 'locked'
       LEFT JOIN category_requirements cr ON c.id = cr.category_id
       WHERE c.is_active = 1
       GROUP BY c.id, c.name, c.display_name
       ORDER BY c.sort_order ASC`,
      [totalDocuments || 1]
    );
    
    // Get counts by department (only locked documents)
    const [departmentStats] = await db.query(
      `SELECT 
        dept.code,
        dept.name,
        COUNT(d.id) as count
       FROM departments dept
       LEFT JOIN documents d ON dept.id = d.department_id AND d.workflow_status = 'locked'
       WHERE dept.is_active = 1
       GROUP BY dept.id, dept.code, dept.name
       ORDER BY dept.code ASC`
    );
    
    // Get recent locked documents (limit 10 for dashboard)
    const [recentDocs] = await db.query(
      `SELECT 
        d.id,
        d.title,
        d.category,
        d.category_name,
        d.department_code as department,
        d.workflow_status as status,
        d.version,
        d.author_name,
        d.created_at,
        c.display_name as category_display_name,
        dept.name as department_name,
        (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
       FROM documents d
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN departments dept ON d.department_id = dept.id
       ${statusFilter}
       ORDER BY d.created_at DESC
       LIMIT 10`
    );
    
    // Attach standards to recent documents
    if (recentDocs.length > 0) {
      const docIds = recentDocs.map(r => r.id);
      const [stdRows] = await db.query(
        `SELECT ds.document_id, s.name, s.code
         FROM document_standards ds
         JOIN standards s ON ds.standard_id = s.id
         WHERE ds.document_id IN (?) AND s.is_active = 1
         ORDER BY s.sort_order ASC`,
        [docIds]
      );
      const stdMap = {};
      stdRows.forEach(s => {
        if (!stdMap[s.document_id]) stdMap[s.document_id] = [];
        stdMap[s.document_id].push(s.name);
      });
      recentDocs.forEach(r => { r.standards = stdMap[r.id] || []; });
    }
    
    res.json({
      total: totalDocuments,
      total_required: totalRequiredDocuments,
      total_departments: totalDepartmentsCount,
      locked: lockedDocuments,
      approved: approvedDocuments,
      pending: pendingDocuments,
      categories: categoryStats,
      departments: departmentStats,
      recentDocuments: recentDocs
    });
  } catch (err) {
    console.error('Evaluator dashboard stats error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/category-requirements
// @desc    Get all category requirements for all departments
// @access  Private
router.get('/category-requirements', auth, async (req, res) => {
  try {
    const [requirements] = await db.query(
      `SELECT 
        cr.id,
        cr.category_id,
        cr.department_id,
        cr.expected_documents,
        cr.is_required,
        c.name as category_name,
        c.display_name as category_display_name,
        d.code as department_code,
        d.name as department_name
       FROM category_requirements cr
       LEFT JOIN categories c ON cr.category_id = c.id
       LEFT JOIN departments d ON cr.department_id = d.id
       WHERE cr.is_required = 1
       ORDER BY c.sort_order ASC, d.code ASC`
    );
    
    res.json(requirements);
  } catch (err) {
    console.error('Category requirements error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/standards
// @desc    Get active standards, optionally filtered by category_id
// @access  Private
router.get('/standards', auth, async (req, res) => {
  try {
    const { category_id } = req.query;
    const params = [];
    let where = 'WHERE s.is_active = 1';
    if (category_id) {
      where += ' AND s.category_id = ?';
      params.push(Number(category_id));
    }
    const [rows] = await db.query(
      `SELECT s.id, s.name, s.code, s.description, s.category_id, c.display_name AS category_name
       FROM standards s
       LEFT JOIN categories c ON s.category_id = c.id
       ${where}
       ORDER BY s.sort_order ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('Get standards error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/evidence-map
// @route   PUT /api/documents/:id/status
// @desc    Update document workflow status
// @access  Private (Admin, Dean)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to update status' });
    }
    
    const docId = Number(req.params.id);
    const status = (req.body?.status || '').toString().toLowerCase().trim();
    const comments = req.body?.comments || null;
    
    const allowed = ['draft', 'pending', 'validated', 'approved', 'locked', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status. Allowed: ' + allowed.join(', ') });
    }

    // Get old status for audit
    const [oldDoc] = await db.query('SELECT workflow_status FROM documents WHERE id = ?', [docId]);
    if (oldDoc.length === 0) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    await db.query('UPDATE documents SET workflow_status = ? WHERE id = ?', [status, docId]);

    // Create approval workflow record
    try {
      await db.query(
        `INSERT INTO approval_workflow (document_id, stage, status, action_by, comments, completed_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [docId, status, 'completed', req.user.id, comments]
      );
    } catch (workflowErr) {
      console.log('Workflow log skipped:', workflowErr.message);
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_STATUS_UPDATE', 'document', ?, ?, ?, ?, ?)`,
        [req.user.id, docId, JSON.stringify({ workflow_status: oldDoc[0].workflow_status }), JSON.stringify({ workflow_status: status, comments }), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) { console.log('Audit log skipped:', auditErr.message); }

    res.json({ msg: 'Document status updated successfully', status });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/:id/comments
// @desc    Get rejection comments for a document
// @access  Private
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const docId = Number(req.params.id);
    
    console.log('=== COMMENTS REQUEST ===');
    console.log('Document ID:', docId);
    console.log('User ID:', req.user.id);
    console.log('User Role (raw):', req.user.role);
    
    // Get document to check ownership and department
    const [docs] = await db.query('SELECT uploader_id, department_id FROM documents WHERE id = ?', [docId]);
    if (docs.length === 0) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    console.log('Document:', { uploader_id: docs[0].uploader_id, department_id: docs[0].department_id });
    
    const normalizedRole = normalizeRole(req.user.role);
    console.log('Normalized Role:', normalizedRole);
    
    const viewAll = canViewAll(req.user.role);
    const isDeptHead = normalizedRole === 'area-chair' || normalizedRole === 'department-head';
    
    console.log('Authorization checks:', { viewAll, isDeptHead, isOwner: docs[0].uploader_id === req.user.id });
    
    // Check if user can view this document's comments
    let authorized = viewAll || docs[0].uploader_id === req.user.id;
    
    // Area-chair/Dept. Head can view comments for documents in their department
    if (!authorized && isDeptHead) {
      console.log('Checking Dept. Head department...');
      const [profile] = await db.query(
        'SELECT department FROM faculty_profiles WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );
      console.log('Faculty profile:', profile);
      
      if (profile.length && profile[0].department) {
        const deptValue = profile[0].department.trim();
        console.log('Dept. Head department value:', deptValue);
        
        // STANDARDIZED: Exact match only on name or code
        const [dept] = await db.query(
          'SELECT id FROM departments WHERE LOWER(name) = LOWER(?) OR UPPER(code) = UPPER(?) LIMIT 1',
          [deptValue, deptValue]
        );
        console.log('Department lookup result:', dept);
        
        if (dept.length && dept[0].id === docs[0].department_id) {
          console.log('Authorized: Dept. Head of same department');
          authorized = true;
        } else {
          console.log('NOT Authorized: Department mismatch', { deptHeadDeptId: dept[0]?.id, documentDeptId: docs[0].department_id });
        }
      } else {
        console.log('NOT Authorized: No faculty profile found');
      }
    }
    
    console.log('Final authorization:', authorized);
    
    if (!authorized) {
      return res.status(403).json({ msg: 'Not authorized to view comments' });
    }
    
    // Get rejection comments from approval_workflow table
    const [comments] = await db.query(
      `SELECT 
        aw.comments as reason,
        aw.created_at,
        aw.completed_at,
        u.firstName,
        u.lastName,
        CONCAT(u.firstName, ' ', u.lastName) as reviewer_name
       FROM approval_workflow aw
       LEFT JOIN users u ON aw.action_by = u.id
       WHERE aw.document_id = ? AND aw.status = 'completed' AND aw.comments IS NOT NULL
       ORDER BY aw.created_at DESC`,
      [docId]
    );
    
    res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document and its files
// @access  Private (Admin, Dept. Head for rejected docs in their dept, or owner if draft/rejected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const docId = Number(req.params.id);
    
    console.log('=== DELETE REQUEST ===');
    console.log('Document ID:', docId);
    console.log('User ID:', req.user.id);
    console.log('User Role (raw):', req.user.role);
    
    const [docs] = await db.query('SELECT * FROM documents WHERE id = ?', [docId]);
    if (docs.length === 0) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    const document = docs[0];
    console.log('Document:', { id: document.id, uploader_id: document.uploader_id, department_id: document.department_id, workflow_status: document.workflow_status });
    
    const normalizedRole = normalizeRole(req.user.role);
    console.log('Normalized Role:', normalizedRole);
    
    const isAdmin = normalizedRole === 'admin';
    const isDeptHead = normalizedRole === 'area-chair' || normalizedRole === 'department-head';
    const isOwner = document.uploader_id === req.user.id;
    const isDraft = document.workflow_status === 'draft';
    const isRejected = document.workflow_status === 'rejected';

    console.log('Authorization checks:', { isAdmin, isDeptHead, isOwner, isDraft, isRejected });

    let authorized = false;

    // Admin can delete any document
    if (isAdmin) {
      console.log('Authorized: Admin');
      authorized = true;
    }
    // Owner can delete their own draft or rejected documents
    else if (isOwner && (isDraft || isRejected)) {
      console.log('Authorized: Owner of draft/rejected');
      authorized = true;
    }
    // Dept. Head can delete rejected documents from their department
    else if (isDeptHead && isRejected) {
      console.log('Checking Dept. Head department...');
      const [profile] = await db.query(
        'SELECT department FROM faculty_profiles WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );
      console.log('Faculty profile:', profile);
      
      if (profile.length && profile[0].department) {
        const deptValue = profile[0].department.trim();
        console.log('Dept. Head department value:', deptValue);
        
        // STANDARDIZED: Exact match only on name or code
        const [dept] = await db.query(
          'SELECT id FROM departments WHERE LOWER(name) = LOWER(?) OR UPPER(code) = UPPER(?) LIMIT 1',
          [deptValue, deptValue]
        );
        console.log('Department lookup result:', dept);
        
        if (dept.length && dept[0].id === document.department_id) {
          console.log('Authorized: Dept. Head of same department');
          authorized = true;
        } else {
          console.log('NOT Authorized: Department mismatch', { deptHeadDeptId: dept[0]?.id, documentDeptId: document.department_id });
        }
      } else {
        console.log('NOT Authorized: No faculty profile found');
      }
    }

    console.log('Final authorization:', authorized);

    if (!authorized) {
      return res.status(403).json({ msg: 'Not authorized to delete this document' });
    }

    // Get all files to delete from filesystem
    const [files] = await db.query('SELECT stored_name FROM document_files WHERE document_id = ?', [docId]);

    // Delete document (cascade will delete files records)
    await db.query('DELETE FROM documents WHERE id = ?', [docId]);

    // Delete physical files
    for (const file of files) {
      try {
        const filePath = path.join(uploadRoot, file.stored_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsErr) {
        console.error('File deletion error:', fsErr.message);
      }
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_DELETE', 'document', ?, ?, ?, ?)`,
        [req.user.id, docId, JSON.stringify(document), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) { console.log('Audit log skipped:', auditErr.message); }

    res.json({ msg: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/evidence-map
// @desc    Get evidence map data (category requirements by department)
// @access  Private (Evaluator)
router.get('/evidence-map', auth, async (req, res) => {
  try {
    // Get category requirements with current document counts
    const [evidenceData] = await db.query(
      `SELECT 
        c.id as category_id,
        c.name as category_name,
        c.display_name as category_display_name,
        d.id as department_id,
        d.code as department_code,
        d.name as department_name,
        cr.expected_documents,
        COUNT(doc.id) as current_documents
       FROM categories c
       CROSS JOIN departments d
       LEFT JOIN category_requirements cr ON c.id = cr.category_id AND d.id = cr.department_id
       LEFT JOIN documents doc ON c.id = doc.category_id AND d.id = doc.department_id AND doc.workflow_status = 'locked'
       WHERE c.is_active = 1 AND d.is_active = 1
       GROUP BY c.id, c.name, c.display_name, d.id, d.code, d.name, cr.expected_documents
       ORDER BY c.sort_order ASC, d.code ASC`
    );
    
    // Group by category
    const categories = {};
    evidenceData.forEach(row => {
      const catName = row.category_name;
      if (!categories[catName]) {
        categories[catName] = {
          category_id: row.category_id,
          category_name: row.category_name,
          category_display_name: row.category_display_name,
          departments: [],
          total_current: 0,
          total_expected: 0
        };
      }
      
      const current = row.current_documents || 0;
      const expected = row.expected_documents || 0;
      
      categories[catName].departments.push({
        department_id: row.department_id,
        department_code: row.department_code,
        department_name: row.department_name,
        current: current,
        expected: expected,
        status: current >= expected ? 'complete' : 'partial'
      });
      
      categories[catName].total_current += current;
      categories[catName].total_expected += expected;
    });
    
    res.json(categories);
  } catch (err) {
    console.error('Evidence map error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/search
// @desc    Search documents with filters (evaluator sees only locked)
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, category, department, status, sort } = req.query;
    const normalizedRole = normalizeRole(req.user.role);
    const isEvaluator = normalizedRole === 'evaluator';
    
    const where = [];
    const params = [];
    
    // Evaluators can only see locked documents
    if (isEvaluator) {
      where.push('d.workflow_status = ?');
      params.push('locked');
    } else if (status) {
      where.push('d.workflow_status = ?');
      params.push(status);
    }
    
    // Search query
    if (q) {
      where.push('(d.title LIKE ? OR d.author_name LIKE ? OR d.description LIKE ? OR d.keywords LIKE ?)');
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Category filter
    if (category && category !== 'all') {
      where.push('c.name = ?');
      params.push(category);
    }
    
    // Department filter
    if (department && department !== 'all') {
      where.push('dept.code = ?');
      params.push(department.toUpperCase());
    }
    
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    
    // Sort order
    let orderBy = 'ORDER BY d.created_at DESC';
    if (sort === 'date_asc') orderBy = 'ORDER BY d.created_at ASC';
    else if (sort === 'title_asc') orderBy = 'ORDER BY d.title ASC';
    else if (sort === 'title_desc') orderBy = 'ORDER BY d.title DESC';
    
    const [documents] = await db.query(
      `SELECT 
        d.*,
        c.display_name as category_display_name,
        dept.name as department_name,
        dept.code as department_code,
        (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
       FROM documents d
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN departments dept ON d.department_id = dept.id
       ${whereSql}
       ${orderBy}
       LIMIT 100`,
      params
    );
    
    // Attach standards
    if (documents.length > 0) {
      const docIds = documents.map(r => r.id);
      const [stdRows] = await db.query(
        `SELECT ds.document_id, s.name
         FROM document_standards ds
         JOIN standards s ON ds.standard_id = s.id
         WHERE ds.document_id IN (?) AND s.is_active = 1
         ORDER BY s.sort_order ASC`,
        [docIds]
      );
      const stdMap = {};
      stdRows.forEach(s => {
        if (!stdMap[s.document_id]) stdMap[s.document_id] = [];
        stdMap[s.document_id].push(s.name);
      });
      documents.forEach(r => { r.standards = stdMap[r.id] || []; });
    }
    
    res.json(documents);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/reports/compliance
// @desc    Get compliance summary report
// @access  Private (Evaluator)
router.get('/reports/compliance', auth, async (req, res) => {
  try {
    // Get category compliance data
    const [categoryCompliance] = await db.query(
      `SELECT 
        c.id as category_id,
        c.name as category_name,
        c.display_name as category_display_name,
        SUM(cr.expected_documents) as total_expected,
        COUNT(DISTINCT CASE WHEN d.workflow_status = 'locked' THEN d.id END) as total_current
       FROM categories c
       LEFT JOIN category_requirements cr ON c.id = cr.category_id
       LEFT JOIN documents d ON c.id = d.category_id
       WHERE c.is_active = 1
       GROUP BY c.id, c.name, c.display_name
       ORDER BY c.sort_order ASC`
    );
    
    // Get department breakdown per category
    const [departmentBreakdown] = await db.query(
      `SELECT 
        c.name as category_name,
        d.code as department_code,
        d.name as department_name,
        cr.expected_documents,
        COUNT(doc.id) as current_documents
       FROM categories c
       CROSS JOIN departments d
       LEFT JOIN category_requirements cr ON c.id = cr.category_id AND d.id = cr.department_id
       LEFT JOIN documents doc ON c.id = doc.category_id AND d.id = doc.department_id AND doc.workflow_status = 'locked'
       WHERE c.is_active = 1 AND d.is_active = 1
       GROUP BY c.name, d.code, d.name, cr.expected_documents
       ORDER BY c.name ASC, d.code ASC`
    );
    
    // Format response
    const compliance = {
      categories: categoryCompliance.map(cat => ({
        category_name: cat.category_name,
        category_display_name: cat.category_display_name,
        total_current: cat.total_current || 0,
        total_expected: cat.total_expected || 0,
        percentage: cat.total_expected > 0 ? Math.round((cat.total_current / cat.total_expected) * 100) : 0
      })),
      departments: {}
    };
    
    // Group departments by category
    departmentBreakdown.forEach(row => {
      if (!compliance.departments[row.category_name]) {
        compliance.departments[row.category_name] = [];
      }
      const current = row.current_documents || 0;
      const expected = row.expected_documents || 0;
      compliance.departments[row.category_name].push({
        department_code: row.department_code,
        department_name: row.department_name,
        current: current,
        expected: expected,
        status: current >= expected ? 'complete' : (current > 0 ? 'partial' : 'missing')
      });
    });
    
    res.json(compliance);
  } catch (err) {
    console.error('Compliance report error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/reports/gap-analysis
// @desc    Get gap analysis report
// @access  Private (Evaluator)
router.get('/reports/gap-analysis', auth, async (req, res) => {
  try {
    // Find gaps (departments with missing documents)
    const [gaps] = await db.query(
      `SELECT 
        c.name as category_name,
        c.display_name as category_display_name,
        d.code as department_code,
        d.name as department_name,
        cr.expected_documents,
        COUNT(doc.id) as current_documents,
        (cr.expected_documents - COUNT(doc.id)) as missing_documents
       FROM categories c
       CROSS JOIN departments d
       LEFT JOIN category_requirements cr ON c.id = cr.category_id AND d.id = cr.department_id
       LEFT JOIN documents doc ON c.id = doc.category_id AND d.id = doc.department_id AND doc.workflow_status = 'locked'
       WHERE c.is_active = 1 AND d.is_active = 1 AND cr.expected_documents IS NOT NULL
       GROUP BY c.name, c.display_name, d.code, d.name, cr.expected_documents
       HAVING missing_documents > 0
       ORDER BY missing_documents DESC, c.name ASC`
    );
    
    // Group by category
    const gapsByCategory = {};
    gaps.forEach(gap => {
      if (!gapsByCategory[gap.category_name]) {
        gapsByCategory[gap.category_name] = {
          category_display_name: gap.category_display_name,
          gaps: []
        };
      }
      gapsByCategory[gap.category_name].gaps.push({
        department_code: gap.department_code,
        department_name: gap.department_name,
        expected: gap.expected_documents,
        current: gap.current_documents || 0,
        missing: gap.missing_documents
      });
    });
    
    res.json(gapsByCategory);
  } catch (err) {
    console.error('Gap analysis error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/:id
// @desc    Get single document with all files
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const docId = Number(req.params.id);
    
    // Validate docId is a valid number
    if (isNaN(docId) || docId <= 0) {
      return res.status(400).json({ msg: 'Invalid document ID' });
    }
    
    const [docs] = await db.query(
      `
      SELECT 
        d.*,
        u.firstName AS uploader_firstName,
        u.lastName AS uploader_lastName,
        u.email AS uploader_email,
        c.display_name AS category_display_name,
        dept.name AS department_name,
        dept.code AS department_code
      FROM documents d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = ?
      `,
      [docId]
    );

    if (docs.length === 0) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    const document = docs[0];

    // Check permissions
    const normalizedRole = normalizeRole(req.user.role);
    const isEvaluator = normalizedRole === 'evaluator';
    const viewAll = canViewAll(req.user.role);

    if (isEvaluator && document.workflow_status !== 'locked') {
      return res.status(403).json({ msg: 'Evaluators can only view locked documents' });
    }

    if (!viewAll && document.uploader_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this document' });
    }

    // Get all files for this document
    const [files] = await db.query(
      'SELECT * FROM document_files WHERE document_id = ? ORDER BY id ASC',
      [docId]
    );

    document.files = files;

    res.json(document);
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

