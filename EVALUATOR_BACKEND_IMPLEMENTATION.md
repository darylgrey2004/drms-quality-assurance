# External Evaluator Backend Implementation Guide

## Overview
This document outlines the backend support added for External Evaluator role users to properly fetch real-time data from the database instead of using hardcoded values.

---

## Database Schema Support

### Users Table
- **Role**: `evaluator` (ENUM value in users.role column)
- **Status**: Must be `approved` for access
- **isVerified**: Must be `1` (true)

### Evaluator Access Limits Table
```sql
CREATE TABLE `evaluator_access_limits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `evaluator_access_limits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

### Documents Table
- **workflow_status**: Evaluators can ONLY view documents with status = `'approved'`
- **category_id**: Links to categories table (Instruction, Research, Extension, Employment)
- **department_id**: Links to departments table (BEED, BSED, BSNED, BCAED, BPED)

---

## Backend API Endpoints

### 1. GET /api/documents
**Purpose**: Fetch documents with automatic role-based filtering

**Access**: Private (All authenticated users)

**Evaluator Behavior**:
- Backend automatically filters to show ONLY `approved` documents
- No need for client-side filtering
- Returns documents with full metadata

**Response Example**:
```json
[
  {
    "id": 18,
    "title": "Capstone Manuscript",
    "category": "research",
    "category_id": 2,
    "department_code": "BSED",
    "department_id": 2,
    "workflow_status": "approved",
    "version": "v1.0",
    "author_name": "Dr. Santos",
    "created_at": "2026-04-29T19:07:50.000Z",
    "file_url": "/uploads/1777489670219-617794012-document.pdf",
    "category_display_name": "Research",
    "department_name": "Bachelor of Secondary Education"
  }
]
```

**Backend Code** (node/routes/documents.js):
```javascript
// Line 172-174: Evaluator role check
const isEvaluator = normalizedRole === 'evaluator';

// Evaluators can only see approved documents
if (isEvaluator) {
  where.push('d.workflow_status = ?');
  params.push('approved');
}
```

---

### 2. GET /api/documents/stats/dashboard
**Purpose**: Fetch real-time dashboard statistics for evaluator

**Access**: Private (All authenticated users)

**Evaluator Behavior**:
- Returns statistics for ONLY `approved` documents
- Includes category breakdown, status counts, department counts
- Provides recent documents list

**Response Example**:
```json
{
  "total": 847,
  "categories": [
    {
      "name": "instruction",
      "display_name": "Instruction",
      "count": 245,
      "percentage": 28.9
    },
    {
      "name": "research",
      "display_name": "Research",
      "count": 312,
      "percentage": 36.8
    },
    {
      "name": "extension",
      "display_name": "Extension",
      "count": 156,
      "percentage": 18.4
    },
    {
      "name": "employment",
      "display_name": "Employment",
      "count": 134,
      "percentage": 15.8
    }
  ],
  "statuses": [
    {
      "status": "approved",
      "count": 692
    },
    {
      "status": "pending",
      "count": 38
    }
  ],
  "departments": [
    {
      "code": "BEED",
      "name": "Bachelor of Elementary Education",
      "count": 180
    },
    {
      "code": "BSED",
      "name": "Bachelor of Secondary Education",
      "count": 220
    }
  ],
  "recentDocuments": [
    {
      "id": 32,
      "title": "Faculty File Created by Admin",
      "category": "instruction",
      "department": "BEED",
      "status": "approved",
      "version": "v1.0",
      "author_name": "Jelmar Kemba",
      "created_at": "2026-04-30T21:09:44.000Z",
      "file_url": "/uploads/1777583384693-522216522-k.pdf"
    }
  ]
}
```

**Backend Implementation** (node/routes/documents.js):
```javascript
router.get('/stats/dashboard', auth, async (req, res) => {
  const normalizedRole = normalizeRole(req.user.role);
  const isEvaluator = normalizedRole === 'evaluator';
  
  // Evaluators can only see approved documents stats
  const statusFilter = isEvaluator ? "WHERE d.workflow_status = 'approved'" : '';
  
  // Query total, categories, statuses, departments, recent docs
  // All filtered by approved status for evaluators
});
```

---

### 3. GET /api/documents/categories
**Purpose**: Get all active categories

**Access**: Private (All authenticated users)

**Response Example**:
```json
[
  {
    "id": 1,
    "name": "instruction",
    "display_name": "Instruction",
    "description": "Teaching and learning materials, syllabi, curriculum documents",
    "sort_order": 1,
    "is_active": 1
  },
  {
    "id": 2,
    "name": "research",
    "display_name": "Research",
    "description": "Research publications, papers, studies, and outputs",
    "sort_order": 2,
    "is_active": 1
  }
]
```

---

### 4. GET /api/documents/departments
**Purpose**: Get all active departments

**Access**: Private (All authenticated users)

**Response Example**:
```json
[
  {
    "id": 1,
    "code": "BEED",
    "name": "Bachelor of Elementary Education",
    "description": "Elementary Education Department",
    "is_active": 1
  },
  {
    "id": 2,
    "code": "BSED",
    "name": "Bachelor of Secondary Education",
    "description": "Secondary Education Department",
    "is_active": 1
  }
]
```

---

### 5. GET /api/documents/:id
**Purpose**: Get single document with all files

**Access**: Private (All authenticated users)

**Evaluator Behavior**:
- Can ONLY view documents with `workflow_status = 'approved'`
- Returns 403 Forbidden if document is not approved

**Backend Code** (node/routes/documents.js):
```javascript
// Line 348-350: Evaluator permission check
if (isEvaluator && document.workflow_status !== 'approved') {
  return res.status(403).json({ msg: 'Evaluators can only view approved documents' });
}
```

---

## Frontend Implementation

### evaluator-dashboard.js
**Changes Made**:
1. Added `loadDashboardStats()` function to fetch real-time statistics
2. Updates all stat cards with live data from API
3. Replaces hardcoded values (847, 245, 312, etc.) with database values

**Key Functions**:
```javascript
async function loadDashboardStats() {
  const response = await fetch('http://127.0.0.1:3000/api/documents/stats/dashboard', {
    headers: { 'x-auth-token': token }
  });
  const stats = await response.json();
  
  // Update total documents
  // Update category stats (Instruction, Research, Extension, Employment)
  // Update status stats (Approved, Pending)
  // Update department count
}
```

### evaluator-documents.js
**Changes Made**:
1. Removed client-side filtering for approved documents
2. Backend automatically returns only approved documents for evaluator role
3. Added console logging to verify all documents are approved

**Key Changes**:
```javascript
// Before: Client-side filtering
const approvedDocs = documents.filter(doc => doc.status === 'approved');

