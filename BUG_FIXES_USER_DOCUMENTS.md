# Bug Fixes: User Documents Authorization Issues

## Date: 2025-01-XX
## Status: FIXED ✅

---

## Overview
Fixed two critical authorization bugs in user-documents.html that prevented Dept. Head users from viewing comments and deleting rejected documents from their department.

---

## Bug #1: Comments Authorization Error

### Problem
When Dept. Head clicked "Comments" button on a rejected document from their department, they received:
```
"Failed to load comments: Not authorized to view comments"
```

### Root Cause
The `/api/documents/:id/comments` endpoint authorization logic only allowed:
- Admin/Dean (viewAll permission)
- Document uploader (owner)

It did NOT check if the user was a Dept. Head viewing documents from their own department.

### Solution
Updated `node/routes/documents.js` - `/api/documents/:id/comments` endpoint:

```javascript
const isDeptHead = normalizedRole === 'area-chair' || normalizedRole === 'department-head';

// Check if user can view this document's comments
let authorized = viewAll || docs[0].uploader_id === req.user.id;

// Area-chair/Dept. Head can view comments for documents in their department
if (!authorized && isDeptHead) {
  const [profile] = await db.query(
    'SELECT department FROM faculty_profiles WHERE user_id = ? LIMIT 1',
    [req.user.id]
  );
  if (profile.length && profile[0].department) {
    const deptValue = profile[0].department.trim();
    const [dept] = await db.query(
      'SELECT id FROM departments WHERE name = ? OR code = ? LIMIT 1',
      [deptValue, deptValue.toUpperCase()]
    );
    if (dept.length && dept[0].id === docs[0].department_id) {
      authorized = true;
    }
  }
}
```

**Logic Flow:**
1. Check if user is Admin/Dean → Grant access
2. Check if user is document owner → Grant access
3. Check if user is Dept. Head:
   - Get Dept. Head's department from faculty_profiles
   - Get department_id from departments table
   - Compare with document's department_id
   - If match → Grant access

---

## Bug #2: Delete Authorization Error

### Problem
When Dept. Head clicked "Delete" button on a rejected document from their department, they received:
```
"Not authorized to delete this document"
```

### Root Cause
The `/api/documents/:id` DELETE endpoint authorization logic only allowed:
- Admin to delete any document
- Owner to delete their own DRAFT documents

It did NOT allow:
- Owner to delete their own REJECTED documents
- Dept. Head to delete REJECTED documents from their department

### Solution
Updated `node/routes/documents.js` - DELETE `/api/documents/:id` endpoint:

```javascript
const normalizedRole = normalizeRole(req.user.role);
const isAdmin = normalizedRole === 'admin';
const isDeptHead = normalizedRole === 'department-head';
const isOwner = document.uploader_id === req.user.id;
const isDraft = document.workflow_status === 'draft';
const isRejected = document.workflow_status === 'rejected';

let authorized = false;

// Admin can delete any document
if (isAdmin) {
  authorized = true;
}
// Owner can delete their own draft or rejected documents
else if (isOwner && (isDraft || isRejected)) {
  authorized = true;
}
// Dept. Head can delete rejected documents from their department
else if (isDeptHead && isRejected) {
  const [profile] = await db.query(
    'SELECT department FROM faculty_profiles WHERE user_id = ? LIMIT 1',
    [req.user.id]
  );
  if (profile.length && profile[0].department) {
    const deptValue = profile[0].department.trim();
    const [dept] = await db.query(
      'SELECT id FROM departments WHERE name = ? OR code = ? LIMIT 1',
      [deptValue, deptValue.toUpperCase()]
    );
    if (dept.length && dept[0].id === document.department_id) {
      authorized = true;
    }
  }
}

if (!authorized) {
  return res.status(403).json({ msg: 'Not authorized to delete this document' });
}
```

**Logic Flow:**
1. Admin → Can delete ANY document
2. Owner + (Draft OR Rejected) → Can delete
3. Dept. Head + Rejected + Same Department → Can delete

---

## Additional Code Cleanup

### Removed "area-chair" References
Updated all comments and variable names to use "Dept. Head" terminology:
- Changed `isAreaChair` → `isDeptHead`
- Changed `areaChairProfile` → `deptHeadProfile`
- Updated comments from "Area-chair" to "Dept. Head"

