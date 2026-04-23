const db = require('../db');

async function createDocument(record) {
  const [result] = await db.query(
    `INSERT INTO documents
      (title, category, area, version, description, keywords, workflow_status, uploader_id, author_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.title,
      record.category,
      record.area,
      record.version,
      record.description,
      record.keywords,
      record.workflow_status,
      record.uploader_id,
      record.author_name,
      record.created_at,
      record.updated_at
    ]
  );
  return result.insertId;
}

async function listDocuments() {
  const [rows] = await db.query(
    `SELECT id, title, category, area, version, description, keywords, workflow_status, uploader_id, author_name, created_at, updated_at
     FROM documents
     ORDER BY created_at DESC`
  );
  return rows;
}

async function getDocumentById(id) {
  const [rows] = await db.query(
    `SELECT id, title, category, area, version, description, keywords, workflow_status, uploader_id, author_name, created_at, updated_at
     FROM documents
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function updateDocumentMetadata(id, updates) {
  const fields = [];
  const values = [];

  Object.keys(updates).forEach((key) => {
    fields.push(`${key} = ?`);
    values.push(updates[key]);
  });
  if (fields.length === 0) return false;
  values.push(id);

  const [result] = await db.query(
    `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
}

async function updateWorkflowStatus(id, workflowStatus, updatedAt) {
  const [result] = await db.query(
    `UPDATE documents
     SET workflow_status = ?, updated_at = ?
     WHERE id = ?`,
    [workflowStatus, updatedAt, id]
  );
  return result.affectedRows > 0;
}

async function listDocumentStats() {
  const [rows] = await db.query(
    `SELECT workflow_status, COUNT(*) AS count
     FROM documents
     GROUP BY workflow_status`
  );
  return rows;
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocumentMetadata,
  updateWorkflowStatus,
  listDocumentStats
};
