const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const multer = require('multer');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');
let documentsSchemaEnsured = false;

function normalizeRole(role) {
  return (role || '').toString().toLowerCase().trim();
}

function canUpload(role) {
  const r = normalizeRole(role);
  return r === 'faculty member';
}

function canViewAll(role) {
  const r = normalizeRole(role);
  return r === 'admin';
}

function canApprove(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean';
}

function isProgramHead(role) {
  const r = normalizeRole(role);
  return r === 'area chair/program head' || r === 'program head' || r === 'area chair';
}

function isCoordinator(role) {
  return normalizeRole(role) === 'qa coordinator';
}

function canLock(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean';
}

function isDean(role) {
  return normalizeRole(role) === 'dean';
}

function normalizeWorkflowStatus(raw) {
  const value = String(raw || '').toLowerCase().trim();
  const map = {
    pending: 'submitted',
    draft: 'submitted',
    submitted: 'submitted',
    validated: 'validated_coordinator',
    validated_program_head: 'validated_program_head',
    validated_coordinator: 'validated_coordinator',
    approved: 'approved',
    locked: 'locked',
    rejected: 'rejected'
  };
  return map[value] || 'submitted';
}

async function convertDocumentToPdfIfPossible(sourceAbsolutePath) {
  const ext = path.extname(sourceAbsolutePath).toLowerCase();
  if (ext === '.pdf') {
    return { success: true, pdfAbsolutePath: sourceAbsolutePath };
  }

  const outputDir = path.dirname(sourceAbsolutePath);
  const base = path.basename(sourceAbsolutePath, ext);
  const expectedPdfPath = path.join(outputDir, `${base}.pdf`);

  if (fs.existsSync(expectedPdfPath)) {
    return { success: true, pdfAbsolutePath: expectedPdfPath };
  }

  const soffice = process.platform === 'win32' ? 'soffice.exe' : 'soffice';
  const args = ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, sourceAbsolutePath];

  const success = await new Promise((resolve) => {
    const proc = spawn(soffice, args, { shell: false });
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        try { proc.kill(); } catch (_e) {}
        resolve(false);
      }
    }, 30000);

    proc.on('error', () => {
      if (!done) {
        done = true;
        clearTimeout(timeout);
        resolve(false);
      }
    });
    proc.on('exit', (code) => {
      if (!done) {
        done = true;
        clearTimeout(timeout);
        resolve(code === 0);
      }
    });
  });

  if (!success || !fs.existsSync(expectedPdfPath)) {
    return { success: false, pdfAbsolutePath: null };
  }
  return { success: true, pdfAbsolutePath: expectedPdfPath };
}

