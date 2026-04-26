ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS department VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS date_added TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pdf_file_path VARCHAR(255) NULL;

UPDATE documents
SET status = CASE
  WHEN workflow_status = 'approved' THEN 'approved'
  WHEN workflow_status = 'locked' THEN 'locked'
  WHEN workflow_status = 'rejected' THEN 'rejected'
  WHEN workflow_status = 'validated' THEN 'validated_coordinator'
  ELSE 'submitted'
END
WHERE status IS NULL OR status = '';
