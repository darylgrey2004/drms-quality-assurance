const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../database');
const { auth } = require('../middleware/auth');
const {
  ALLOWED_WORKFLOW_STATUS,
  ServiceError,
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocumentMetadata,
  updateWorkflowStatus,
  addDocumentFile,
  listFilesByDocumentId,
  listDocumentStats
} = require('../services/documentService');

const router = express.Router();

const uploadRoot = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadRoot);
  },
  filename: function (_req, file, cb) {
    const safeOriginal = (file.originalname || 'file').replace(/[^\w.\-()+ ]+/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

function sendError(res, error, fallbackMessage) {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details
      }
    });
  }
  return res.status(500).json({
    error: {
      message: fallbackMessage || 'Internal server error'
    }
  });
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRole(role) {
  return String(role || '').toLowerCase().trim();
}

function canValidate(role) {
  return ['admin', 'dean', 'qa coordinator', 'area chair/program head'].includes(normalizeRole(role));
}

function canApprove(role) {
  return ['admin', 'dean', 'qa coordinator'].includes(normalizeRole(role));
}

function canSeeAllDocuments(role) {
  return ['admin', 'dean', 'qa coordinator', 'external evaluator', 'evaluator'].includes(normalizeRole(role));
}

// POST /api/documents
router.post('/', auth, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      throw new ServiceError('Request body must be a JSON object', 400);
    }
    const payload = { ...(req.body || {}) };
    if (!payload.uploader_id) payload.uploader_id = req.user.id;
    const document = await createDocument(payload);
    res.status(201).json(document);
  } catch (error) {
    return sendError(res, error, 'Failed to create document');
  }
});

// GET /api/documents
router.get('/', auth, async (req, res) => {
  try {
    const docs = await listDocuments();
    const role = normalizeRole(req.user?.role);
    const filteredDocs = canSeeAllDocuments(role)
      ? docs
      : docs.filter((doc) => Number(doc.uploader_id) === Number(req.user.id));
    return res.json(filteredDocs);
  } catch (error) {
    return sendError(res, error, 'Failed to list documents');
  }
});

// GET /api/documents/approvals
router.get('/approvals', auth, async (req, res) => {
  try {
    const role = normalizeRole(req.user?.role);
    if (!canValidate(role) && !canApprove(role)) {
      return res.status(403).json({ error: { message: 'Not authorized to view approvals queue' } });
    }
    const docs = await listDocuments();
    let queue = docs.filter((doc) => ['pending', 'validated'].includes(normalizeRole(doc.workflow_status)));

    if (role === 'area chair/program head') {
      queue = queue.filter((doc) => normalizeRole(doc.workflow_status) === 'pending');
    }

    return res.json(queue);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch approvals queue');
  }
});

// POST /api/documents/:id/validate
router.post('/:id/validate', auth, async (req, res) => {
  try {
    if (!canValidate(req.user?.role)) {
      return res.status(403).json({ error: { message: 'Not authorized to validate documents' } });
    }
    const updated = await updateWorkflowStatus(req.params.id, 'validated');
    if (!updated) return res.status(404).json({ error: { message: 'Document not found' } });
    return res.json(updated);
  } catch (error) {
    return sendError(res, error, 'Failed to validate document');
  }
});

// POST /api/documents/:id/approve
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (!canApprove(req.user?.role)) {
      return res.status(403).json({ error: { message: 'Not authorized to approve documents' } });
    }
    const updated = await updateWorkflowStatus(req.params.id, 'approved');
    if (!updated) return res.status(404).json({ error: { message: 'Document not found' } });
    return res.json(updated);
  } catch (error) {
    return sendError(res, error, 'Failed to approve document');
  }
});

