const db = require('../db');

async function createFileRecord(record) {
  const [result] = await db.query(
    `INSERT INTO document_files
      (document_id, original_name, stored_name, mime_type, size_bytes, url_path, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      record.document_id,
      record.original_name,
      record.stored_name,
      record.mime_type,
      record.size_bytes,
      record.url_path,
      record.uploaded_at
    ]
  );
  return result.insertId;
}

async function listFilesByDocumentId(documentId) {
  const [rows] = await db.query(
    `SELECT id, document_id, original_name, stored_name, mime_type, size_bytes, url_path, uploaded_at
     FROM document_files
     WHERE document_id = ?
     ORDER BY uploaded_at DESC`,
    [documentId]
  );
  return rows;
}

module.exports = {
  createFileRecord,
  listFilesByDocumentId
};
