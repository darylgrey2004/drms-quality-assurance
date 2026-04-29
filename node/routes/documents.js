const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

function normalizeRole(role) {
  return (role || '').toString().toLowerCase().trim();
}

function canUpload(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'faculty' || r === 'area-chair' || r === 'dean';
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
// @access  Private (Admin, Dean, Faculty, Area-Chair)
router.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!canUpload(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to upload documents' });
    }

    const {
      title,
      category,
      department,
      author,
      version,
      description,
      keywords,
      workflow,
      expiryDate
    } = req.body || {};

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ msg: 'No files uploaded' });
    if (!title || !category || !department || !author) {
      return res.status(400).json({ msg: 'Missing required fields: title, category, department, author' });
    }

    // Map workflow to status
    const workflowMap = {
      submit: 'pending',
      draft: 'draft',
      approve: 'approved'
    };
    const status = workflowMap[String(workflow || 'submit')] || 'pending';

    // Get category_id from categories table
    const [categories] = await db.query(
      'SELECT id FROM categories WHERE name = ? LIMIT 1',
      [category]
    );
    const categoryId = categories.length > 0 ? categories[0].id : null;

    // Get department_id from departments table
    const [departments] = await db.query(
      'SELECT id FROM departments WHERE code = ? LIMIT 1',
      [department.toUpperCase()]
    );
    const departmentId = departments.length > 0 ? departments[0].id : null;

    // Insert document record
    const [result] = await db.query(
      `INSERT INTO documents
        (title, category, category_id, area, department_id, version, description, keywords, 
         workflow_status, uploader_id, author_name, category_name, department_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        categoryId,
        department, // area field stores department for now
        departmentId,
        version || 'v1.0',
        description || null,
        keywords || null,
        status,
        req.user.id,
        author,
        category,
        department.toUpperCase()
      ]
    );

    const documentId = result.insertId;

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

    // Create audit log
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          'DOCUMENT_UPLOAD',
          'document',
          documentId,
          JSON.stringify({ title, category, department, status }),
          req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'Unknown',
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    } catch (auditErr) {
      console.log('Audit log skipped:', auditErr.message);
    }

    res.status(201).json({
      msg: 'Document uploaded successfully',
      document: {
        id: documentId,
        title,
        category,
        department,
        version: version || 'v1.0',
        workflow_status: status,
        files_count: files.length
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ msg: 'Server error during upload' });
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
    const viewAll = canViewAll(req.user.role);

    const where = [];
    const params = [];

    // Evaluators can only see approved documents
    if (isEvaluator) {
      where.push('d.workflow_status = ?');
      params.push('approved');
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

    res.json(rows);
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/documents/:id
// @desc    Get single document with all files
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const docId = Number(req.params.id);
    
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

    if (isEvaluator && document.workflow_status !== 'approved') {
      return res.status(403).json({ msg: 'Evaluators can only view approved documents' });
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

// @route   GET /api/documents/stats
// @desc    Get document statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const viewAll = canViewAll(req.user.role);
    const params = [];
    let whereSql = '';
    
    if (!viewAll) {
      whereSql = 'WHERE uploader_id = ?';
      params.push(req.user.id);
    }
    
    const [statusStats] = await db.query(
      `
      SELECT workflow_status, COUNT(*) AS count
      FROM documents
      ${whereSql}
      GROUP BY workflow_status
      `,
      params
    );

    const [categoryStats] = await db.query(
      `
      SELECT category, COUNT(*) AS count
      FROM documents
      ${whereSql}
      GROUP BY category
      `,
      params
    );

    const [departmentStats] = await db.query(
      `
      SELECT department_code, COUNT(*) AS count
      FROM documents
      ${whereSql}
      GROUP BY department_code
      `,
      params
    );

    res.json({
      by_status: statusStats,
      by_category: categoryStats,
      by_department: departmentStats
    });
  } catch (err) {
    console.error('Stats error:', err);
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
    
    res.json(rows);
  } catch (err) {
    console.error('Approvals error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

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

    // Create audit log
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          'DOCUMENT_STATUS_UPDATE',
          'document',
          docId,
          JSON.stringify({ workflow_status: oldDoc[0].workflow_status }),
          JSON.stringify({ workflow_status: status, comments }),
          req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'Unknown',
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    } catch (auditErr) {
      console.log('Audit log skipped:', auditErr.message);
    }

    res.json({ msg: 'Document status updated successfully', status });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document and its files
// @access  Private (Admin, or owner if draft)
router.delete('/:id', auth, async (req, res) => {
  try {
    const docId = Number(req.params.id);
    
    const [docs] = await db.query('SELECT * FROM documents WHERE id = ?', [docId]);
    if (docs.length === 0) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    const document = docs[0];
    const isAdmin = normalizeRole(req.user.role) === 'admin';
    const isOwner = document.uploader_id === req.user.id;
    const isDraft = document.workflow_status === 'draft';

    // Only admin can delete any document, or owner can delete their own draft
    if (!isAdmin && !(isOwner && isDraft)) {
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

    // Create audit log
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          'DOCUMENT_DELETE',
          'document',
          docId,
          JSON.stringify(document),
          req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'Unknown',
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    } catch (auditErr) {
      console.log('Audit log skipped:', auditErr.message);
    }

    res.json({ msg: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
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

module.exports = router;