// After: Backend handles filtering
const documents = await response.json();
// All documents are already approved for evaluator role
```

---

## Testing Guide

### 1. Create Evaluator User
```sql
-- Insert evaluator user
INSERT INTO users (email, password, firstName, lastName, role, status, isVerified)
VALUES ('evaluator@wmsu.edu.ph', '$2b$10$hashedpassword', 'Emma', 'Villanueva', 'evaluator', 'approved', 1);

-- Add access limit (optional)
INSERT INTO evaluator_access_limits (user_id, expiresAt)
VALUES (LAST_INSERT_ID(), DATE_ADD(NOW(), INTERVAL 30 DAY));
```

### 2. Test Dashboard Statistics
1. Login as evaluator user
2. Navigate to `evaluator-dashboard.html`
3. Open browser console (F12)
4. Verify console logs:
   - "Fetching dashboard statistics..."
   - "Dashboard stats fetched: {total: X, categories: [...], ...}"
5. Check that stat cards show real database values

### 3. Test Documents Page
1. Navigate to `evaluator-documents.html`
2. Open browser console
3. Verify console logs:
   - "Fetching documents for evaluator..."
   - "Documents fetched: X"
   - "All documents are approved (evaluator role): true"
4. Verify table shows only approved documents
5. Test filters (category, department, status)

### 4. Test Document Viewing
1. Click "View" button on any document
2. Verify modal opens with document details
3. Test PDF preview (if PDF file)
4. Test download button

### 5. Verify Role Restrictions
1. Try to access non-approved document directly via URL
2. Should return 403 Forbidden error
3. Verify evaluator cannot see pending/draft/rejected documents

---

## Console Logging for Debugging

### evaluator-dashboard.js
```
Fetching dashboard statistics...
Dashboard stats fetched: {total: 5, categories: Array(4), statuses: Array(2), ...}
```

### evaluator-documents.js
```
Evaluator Documents JS loaded
Fetching documents for evaluator...
Documents fetched: 5
All documents are approved (evaluator role): true
```

### Backend (node/routes/documents.js)
```
GET /api/documents - Evaluator role detected, filtering to approved only
GET /api/documents/stats/dashboard - Evaluator stats request
```

---

## Security Considerations

1. **Role-Based Access Control**: Backend enforces evaluator can ONLY see approved documents
2. **Token Authentication**: All API requests require valid JWT token
3. **Database-Level Filtering**: SQL queries include WHERE clause for approved status
4. **No Client-Side Bypass**: Even if client modifies code, backend enforces restrictions
5. **Access Expiry**: Optional evaluator_access_limits table tracks expiration dates

---

## Summary of Changes

### Backend Files Modified:
- `node/routes/documents.js`: Added `/stats/dashboard` endpoint

### Frontend Files Modified:
- `js/evaluator-dashboard.js`: Added `loadDashboardStats()` function
- `js/evaluator-documents.js`: Removed client-side filtering, rely on backend

### Database Tables Used:
- `users` (role = 'evaluator')
- `documents` (workflow_status = 'approved')
- `categories` (4 categories)
- `departments` (5 departments)
- `document_files` (file URLs)
- `evaluator_access_limits` (optional expiry tracking)

---

## Next Steps

1. Test with real evaluator account
2. Verify all statistics match database counts
3. Test filtering functionality on documents page
4. Verify document viewer modal works correctly
5. Test access restrictions (try viewing non-approved documents)
6. Monitor console logs for any errors
7. Test on different browsers (Chrome, Firefox, Edge)

---

## Support

For issues or questions:
1. Check browser console for error messages
2. Check backend server logs for API errors
3. Verify evaluator user has correct role in database
4. Verify documents have workflow_status = 'approved'
5. Test API endpoints directly using Postman/Thunder Client
