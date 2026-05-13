const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth } = require('../middleware/auth');

function normalizeRole(role) {
  return (role || '').toString().toLowerCase().trim();
}

function canApprove(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean' || r === 'area-chair' || r === 'department-head';
}

function canFinalApprove(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean';
}

// Resolves the department_id for an area-chair. Returns null if not found.
// STANDARDIZED: Uses exact matching only (name or code), no fuzzy matching
async function getAreaChairDeptId(userId) {
  try {
    // Try faculty_profiles first - get department string
    const [profile] = await db.query(
      'SELECT department FROM faculty_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    
    if (profile.length && profile[0].department) {
      const deptValue = profile[0].department.trim();
      
      // STANDARDIZED: Exact match only on name or code (case-insensitive)
      const [dept] = await db.query(
        'SELECT id FROM departments WHERE LOWER(name) = LOWER(?) OR UPPER(code) = UPPER(?) LIMIT 1',
        [deptValue, deptValue]
      );
      
      if (dept.length) {
        console.log(`Department resolved: ${deptValue} -> ID ${dept[0].id}`);
        return dept[0].id;
      }
      
      console.warn(`Department not found in departments table: "${deptValue}" for user ${userId}`);
    }
    
    // Fallback: look up department_id directly from the user's uploaded documents
    const [docDept] = await db.query(
      'SELECT department_id FROM documents WHERE uploader_id = ? AND department_id IS NOT NULL LIMIT 1',
      [userId]
    );
    
    if (docDept.length) {
      console.log(`Department resolved from user's documents: user ${userId} -> dept_id ${docDept[0].department_id}`);
      return docDept[0].department_id;
    }
    
    console.warn(`No department found for user ${userId}`);
    return null;
  } catch (err) {
    console.error('getAreaChairDeptId error:', err.message);
    return null;
  }
}

// @route   GET /api/approvals/pending
// @desc    Get all documents for approval management
// @access  Private (Admin, Dean, Area-Chair)
router.get('/pending', auth, async (req, res) => {
  try {
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view approvals' });
    }

    const normalizedRole = normalizeRole(req.user.role);
    const isAreaChair = normalizedRole === 'area-chair' || normalizedRole === 'department-head';
    const isAdmin = normalizedRole === 'admin';
    const isDean = normalizedRole === 'dean';

    let whereSql = "WHERE d.workflow_status IN ('draft', 'pending', 'validated', 'approved', 'locked', 'rejected')";
    const params = [];

    // Area-chair/Dept. Head sees documents from their department OR their own uploads
    if (isAreaChair) {
      const deptId = await getAreaChairDeptId(req.user.id);
      if (deptId) {
        // Show all documents from their department (not just own uploads)
        whereSql += " AND d.department_id = ?";
        params.push(deptId);
      } else {
        // no dept profile — show only own uploads
        whereSql += " AND d.uploader_id = ?";
        params.push(req.user.id);
      }
    }

    const [rows] = await db.query(
      `
      SELECT 
        d.id,
        d.title,
        d.category,
        d.category_name,
        d.department_code,
        d.version,
        d.workflow_status,
        d.created_at,
        d.updated_at,
        d.category_id,
        CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, '')) AS author_name,
        dept.name AS department_name,
        c.display_name AS category_display_name,
        (SELECT url_path FROM document_files df WHERE df.document_id = d.id ORDER BY df.id ASC LIMIT 1) AS file_url
      FROM documents d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN categories c ON d.category_id = c.id
      ${whereSql}
      ORDER BY 
        CASE d.workflow_status
          WHEN 'pending' THEN 1
          WHEN 'validated' THEN 2
          WHEN 'approved' THEN 3
          WHEN 'draft' THEN 4
          WHEN 'locked' THEN 5
          WHEN 'rejected' THEN 6
        END,
        d.created_at DESC
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
    console.error('Get pending approvals error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/approvals/stats
// @desc    Get approval statistics (scoped to dept for area-chair)
// @access  Private (Admin, Dean, Area-Chair)
router.get('/stats', auth, async (req, res) => {
  try {
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view approval stats' });
    }

    const normalizedRole = normalizeRole(req.user.role);
    let whereClause = '';
    const params = [];

    if (normalizedRole === 'area-chair' || normalizedRole === 'department-head') {
      const deptId = await getAreaChairDeptId(req.user.id);
      if (deptId) {
        whereClause = 'WHERE (department_id = ? OR uploader_id = ?)';
        params.push(deptId, req.user.id);
      } else {
        whereClause = 'WHERE uploader_id = ?';
        params.push(req.user.id);
      }
    }

    const [stats] = await db.query(
      `SELECT 
        SUM(CASE WHEN workflow_status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN workflow_status = 'validated' THEN 1 ELSE 0 END) AS validated,
        SUM(CASE WHEN workflow_status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN workflow_status = 'locked' THEN 1 ELSE 0 END) AS locked,
        SUM(CASE WHEN workflow_status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN (workflow_status = 'approved' OR workflow_status = 'locked')
          AND MONTH(updated_at) = MONTH(CURRENT_DATE())
          AND YEAR(updated_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) AS approved_month,
        AVG(CASE WHEN workflow_status IN ('approved','locked','rejected')
          THEN TIMESTAMPDIFF(HOUR, created_at, updated_at) END) AS avg_hours
      FROM documents ${whereClause}`,
      params
    );

    const row = stats[0] || {};
    const avgHours = parseFloat(row.avg_hours) || 0;
    const avgDays = avgHours > 0 ? (avgHours / 24).toFixed(1) : '0';

    res.json({
      pending: row.pending || 0,
      validated: row.validated || 0,
      approved: row.approved || 0,
      locked: row.locked || 0,
      rejected: row.rejected || 0,
      approved_month: row.approved_month || 0,
      avg_days: avgDays
    });
  } catch (err) {
    console.error('Get approval stats error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/approvals/:documentId/approve
// @desc    Approve a document
// @access  Private (Admin, Dean only)
router.post('/:documentId/approve', auth, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (!canFinalApprove(role)) {
      return res.status(403).json({ msg: 'Not authorized to approve documents. Only Admin and Dean can approve.' });
    }

    const documentId = parseInt(req.params.documentId);
    const { comments } = req.body;

    console.log('Approve request for document:', documentId);

    // Check if document exists
    const [docs] = await db.query(
      'SELECT id, workflow_status, title FROM documents WHERE id = ?',
      [documentId]
    );

    if (docs.length === 0) {
      console.log('Document not found:', documentId);
      return res.status(404).json({ msg: 'Document not found' });
    }

    console.log('Current document status:', docs[0].workflow_status);

    if (docs[0].workflow_status !== 'validated') {
      return res.status(400).json({ msg: 'Document must be validated before approval', currentStatus: docs[0].workflow_status });
    }

    // Update document status to approved
    const [result] = await db.query(
      'UPDATE documents SET workflow_status = ?, updated_at = NOW() WHERE id = ?',
      ['approved', documentId]
    );

    console.log('Update result:', result);

    // Create approval workflow record
    try {
      await db.query(
        `INSERT INTO approval_workflow (document_id, stage, status, action_by, comments, completed_at)
         VALUES (?, 'approval', 'completed', ?, ?, NOW())`,
        [documentId, req.user.id, comments || null]
      );
    } catch (workflowErr) {
      console.log('Workflow log skipped:', workflowErr.message);
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_APPROVED', 'document', ?, ?, ?, ?)`,
        [req.user.id, documentId, JSON.stringify({ workflow_status: 'approved', comments }), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) { console.log('Audit log skipped:', auditErr.message); }

    console.log('Document approved successfully');
    res.json({ msg: 'Document approved successfully', document: { id: documentId, title: docs[0].title, workflow_status: 'approved' } });
  } catch (err) {
    console.error('Approve document error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST /api/approvals/:documentId/reject
// @desc    Reject a document
// @access  Private (Admin, Dean, Area-Chair)
router.post('/:documentId/reject', auth, async (req, res) => {
  try {
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to reject documents' });
    }

    const documentId = parseInt(req.params.documentId);
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ msg: 'Rejection reason is required' });
    }

    const [docs] = await db.query(
      'SELECT id, workflow_status, title, department_id, uploader_id FROM documents WHERE id = ?',
      [documentId]
    );

    if (docs.length === 0) return res.status(404).json({ msg: 'Document not found' });

    // Area-chair/Dept. Head can only reject their department's documents or own uploads
    if (normalizeRole(req.user.role) === 'area-chair' || normalizeRole(req.user.role) === 'department-head') {
      const deptId = await getAreaChairDeptId(req.user.id);
      const isOwnUpload = docs[0].uploader_id == req.user.id;
      const isInDept = deptId && docs[0].department_id == deptId;
      if (!isOwnUpload && !isInDept) {
        return res.status(403).json({ msg: 'Not authorized to reject documents outside your department' });
      }
    }

    // Update document status to rejected
    await db.query(
      'UPDATE documents SET workflow_status = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', documentId]
    );

    // Create approval workflow record
    try {
      await db.query(
        `INSERT INTO approval_workflow (document_id, stage, status, action_by, comments, completed_at)
         VALUES (?, 'rejection', 'completed', ?, ?, NOW())`,
        [documentId, req.user.id, reason]
      );
    } catch (workflowErr) {
      console.log('Workflow log skipped:', workflowErr.message);
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_REJECTED', 'document', ?, ?, ?, ?)`,
        [req.user.id, documentId, JSON.stringify({ workflow_status: 'rejected', reason }), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) { console.log('Audit log skipped:', auditErr.message); }

    res.json({ msg: 'Document rejected successfully', document: { id: documentId, title: docs[0].title } });
  } catch (err) {
    console.error('Reject document error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/approvals/:documentId/validate
// @desc    Validate a document (move from pending to validated)
// @access  Private (Admin only - Department Heads use separate endpoint)
router.post('/:documentId/validate', auth, async (req, res) => {
  try {
    // RULE: Only Admin can use this validation endpoint
    // Department Heads should use their own workflow
    const role = normalizeRole(req.user.role);
    if (role !== 'admin') {
      return res.status(403).json({ msg: 'Only Administrator can validate documents through this endpoint' });
    }

    const documentId = parseInt(req.params.documentId);

    const [docs] = await db.query(
      'SELECT id, workflow_status, title, department_id, uploader_id FROM documents WHERE id = ?',
      [documentId]
    );

    if (docs.length === 0) return res.status(404).json({ msg: 'Document not found' });
    const doc = docs[0];

    if (doc.workflow_status !== 'pending' && doc.workflow_status !== 'draft') {
      return res.status(400).json({ msg: 'Only pending or draft documents can be validated', currentStatus: doc.workflow_status });
    }

    await db.query(
      'UPDATE documents SET workflow_status = ?, updated_at = NOW() WHERE id = ?',
      ['validated', documentId]
    );

    try {
      await db.query(
        `INSERT INTO approval_workflow (document_id, stage, status, action_by, comments, completed_at)
         VALUES (?, 'validation', 'completed', ?, NULL, NOW())`,
        [documentId, req.user.id]
      );
    } catch (e) { console.log('Workflow log skipped:', e.message); }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_VALIDATED', 'document', ?, ?, ?, ?)`,
        [req.user.id, documentId, JSON.stringify({ workflow_status: 'validated' }), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (e) { console.log('Audit log skipped:', e.message); }

    res.json({ msg: 'Document validated successfully', document: { id: documentId, title: doc.title, workflow_status: 'validated' } });
  } catch (err) {
    console.error('Validate document error:', err.message, err.stack);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   POST /api/approvals/:documentId/lock
// @desc    Lock a document (final stage) - ADMIN ONLY
// @access  Private (Admin only)
router.post('/:documentId/lock', auth, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    // RULE: Only Admin can lock documents
    if (role !== 'admin') {
      return res.status(403).json({ msg: 'Only Administrator can lock documents' });
    }

    const documentId = parseInt(req.params.documentId);
    const { comments } = req.body;

    const [docs] = await db.query(
      'SELECT id, workflow_status, title, department_id, uploader_id FROM documents WHERE id = ?',
      [documentId]
    );

    if (docs.length === 0) return res.status(404).json({ msg: 'Document not found' });

    // RULE: Only approved documents can be locked
    if (docs[0].workflow_status !== 'approved') {
      return res.status(400).json({ msg: 'Only approved documents can be locked', currentStatus: docs[0].workflow_status });
    }

    // Update document status to locked
    await db.query(
      'UPDATE documents SET workflow_status = ?, updated_at = NOW() WHERE id = ?',
      ['locked', documentId]
    );

    // Create workflow record
    try {
      await db.query(
        `INSERT INTO approval_workflow (document_id, stage, status, action_by, comments, completed_at)
         VALUES (?, 'lock', 'completed', ?, ?, NOW())`,
        [documentId, req.user.id, comments || null]
      );
    } catch (workflowErr) {
      console.log('Workflow log skipped:', workflowErr.message);
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_LOCKED', 'document', ?, ?, ?, ?)`,
        [req.user.id, documentId, JSON.stringify({ workflow_status: 'locked', comments }), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) { console.log('Audit log skipped:', auditErr.message); }

    res.json({ msg: 'Document locked successfully', document: { id: documentId, title: docs[0].title } });
  } catch (err) {
    console.error('Lock document error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/approvals/:documentId/unlock
// @desc    Unlock a document
// @access  Private (Admin only)
router.post('/:documentId/unlock', auth, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (role !== 'admin') {
      return res.status(403).json({ msg: 'Only admins can unlock documents' });
    }

    const documentId = parseInt(req.params.documentId);
    const { comments } = req.body;

    // Check if document exists and is locked
    const [docs] = await db.query(
      'SELECT id, workflow_status, title FROM documents WHERE id = ?',
      [documentId]
    );

    if (docs.length === 0) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    if (docs[0].workflow_status !== 'locked') {
      return res.status(400).json({ msg: 'Only locked documents can be unlocked' });
    }

    // Update document status back to approved
    await db.query(
      'UPDATE documents SET workflow_status = ?, updated_at = NOW() WHERE id = ?',
      ['approved', documentId]
    );

    // Create workflow record
    try {
      await db.query(
        `INSERT INTO approval_workflow (document_id, stage, status, action_by, comments, completed_at)
         VALUES (?, 'unlock', 'completed', ?, ?, NOW())`,
        [documentId, req.user.id, comments || null]
      );
    } catch (workflowErr) {
      console.log('Workflow log skipped:', workflowErr.message);
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'Unknown';
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         VALUES (?, 'DOCUMENT_UNLOCKED', 'document', ?, ?, ?, ?)`,
        [req.user.id, documentId, JSON.stringify({ workflow_status: 'approved', comments }), ip, req.headers['user-agent'] || 'Unknown']
      );
    } catch (auditErr) { console.log('Audit log skipped:', auditErr.message); }

    res.json({ msg: 'Document unlocked successfully', document: { id: documentId, title: docs[0].title } });
  } catch (err) {
    console.error('Unlock document error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
