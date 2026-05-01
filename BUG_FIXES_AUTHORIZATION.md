# Bug Fixes: Authorization Issues for Dept. Head Role

## Date: 2025-01-XX
## Status: FIXED

---

## Bug #1: Comments Authorization Error

### Problem
Dept. Head users received "Not authorized to view comments" error when trying to view rejection comments on documents from their department, even though they should have access to manage documents in their department.

### Root Cause
The `/api/documents/:id/comments` endpoint only checked if the user was:
- Admin/Dean (viewAll permission), OR
- The document uploader

It did not check if the user was a Dept. Head viewing documents from their own department.

### Solution
Updated `node/routes/documents.js` - `/api/documents/:id/comments` endpoint:
- Added check for `area-chair` and `department-head` roles
- Query `faculty_profiles` to get the Dept. Head's department
- Match department_id from document with Dept. Head's department
- Grant access if document belongs to Dept. Head's department

### Code Changes
**File**: `node/routes/documents.js`
```javascript
// Added isAreaChair check
const isAreaChair = normalizedRole === 'area-chair' || normalizedRole === 'department-head';

// Area-chair/Dept. Head can view comments for documents in their department
if (!authorized && isAreaChair) {
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

---

## Bug #2: Approve Button Appearing for Dept. Head

### Problem
After a Dept. Head validated a document (status changed to 'validated'), the Approve button appeared in the UI. Dept. Head should NOT be able to approve documents - only Admin and Dean can approve.

### Root Cause
**Backend**: The `/api/approvals/:documentId/approve` endpoint allowed `area-chair` and `department-head` roles to approve documents.

**Frontend**: The button logic in `getActionButtons()` only checked for `isAreaChair` (which was only checking for 'area-chair', not 'department-head'), so when the role was 'department-head', it fell through to the else block and showed the approve button.

### Solution

#### Backend Fix
**File**: `node/routes/approvals.js`
- Created new `canFinalApprove()` function that ONLY allows 'admin' and 'dean'
- Updated `/api/approvals/:documentId/approve` to use `canFinalApprove()` instead of checking roles directly
- Improved error message to clarify "Only Admin and Dean can approve"

```javascript
function canFinalApprove(role) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'dean';
}

router.post('/:documentId/approve', auth, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (!canFinalApprove(role)) {
      return res.status(403).json({ msg: 'Not authorized to approve documents. Only Admin and Dean can approve.' });
    }
    // ... rest of approval logic
```

#### Frontend Fix
**File**: `js/user-approvals.js`
- Updated `getActionButtons()` to properly check for both 'area-chair' and 'department-head' roles
- Added `isDeanOrAdmin` variable to explicitly check for Dean/Admin roles
- Reordered logic to check `isDeanOrAdmin` FIRST, then `isAreaChair` for the "Awaiting Approval" badge

```javascript
function getActionButtons(doc, mobile = false) {
    const isAreaChair = normalizedRole === 'area-chair' || normalizedRole === 'department-head';
    const isDeanOrAdmin = normalizedRole === 'dean' || normalizedRole === 'admin';
    
    // ... other code ...
    
    } else if (s === 'validated') {
        if (isDeanOrAdmin) {
            // Only Dean / Admin can approve
            btns += ` <button class="${cls.approve} btn-approve-action" data-id="${doc.id}">Approve</button>`;
            btns += ` <button class="${cls.reject} btn-reject-action" data-id="${doc.id}">Reject</button>`;
        } else if (isAreaChair) {
            // Area-chair/Dept. Head cannot approve — show informational badge
            btns += ` <span class="${cls.awaiting}" title="Awaiting Dean/Admin approval">Awaiting Approval</span>`;
        }
    }
```

---

## Permission Matrix (Updated)

| Role | Validate | Approve | Reject | Lock | Unlock | View Comments |
|------|----------|---------|--------|------|--------|---------------|
| **Dept. Head** | ✅ (own dept) | ❌ | ✅ (own dept) | ✅ (own dept) | ❌ | ✅ (own dept) |
| **Dean** | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ❌ | ✅ (all) |
| **Admin** | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) |
| **Faculty** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (own docs) |

---

## Testing Checklist

### Test Bug #1 Fix (Comments Authorization)
- [ ] Login as Dept. Head
- [ ] Navigate to user-documents.html
- [ ] Find a rejected document from your department (uploaded by another faculty member)
- [ ] Click "View Comments" button
- [ ] **Expected**: Comments modal opens showing rejection reasons
- [ ] **Previous**: "Not authorized to view comments" error

### Test Bug #2 Fix (Approve Button)
- [ ] Login as Dept. Head
- [ ] Navigate to user-approvals.html
- [ ] Find a document with status "Pending" from your department
- [ ] Click "Validate" button
- [ ] **Expected**: Document status changes to "Validated" and shows "Awaiting Approval" badge (NOT an Approve button)
- [ ] **Previous**: Approve button appeared after validation

### Additional Tests
- [ ] Login as Dean - verify Approve button DOES appear for validated documents
- [ ] Login as Admin - verify Approve button DOES appear for validated documents
- [ ] Login as Faculty - verify they can view comments on their own rejected documents
- [ ] Login as Dept. Head - verify they CANNOT approve documents via API (test with Postman/curl)

---

## Files Modified

1. **node/routes/documents.js**
   - Updated `/api/documents/:id/comments` endpoint
   - Added department-based authorization for Dept. Head role

2. **node/routes/approvals.js**
   - Added `canFinalApprove()` function
   - Updated `/api/approvals/:documentId/approve` endpoint to restrict to Admin/Dean only

3. **js/user-approvals.js**
   - Updated `getActionButtons()` function
   - Fixed role checking logic for approve button visibility

---

## Deployment Notes

1. Restart Node.js server after deploying backend changes
2. Clear browser cache or hard refresh (Ctrl+F5) to load updated JavaScript
3. Test with all three roles: Dept. Head, Dean, Admin
4. Monitor server logs for any authorization errors

---

## Related Documentation

- See `DEPT_HEAD_ROLE_MIGRATION.md` for complete role migration guide
- See `BUG_FIXES_DEPT_HEAD.md` for previous bug fixes
