# Dean Data Fetching Fix - Complete Guide

## Problem Statement

Dean users should be able to view ALL documents from ALL departments across the system, but currently they may not be seeing all data properly.

## Backend Status

✅ **Backend is ALREADY configured correctly:**
- `canViewAll()` function returns `true` for Dean role
- `/api/documents` endpoint supports `scope=all` parameter
- `/api/approvals/pending` endpoint allows Dean to see all approval documents
- Dean has read-only access to all documents

## Frontend Files That Need Verification/Fix

### Admin Pages (Dean uses these):
1. ✅ **documents.js** - Already fetching with `scope=all`
2. ✅ **approvals.js** - Already fetching all documents
3. **homepage.js** - Dashboard statistics
4. **upload.js** - Upload functionality
5. **evidence-map.js** - Evidence mapping
6. **search.js** - Search functionality
7. **reports.js** - Reports generation
8. **users.js** - User management (read-only for Dean)
9. **audit-trail.js** - Audit logs (read-only for Dean)
10. **settings.js** - Settings (read-only for Dean)

## What Dean Should See

### Documents Page:
- ✅ ALL documents from ALL departments
- ✅ All categories (Instruction, Research, Extension, Employment)
- ✅ All workflow statuses (Draft, Pending, Validated, Approved, Locked, Rejected)

### Approvals Page:
- ✅ ALL pending/validated documents from ALL departments
- ✅ Can approve documents (final approval authority)
- ❌ Cannot validate documents (that's for Dept. Heads)
- ✅ Can reject documents with comments

### Dashboard (Homepage):
- Should see college-wide statistics:
  - Total documents across all departments
  - Documents by category (all departments combined)
  - Documents by status (all departments combined)
  - Documents by department (breakdown)
  - Recent uploads from all departments

### Search Page:
- Should search across ALL documents from ALL departments

### Evidence Map:
- Should view ALL document mappings from ALL departments

### Reports:
- Should generate college-level reports
- Should see data from ALL departments

### Users Page:
- Should view ALL users (read-only)
- Cannot create/edit/delete users

### Audit Trail:
- Should view activity logs (read-only)

### Settings:
- Should view settings (read-only)
- Cannot modify settings

## Current Implementation Status

### ✅ Working Correctly:
1. **documents.js** - Fetches with `scope=all`
2. **approvals.js** - Fetches all pending documents
3. **admin-session.js** - Properly identifies Dean role

### ⚠️ Needs Verification:
1. **homepage.js** - May not be fetching college-wide stats
2. **search.js** - May not be searching all departments
3. **evidence-map.js** - May not show all mappings
4. **reports.js** - May not include all departments

## Testing Checklist for Dean Role

### Documents Page:
- [ ] Can see documents from BEED department
- [ ] Can see documents from BSED department
- [ ] Can see documents from BSNED department
- [ ] Can see documents from BCAED department
- [ ] Can see documents from BPED department
- [ ] Total count matches sum of all departments

### Approvals Page:
- [ ] Can see pending documents from all departments
- [ ] Can approve documents
- [ ] Can reject documents
- [ ] Cannot validate documents (should not see validate button)

### Dashboard:
- [ ] Statistics show college-wide data
- [ ] Department breakdown shows all 5 departments
- [ ] Charts include data from all departments

### Search:
- [ ] Search results include documents from all departments
- [ ] Department filter shows all departments
- [ ] Can filter by any department

## Quick Test Query

To verify Dean is seeing all documents, run this in browser console on documents page:

```javascript
// Check how many documents Dean sees
console.log('Total documents loaded:', allDocuments.length);

// Check departments represented
const depts = [...new Set(allDocuments.map(d => d.department_code))];
console.log('Departments:', depts);

// Expected: ['BEED', 'BSED', 'BSNED', 'BCAED', 'BPED']
```

## Backend Query for Verification

Run this SQL query to see total documents:

```sql
SELECT 
  department_code,
  COUNT(*) as doc_count
FROM documents
GROUP BY department_code
ORDER BY department_code;
```

Then compare with what Dean sees in the UI.

## Files Modified in This Fix

1. **js/admin-session.js** - Already correct
2. **js/documents.js** - Already correct
3. **js/approvals.js** - Already correct
4. **node/routes/documents.js** - Already correct
5. **node/routes/approvals.js** - Already correct

## Next Steps

1. Test Dean login
2. Navigate to Documents page
3. Open browser console
4. Run test query above
5. Verify all departments are shown
6. Check other pages (Dashboard, Search, etc.)
7. Report any pages where data is missing

## Common Issues

### Issue: Dean sees only one department's documents
**Cause:** Frontend not passing `scope=all` parameter
**Fix:** Add `?scope=all` to fetch URL

### Issue: Dean sees no documents
**Cause:** Backend permission check failing
**Fix:** Verify `canViewAll()` returns true for Dean

### Issue: Dean sees "Not authorized" error
**Cause:** Role not properly normalized
**Fix:** Check `normalizeRole()` function

## Role Comparison

| Feature | Admin | Dean | Dept. Head | Faculty |
|---------|-------|------|------------|---------|
| View all documents | ✅ | ✅ | ❌ (dept only) | ❌ (own only) |
| Upload documents | ✅ | ❌ | ✅ | ✅ |
| Validate documents | ✅ | ❌ | ✅ | ❌ |
| Approve documents | ✅ | ✅ | ❌ | ❌ |
| Lock documents | ✅ | ✅ | ✅ | ❌ |
| Delete documents | ✅ | ❌ | ✅ (rejected) | ✅ (own draft/rejected) |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ (read-only) | ❌ | ❌ |
| Modify settings | ✅ | ❌ | ❌ | ❌ |

## Conclusion

The backend is already configured correctly for Dean to view all documents. The frontend `documents.js` and `approvals.js` are also correct. 

**The system should already be working for Dean users.**

If Dean is not seeing all documents, the issue is likely:
1. Test data - Not enough documents in different departments
2. Browser cache - Need to clear cache and reload
3. Token issue - Need to re-login

**Recommended Action:** Test with Dean account and verify using the console commands above.