// POST /api/documents/:id/reject
router.post('/:id/reject', auth, async (req, res) => {
  try {
    if (!canValidate(req.user?.role) && !canApprove(req.user?.role)) {
      return res.status(403).json({ error: { message: 'Not authorized to reject documents' } });
    }
    const updated = await updateWorkflowStatus(req.params.id, 'rejected');
    if (!updated) return res.status(404).json({ error: { message: 'Document not found' } });
    const reason = String(req.body?.reason || '').trim();
    if (reason) {
      await db.query(
        `CREATE TABLE IF NOT EXISTS document_approval_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          document_id INT NOT NULL,
          reviewer_id INT NOT NULL,
          action VARCHAR(50) NOT NULL,
          reason TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      );
      await db.query(
        'INSERT INTO document_approval_logs (document_id, reviewer_id, action, reason) VALUES (?, ?, ?, ?)',
        [req.params.id, req.user.id, 'rejected', reason]
      );
    }
    return res.json(updated);
  } catch (error) {
    return sendError(res, error, 'Failed to reject document');
  }
});

router.get('/approval-logs/:id', auth, async (req, res) => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS document_approval_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    const [rows] = await db.query(
      `SELECT l.*, u.firstName, u.lastName, u.role
       FROM document_approval_logs l
       LEFT JOIN users u ON u.id = l.reviewer_id
       WHERE l.document_id = ?
       ORDER BY l.created_at DESC`,
      [req.params.id]
    );
    return res.json(rows);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch approval logs');
  }
});

router.get('/stats', auth, async (_req, res) => {
  try {
    const rows = await listDocumentStats();
    return res.json(rows);
  } catch (error) {
    return sendError(res, error, 'Failed to get document stats');
  }
});

// GET /api/documents/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await getDocumentById(req.params.id);
    if (!document) return res.status(404).json({ error: { message: 'Document not found' } });
    return res.json(document);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch document');
  }
});

// PUT /api/documents/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      throw new ServiceError('Request body must be a JSON object', 400);
    }
    const updated = await updateDocumentMetadata(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: { message: 'Document not found' } });
    return res.json(updated);
  } catch (error) {
    return sendError(res, error, 'Failed to update document metadata');
  }
});

// PATCH /api/documents/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      throw new ServiceError('Request body must be a JSON object', 400);
    }
    const status = req.body?.workflow_status;
    if (typeof status !== 'string' || !ALLOWED_WORKFLOW_STATUS.includes(String(status).toLowerCase().trim())) {
      throw new ServiceError(`workflow_status must be one of: ${ALLOWED_WORKFLOW_STATUS.join(', ')}`, 400, {
        field: 'workflow_status'
      });
    }
    const updated = await updateWorkflowStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: { message: 'Document not found' } });
    return res.json(updated);
  } catch (error) {
    return sendError(res, error, 'Failed to update workflow status');
  }
});

// POST /api/documents/:id/files
router.post('/:id/files', auth, (req, res) => {
  upload.single('file')(req, res, (uploadError) => {
    (async () => {
      try {
      if (uploadError) {
        if (uploadError instanceof multer.MulterError) {
          throw new ServiceError(uploadError.message, 400);
        }
        throw uploadError;
      }
      if (!req.file) throw new ServiceError('File is required under field name "file"', 400, { field: 'file' });

      const fileRecord = await addDocumentFile(req.params.id, {
        original_name: req.file.originalname,
        stored_name: req.file.filename,
        mime_type: req.file.mimetype,
        size_bytes: req.file.size,
        url_path: `/files/${req.file.filename}`
      });

      if (!fileRecord) return res.status(404).json({ error: { message: 'Document not found' } });
      return res.status(201).json(fileRecord);
      } catch (error) {
        return sendError(res, error, 'Failed to upload file');
      }
    })();
  });
});

// GET /api/documents/:id/files
router.get('/:id/files', auth, async (req, res) => {
  try {
    const doc = await getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ error: { message: 'Document not found' } });
    const files = await listFilesByDocumentId(req.params.id);
    return res.json(files);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch document files');
  }
});

module.exports = router;

