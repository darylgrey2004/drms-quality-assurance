const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
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

// POST /api/documents
router.post('/', async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      throw new ServiceError('Request body must be a JSON object', 400);
    }
    const document = await createDocument(req.body || {});
    res.status(201).json(document);
  } catch (error) {
    return sendError(res, error, 'Failed to create document');
  }
});

// GET /api/documents
router.get('/', async (_req, res) => {
  try {
    const docs = await listDocuments();
    return res.json(docs);
  } catch (error) {
    return sendError(res, error, 'Failed to list documents');
  }
});

// GET /api/documents/stats
router.get('/stats', async (_req, res) => {
  try {
    const rows = await listDocumentStats();
    return res.json(rows);
  } catch (error) {
    return sendError(res, error, 'Failed to get document stats');
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const document = await getDocumentById(req.params.id);
    if (!document) return res.status(404).json({ error: { message: 'Document not found' } });
    return res.json(document);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch document');
  }
});

// PUT /api/documents/:id
router.put('/:id', async (req, res) => {
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
router.patch('/:id/status', async (req, res) => {
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
router.post('/:id/files', (req, res) => {
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
router.get('/:id/files', async (req, res) => {
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

