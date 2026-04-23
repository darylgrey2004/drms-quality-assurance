const db = require('../db');
const documentRepository = require('../repositories/documentRepository');
const fileRepository = require('../repositories/fileRepository');

const ALLOWED_WORKFLOW_STATUS = ['draft', 'pending', 'validated', 'approved', 'locked', 'rejected'];
const WORKFLOW_TRANSITIONS = {
  draft: ['pending'],
  pending: ['validated', 'rejected'],
  validated: ['approved', 'rejected'],
  approved: ['locked'],
  locked: [],
  rejected: ['draft']
};

class ServiceError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode || 400;
    this.details = details || null;
  }
}

function normalizeWorkflowStatus(status) {
  const value = String(status || '').toLowerCase().trim();
  return value || 'draft';
}

function nowTimestamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function parseTimestamp(value, fieldName) {
  if (value == null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ServiceError(`Invalid ${fieldName} timestamp`, 400, { field: fieldName });
  }
  return parsed.toISOString();
}

function asNonEmptyString(value, fieldName) {
  if (typeof value !== 'string') {
    throw new ServiceError(`${fieldName} must be a string`, 400, { field: fieldName });
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ServiceError(`${fieldName} is required`, 400, { field: fieldName });
  }
  return trimmed;
}

function asNullableString(value, fieldName) {
  if (value == null) return null;
  if (typeof value !== 'string') {
    throw new ServiceError(`${fieldName} must be a string`, 400, { field: fieldName });
  }
  return value;
}

function assertWorkflowStatus(status) {
  const normalized = normalizeWorkflowStatus(status);
  if (!ALLOWED_WORKFLOW_STATUS.includes(normalized)) {
    throw new ServiceError('Invalid workflow_status', 400, { field: 'workflow_status' });
  }
  return normalized;
}

function findUserById(userId) {
  return db
    .query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
    .then(([rows]) => rows[0] || null);
}

async function createDocument(payload) {
  const title = asNonEmptyString(payload.title, 'title');
  const category = asNonEmptyString(payload.category, 'category');
  const area = asNonEmptyString(payload.area, 'area');
  const uploaderId = asNonEmptyString(payload.uploader_id, 'uploader_id');
  const uploader = await findUserById(uploaderId);

  if (!uploader) {
    throw new ServiceError('Invalid uploader_id', 400, { field: 'uploader_id' });
  }

  const workflowStatus = assertWorkflowStatus(payload.workflow_status || 'draft');
  const createdAt = parseTimestamp(payload.created_at, 'created_at') || nowTimestamp();
  const updatedAt = parseTimestamp(payload.updated_at, 'updated_at') || createdAt;

  const record = {
    title,
    category,
    area,
    version: payload.version ? asNonEmptyString(payload.version, 'version') : 'v1.0',
    description: asNullableString(payload.description, 'description'),
    keywords: asNullableString(payload.keywords, 'keywords'),
    workflow_status: workflowStatus,
    uploader_id: uploaderId,
    author_name: asNullableString(payload.author_name, 'author_name'),
    created_at: createdAt,
    updated_at: updatedAt
  };

  const id = await documentRepository.createDocument(record);
  return documentRepository.getDocumentById(id);
}

async function listDocuments() {
  return documentRepository.listDocuments();
}

async function getDocumentById(id) {
  return documentRepository.getDocumentById(id);
}

async function updateDocumentMetadata(id, payload) {
  const doc = await getDocumentById(id);
  if (!doc) return null;

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'title')) updates.title = asNonEmptyString(payload.title, 'title');
  if (Object.prototype.hasOwnProperty.call(payload, 'category')) updates.category = asNonEmptyString(payload.category, 'category');
  if (Object.prototype.hasOwnProperty.call(payload, 'area')) updates.area = asNonEmptyString(payload.area, 'area');
  if (Object.prototype.hasOwnProperty.call(payload, 'version')) updates.version = asNonEmptyString(payload.version, 'version');
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) updates.description = asNullableString(payload.description, 'description');
  if (Object.prototype.hasOwnProperty.call(payload, 'keywords')) updates.keywords = asNullableString(payload.keywords, 'keywords');
  if (Object.prototype.hasOwnProperty.call(payload, 'author_name')) updates.author_name = asNullableString(payload.author_name, 'author_name');
  if (Object.prototype.hasOwnProperty.call(payload, 'uploader_id')) {
    const uploaderId = asNonEmptyString(payload.uploader_id, 'uploader_id');
    const uploader = await findUserById(uploaderId);
    if (!uploader) {
      throw new ServiceError('Invalid uploader_id', 400, { field: 'uploader_id' });
    }
    updates.uploader_id = uploaderId;
  }

  if (Object.keys(updates).length === 0) {
    throw new ServiceError('No valid metadata fields provided for update', 400);
  }

  updates.updated_at = nowTimestamp();
  await documentRepository.updateDocumentMetadata(id, updates);
  return documentRepository.getDocumentById(id);
}

async function updateWorkflowStatus(id, status) {
  const doc = await getDocumentById(id);
  if (!doc) return null;

  const nextStatus = assertWorkflowStatus(status);
  const allowedNext = WORKFLOW_TRANSITIONS[doc.workflow_status] || [];
  if (!allowedNext.includes(nextStatus)) {
    throw new ServiceError(
      `Invalid workflow transition from ${doc.workflow_status} to ${nextStatus}`,
      409,
      { current: doc.workflow_status, requested: nextStatus, allowed: allowedNext }
    );
  }

  await documentRepository.updateWorkflowStatus(id, nextStatus, nowTimestamp());
  return documentRepository.getDocumentById(id);
}

async function addDocumentFile(documentId, fileMeta) {
  const doc = await getDocumentById(documentId);
  if (!doc) return null;

  const record = {
    document_id: Number(doc.id),
    original_name: asNonEmptyString(fileMeta.original_name, 'original_name'),
    stored_name: asNonEmptyString(fileMeta.stored_name, 'stored_name'),
    mime_type: asNullableString(fileMeta.mime_type, 'mime_type'),
    size_bytes: Number(fileMeta.size_bytes) || 0,
    url_path: asNonEmptyString(fileMeta.url_path, 'url_path'),
    uploaded_at: nowTimestamp()
  };

  const fileId = await fileRepository.createFileRecord(record);
  await documentRepository.updateDocumentMetadata(doc.id, { updated_at: nowTimestamp() });
  const files = await fileRepository.listFilesByDocumentId(doc.id);
  return files.find((f) => f.id === fileId) || null;
}

async function listFilesByDocumentId(documentId) {
  return fileRepository.listFilesByDocumentId(documentId);
}

async function listDocumentStats() {
  return documentRepository.listDocumentStats();
}

module.exports = {
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
};