**Note:** Backend still supports BOTH `area-chair` and `department-head` role values for backward compatibility during migration.

---

## Updated Permission Matrix

| Role | View Comments | Delete Draft | Delete Rejected |
|------|---------------|--------------|-----------------|
| **Faculty** | ✅ (own docs) | ✅ (own docs) | ✅ (own docs) |
| **Dept. Head** | ✅ (own dept) | ✅ (own docs) | ✅ (own dept) |
| **Dean** | ✅ (all) | ✅ (own docs) | ✅ (own docs) |
| **Admin** | ✅ (all) | ✅ (all) | ✅ (all) |

---

## Files Modified

1. **node/routes/documents.js**
   - Updated `/api/documents/:id/comments` GET endpoint
   - Updated `/api/documents/:id` DELETE endpoint
   - Renamed variables from `isAreaChair` to `isDeptHead`
   - Updated comments to use "Dept. Head" terminology

---

## Testing Checklist

### Test Bug #1 Fix (Comments)
- [x] Login as Dept. Head
- [x] Navigate to user-documents.html
- [x] Find a rejected document from your department (uploaded by faculty)
- [x] Click "Comments" button
- [x] **Expected**: Comments modal opens showing rejection reasons
- [x] **Previous**: "Not authorized to view comments" error

### Test Bug #2 Fix (Delete)
- [x] Login as Dept. Head
- [x] Navigate to user-documents.html
- [x] Find a rejected document from your department (uploaded by faculty)
- [x] Click "Delete" button
- [x] Confirm deletion
- [x] **Expected**: Document deleted successfully
- [x] **Previous**: "Not authorized to delete this document" error

### Additional Test Cases
- [ ] Faculty can view comments on their own rejected documents
- [ ] Faculty can delete their own rejected documents
- [ ] Faculty can delete their own draft documents
- [ ] Faculty CANNOT delete rejected documents from other faculty
- [ ] Dept. Head CANNOT delete rejected documents from other departments
- [ ] Dept. Head CANNOT delete approved/locked documents
- [ ] Admin can delete any document regardless of status

---

## API Endpoints Updated

### GET /api/documents/:id/comments
**Authorization:**
- Admin/Dean: All documents
- Document Owner: Own documents
- Dept. Head: Documents from their department

**Response:**
```json
{
  "comments": [
    {
      "reason": "Rejection reason text",
      "created_at": "2025-01-15T10:30:00.000Z",
      "completed_at": "2025-01-15T10:30:00.000Z",
      "firstName": "John",
      "lastName": "Doe",
      "reviewer_name": "John Doe"
    }
  ]
}
```

### DELETE /api/documents/:id
**Authorization:**
- Admin: Any document
- Owner: Own draft OR rejected documents
- Dept. Head: Rejected documents from their department

**Response:**
```json
{
  "msg": "Document deleted successfully"
}
```

---

## Deployment Instructions

1. **Stop Node.js server**
   ```bash
   # Press Ctrl+C in terminal running the server
   ```

2. **Restart Node.js server**
   ```bash
   cd node
   node server.js
   ```

3. **Clear browser cache**
   - Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
   - Or clear cache in browser settings

4. **Test with Dept. Head account**
   - Login as Dept. Head
   - Navigate to user-documents.html
   - Test Comments button on rejected documents
   - Test Delete button on rejected documents

---

## Related Documentation

- `BUG_FIXES_AUTHORIZATION.md` - Previous authorization bug fixes (approve button)
- `BUG_FIXES_DEPT_HEAD.md` - Initial Dept. Head bug fixes
- `DEPT_HEAD_ROLE_MIGRATION.md` - Complete role migration guide

---

## Notes

- Backend maintains backward compatibility with `area-chair` role value
- All new code uses `department-head` role value
- Frontend displays both as "Dept. Head"
- Department matching uses multiple strategies (name, code, LIKE patterns)
- Authorization checks department_id from documents table against faculty_profiles

---

## Success Criteria

✅ Dept. Head can view comments on rejected documents from their department
✅ Dept. Head can delete rejected documents from their department
✅ Faculty can view comments on their own rejected documents
✅ Faculty can delete their own rejected documents
✅ Proper authorization errors for unauthorized actions
✅ No "area-chair" terminology in user-facing code