async function ensureDocumentsWorkflowSchema() {
  if (documentsSchemaEnsured) return;
  try {
    await db.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS department VARCHAR(120) NULL,
      ADD COLUMN IF NOT EXISTS status VARCHAR(64) NULL,
      ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS date_added TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS approved_by VARCHAR(120) NULL,
      ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP NULL DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS pdf_file_path VARCHAR(255) NULL
    `);
  } catch (_e) {
    // keep compatibility with stricter SQL/MariaDB variants
  }
  documentsSchemaEnsured = true;
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
    await ensureDocumentsWorkflowSchema();
    if (!canUpload(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to upload documents' });
    }

    const {
      title,
      department,
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
    if (!title || !department || !category || !area) return res.status(400).json({ msg: 'Missing required fields' });

    const normalizedCategory = String(category || '').toUpperCase().trim();
    if (!['ISO', 'COE', 'AACCUP'].includes(normalizedCategory)) {
      return res.status(400).json({ msg: 'Invalid category. Allowed: ISO, COE, AACCUP' });
    }

    const status = 'submitted';

    const [result] = await db.query(
      `INSERT INTO documents
        (title, department, category, area, version, description, keywords, workflow_status, status, uploader_id, author_name, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title,
        department,
        normalizedCategory,
        area,
        version || 'v1.0',
        description || null,
        keywords || null,
        status,
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
        workflow_status: status,
        status
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
      where.push('COALESCE(NULLIF(d.status, \'\'), d.workflow_status) = ?');
      params.push(normalizeWorkflowStatus(status));
    }
    if (category) {
      where.push('UPPER(d.category) = ?');
      params.push(String(category).toUpperCase().trim());
    }
    if (department) {
      where.push('LOWER(d.department) = ?');
      params.push(String(department).toLowerCase().trim());
    }

    const normalizedSortBy = String(sortBy || 'date').toLowerCase();
    const normalizedSortOrder = String(sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const sortMap = {
      date: 'COALESCE(d.date_added, d.created_at)',
      status: 'COALESCE(NULLIF(d.status, \'\'), d.workflow_status)',
      department: 'COALESCE(d.department, fp.department, \'\')',
      version: 'd.version'
    };
    const orderByExpr = sortMap[normalizedSortBy] || sortMap.date;
    const orderSql = `${orderByExpr} ${normalizedSortOrder}, d.id DESC`;

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await db.query(
      `
      SELECT d.id,
             COALESCE(d.department, fp.department, '') AS department,
             d.title AS document_name,
             UPPER(COALESCE(d.category, '')) AS category,
             d.area,
             COALESCE(NULLIF(d.author_name, ''), CONCAT_WS(' ', u.firstName, u.lastName), '') AS author,
             COALESCE(NULLIF(d.status, ''), d.workflow_status) AS status,
             d.version,
             COALESCE(d.date_added, d.created_at) AS date_added,
             COALESCE(d.is_locked, 0) AS is_locked,
             d.created_at,
             d.updated_at,
             (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploader_id
      LEFT JOIN faculty_profiles fp ON fp.user_id = d.uploader_id
      ${whereSql}
      ORDER BY ${orderSql}
      LIMIT 200
      `,
      params
    );

    res.json(rows.map((row) => ({
      ...row,
      // Backward-compatible aliases for existing frontend code
      title: row.document_name,
      workflow_status: row.status,
      author_name: row.author
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/documents/recent-approved
router.get('/recent-approved', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    const normalizedRole = normalizeRole(req.user.role);
    const isEvaluator = normalizedRole === 'evaluator' || normalizedRole === 'external evaluator';
    const viewAll = canViewAll(req.user.role);
    const { department, limit = 20 } = req.query || {};

    const where = [`COALESCE(NULLIF(d.status, ''), d.workflow_status) = 'approved'`, 'd.approved_at IS NOT NULL'];
    const params = [];

    if (isEvaluator) {
      // evaluators can only see approved docs anyway; no extra constraint
    } else if (!viewAll) {
      where.push('d.uploader_id = ?');
      params.push(req.user.id);
    }

    if (department) {
      where.push('LOWER(d.department) = ?');
      params.push(String(department).toLowerCase().trim());
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const whereSql = `WHERE ${where.join(' AND ')}`;
    const [rows] = await db.query(
      `
      SELECT d.*,
             (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      ${whereSql}
      ORDER BY d.approved_at DESC, d.id DESC
      LIMIT ${safeLimit}
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
    await ensureDocumentsWorkflowSchema();
    const viewAll = canViewAll(req.user.role);
    const normalizedRole = normalizeRole(req.user.role);
    const isEvaluator = normalizedRole === 'evaluator' || normalizedRole === 'external evaluator';
    const { department } = req.query || {};

    const where = [];
    const params = [];

    if (isEvaluator) {
      where.push(`COALESCE(NULLIF(status, ''), workflow_status) = 'approved'`);
    } else if (!viewAll) {
      where.push('uploader_id = ?');
      params.push(req.user.id);
    }
    if (department) {
      where.push('LOWER(department) = ?');
      params.push(String(department).toLowerCase().trim());
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [summaryRows] = await db.query(
      `
      SELECT
        COUNT(*) AS total_documents,
        SUM(CASE WHEN COALESCE(NULLIF(status, ''), workflow_status) = 'approved' THEN 1 ELSE 0 END) AS approved_documents,
        SUM(CASE WHEN COALESCE(date_added, created_at) >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) AS documents_added_this_month
      FROM documents
      ${whereSql}
      `,
      params
    );
    const [statusRows] = await db.query(
      `
      SELECT COALESCE(NULLIF(status, ''), workflow_status) AS workflow_status, COUNT(*) AS count
      FROM documents
      ${whereSql}
      GROUP BY workflow_status
      `,
      params
    );

    const summary = summaryRows?.[0] || {};
    const total = Number(summary.total_documents || 0);
    const approved = Number(summary.approved_documents || 0);
    const approvalPercentage = total > 0 ? Number(((approved / total) * 100).toFixed(2)) : 0;

    res.json({
      total_documents: total,
      approved_documents: approved,
      approval_percentage: approvalPercentage,
      documents_added_this_month: Number(summary.documents_added_this_month || 0),
      by_status: statusRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/documents/approvals
router.get('/approvals', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view approvals' });
    }
    const [rows] = await db.query(
      `
      SELECT d.*,
             (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      WHERE COALESCE(NULLIF(d.status, ''), d.workflow_status) IN ('validated_coordinator') AND COALESCE(d.is_locked, 0) = 0
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

// GET /api/documents/review-queue
// Program Head: submitted
// QA Coordinator: validated_program_head
// Dean/Admin: validated_coordinator + approved + locked
router.get('/review-queue', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    const role = normalizeRole(req.user.role);
    const params = [];
    let statusWhere = '';

    if (isProgramHead(role)) {
      statusWhere = `COALESCE(NULLIF(d.status, ''), d.workflow_status) = 'submitted'`;
    } else if (isCoordinator(role)) {
      statusWhere = `COALESCE(NULLIF(d.status, ''), d.workflow_status) = 'validated_program_head'`;
    } else if (role === 'dean' || role === 'admin') {
      statusWhere = `COALESCE(NULLIF(d.status, ''), d.workflow_status) IN ('validated_coordinator','approved','locked')`;
    } else {
      return res.status(403).json({ msg: 'Not authorized to view review queue' });
    }

    const [rows] = await db.query(
      `
      SELECT d.id,
             COALESCE(d.department, fp.department, '') AS department,
             d.title AS document_name,
             UPPER(COALESCE(d.category, '')) AS category,
             d.area,
             COALESCE(NULLIF(d.author_name, ''), CONCAT_WS(' ', u.firstName, u.lastName), '') AS author,
             COALESCE(NULLIF(d.status, ''), d.workflow_status) AS status,
             d.version,
             COALESCE(d.date_added, d.created_at) AS date_added,
             COALESCE(d.is_locked, 0) AS is_locked,
             d.pdf_file_path,
             (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploader_id
      LEFT JOIN faculty_profiles fp ON fp.user_id = d.uploader_id
      WHERE ${statusWhere}
      ORDER BY COALESCE(d.date_added, d.created_at) DESC, d.id DESC
      LIMIT 300
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/documents/:id/validate-program-head
router.patch('/:id/validate-program-head', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    if (!isProgramHead(req.user.role)) {
      return res.status(403).json({ msg: 'Only Program Head can perform step 1 validation' });
    }
    const docId = Number(req.params.id);
    const [docs] = await db.query(
      'SELECT id, COALESCE(NULLIF(status, \'\'), workflow_status) AS current_status, COALESCE(is_locked, 0) AS is_locked FROM documents WHERE id = ? LIMIT 1',
      [docId]
    );
    if (!docs.length) return res.status(404).json({ msg: 'Document not found' });
    if (Number(docs[0].is_locked) === 1) return res.status(423).json({ msg: 'Document is locked' });
    if (docs[0].current_status !== 'submitted') {
      return res.status(400).json({ msg: 'Document must be in submitted state' });
    }
    await db.query('UPDATE documents SET status = ?, workflow_status = ? WHERE id = ?', ['validated_program_head', 'validated_program_head', docId]);
    res.json({ msg: 'Validated by Program Head', status: 'validated_program_head' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/documents/:id/validate-coordinator
router.patch('/:id/validate-coordinator', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    if (!isCoordinator(req.user.role)) {
      return res.status(403).json({ msg: 'Only QA Coordinator can perform step 2 validation' });
    }
    const docId = Number(req.params.id);
    const [docs] = await db.query(
      'SELECT id, COALESCE(NULLIF(status, \'\'), workflow_status) AS current_status, COALESCE(is_locked, 0) AS is_locked FROM documents WHERE id = ? LIMIT 1',
      [docId]
    );
    if (!docs.length) return res.status(404).json({ msg: 'Document not found' });
    if (Number(docs[0].is_locked) === 1) return res.status(423).json({ msg: 'Document is locked' });
    if (docs[0].current_status !== 'validated_program_head') {
      return res.status(400).json({ msg: 'Document must be validated by Program Head first' });
    }
    await db.query('UPDATE documents SET status = ?, workflow_status = ? WHERE id = ?', ['validated_coordinator', 'validated_coordinator', docId]);
    res.json({ msg: 'Validated by QA Coordinator', status: 'validated_coordinator' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/documents/:id/approve
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Only Dean/Admin can approve' });
    }
    const docId = Number(req.params.id);
    const [docs] = await db.query(
      'SELECT id, COALESCE(NULLIF(status, \'\'), workflow_status) AS current_status, COALESCE(is_locked, 0) AS is_locked FROM documents WHERE id = ? LIMIT 1',
      [docId]
    );
    if (!docs.length) return res.status(404).json({ msg: 'Document not found' });
    if (Number(docs[0].is_locked) === 1) return res.status(423).json({ msg: 'Document is locked' });
    if (docs[0].current_status !== 'validated_coordinator') {
      return res.status(400).json({ msg: 'Document must be validated by QA Coordinator first' });
    }
    await db.query(
      'UPDATE documents SET status = ?, workflow_status = ?, approved_at = NOW(), approved_by = ? WHERE id = ?',
      ['approved', 'approved', `${req.user.role}:${req.user.id}`, docId]
    );
    res.json({ msg: 'Approved', status: 'approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/documents/:id/status  body: { status }
router.put('/:id/status', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to update status' });
    }
    const docId = Number(req.params.id);
    const status = (req.body?.status || '').toString().toLowerCase().trim();
    const allowed = ['draft', 'pending', 'validated', 'approved', 'locked', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ msg: 'Invalid status' });

    const [docs] = await db.query('SELECT id, COALESCE(NULLIF(status, \'\'), workflow_status) AS workflow_status, COALESCE(is_locked, 0) AS is_locked FROM documents WHERE id = ? LIMIT 1', [docId]);
    if (!docs.length) return res.status(404).json({ msg: 'Document not found' });
    const doc = docs[0];
    if (Number(doc.is_locked) === 1 && status !== 'locked') {
      return res.status(423).json({ msg: 'Document is locked and cannot be modified' });
    }

    if (isDean(req.user.role)) {
      // Dean can only perform final approval and only after validation.
      if (status !== 'approved') {
        return res.status(403).json({ msg: 'Dean can only perform final approval' });
      }
      if (String(doc.workflow_status).toLowerCase() !== 'validated_coordinator') {
        return res.status(400).json({ msg: 'Document must be validated by coordinator before final approval' });
      }
    }

    if (status === 'approved') {
      await db.query('UPDATE documents SET workflow_status = ?, status = ?, approved_at = NOW(), approved_by = ? WHERE id = ?', [status, status, `${req.user.role}:${req.user.id}`, docId]);
    } else {
      await db.query('UPDATE documents SET workflow_status = ?, status = ? WHERE id = ?', [status, status, docId]);
    }
    res.json({ msg: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/documents/:id/lock  body: { is_locked: boolean }
router.patch('/:id/lock', auth, async (req, res) => {
  try {
    await ensureDocumentsWorkflowSchema();
    if (!canLock(req.user.role)) {
      return res.status(403).json({ msg: 'Only admin can lock/unlock documents' });
    }
    const docId = Number(req.params.id);
    const isLocked = Boolean(req.body?.is_locked);
    const [docs] = await db.query(
      `
      SELECT d.id,
             COALESCE(NULLIF(d.status, ''), d.workflow_status) AS current_status,
             (SELECT stored_name FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS stored_name
      FROM documents d
      WHERE d.id = ?
      LIMIT 1
      `,
      [docId]
    );
    if (!docs.length) return res.status(404).json({ msg: 'Document not found' });
    const doc = docs[0];

    if (isLocked && doc.current_status !== 'approved') {
      return res.status(400).json({ msg: 'Document must be approved before locking' });
    }

    let pdfPath = null;
    if (isLocked && doc.stored_name) {
      const sourceAbs = path.join(uploadRoot, doc.stored_name);
      const conversion = await convertDocumentToPdfIfPossible(sourceAbs);
      if (conversion.success && conversion.pdfAbsolutePath) {
        pdfPath = `/uploads/${path.basename(conversion.pdfAbsolutePath)}`;
      }
    }

    const [result] = await db.query(
      `
      UPDATE documents
      SET is_locked = ?,
          status = CASE WHEN ? = 1 THEN 'locked' ELSE status END,
          workflow_status = CASE WHEN ? = 1 THEN 'locked' ELSE workflow_status END,
          locked_at = CASE WHEN ? = 1 THEN NOW() ELSE NULL END,
          pdf_file_path = CASE WHEN ? = 1 THEN ? ELSE NULL END
      WHERE id = ?
      `,
      [isLocked ? 1 : 0, isLocked ? 1 : 0, isLocked ? 1 : 0, isLocked ? 1 : 0, isLocked ? 1 : 0, pdfPath, docId]
    );
    if (!result.affectedRows) return res.status(404).json({ msg: 'Document not found' });
    res.json({
      msg: isLocked ? 'Document locked' : 'Document unlocked',
      is_locked: isLocked,
      pdf_file_path: pdfPath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

