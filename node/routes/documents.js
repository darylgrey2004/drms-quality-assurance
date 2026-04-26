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
  return r === 'admin' || r === 'faculty member' || r === 'area chair/program head' || r === 'qa coordinator';
}

function canViewAll(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean' || r === 'qa coordinator';
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
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// POST /api/documents/upload
// multipart/form-data: files[], title, category, area, version, author, description, keywords, workflow
router.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!canUpload(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to upload documents' });
    }

    const {
      title,
      category,
      area,
      version,
      author,
      description,
      keywords,
      workflow
    } = req.body || {};

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ msg: 'No files uploaded' });
    if (!title || !category || !area) return res.status(400).json({ msg: 'Missing required fields' });

    const workflowMap = {
      submit: 'pending',
      draft: 'draft',
      approve: 'approved'
    };
    const status = workflowMap[String(workflow || 'submit')] || 'pending';

    const [result] = await db.query(
      `INSERT INTO documents
        (title, category, area, version, description, keywords, workflow_status, uploader_id, author_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        area,
        version || 'v1.0',
        description || null,
        keywords || null,
        status,
        req.user.id,
        author || null
      ]
    );

    const documentId = result.insertId;

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

    res.status(201).json({
      msg: 'Uploaded',
      document: {
        id: documentId,
        title,
        category,
        area,
        version: version || 'v1.0',
        workflow_status: status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/documents
// Query: scope=all|mine (default role-based), status, category
router.get('/', auth, async (req, res) => {
  try {
    const { scope, status, category } = req.query || {};
    const normalizedRole = normalizeRole(req.user.role);
    const isEvaluator = normalizedRole === 'evaluator' || normalizedRole === 'external evaluator';
    const viewAll = canViewAll(req.user.role);

    const where = [];
    const params = [];

    // For evaluators: show all approved documents
    if (isEvaluator) {
      where.push('d.workflow_status = ?');
      params.push('approved');
    } else if (!viewAll || String(scope || '').toLowerCase() === 'mine') {
      // For others: show only their own documents unless they can view all
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

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await db.query(
      `
      SELECT d.*,
             (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      ${whereSql}
      ORDER BY d.created_at DESC
      LIMIT 200
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/documents/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const viewAll = canViewAll(req.user.role);
    const params = [];
    let whereSql = '';
    if (!viewAll) {
      whereSql = 'WHERE uploader_id = ?';
      params.push(req.user.id);
    }
    const [rows] = await db.query(
      `
      SELECT workflow_status, COUNT(*) AS count
      FROM documents
      ${whereSql}
      GROUP BY workflow_status
      `,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/documents/approvals
router.get('/approvals', auth, async (req, res) => {
  try {
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view approvals' });
    }
    const [rows] = await db.query(
      `
      SELECT d.*,
             (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      WHERE d.workflow_status IN ('pending','validated')
      ORDER BY d.created_at DESC
      LIMIT 200
      `
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/documents/:id/status  body: { status }
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to update status' });
    }
    const docId = Number(req.params.id);
    const status = (req.body?.status || '').toString().toLowerCase().trim();
    const allowed = ['draft', 'pending', 'validated', 'approved', 'locked', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ msg: 'Invalid status' });

    await db.query('UPDATE documents SET workflow_status = ? WHERE id = ?', [status, docId]);
    res.json({ msg: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

