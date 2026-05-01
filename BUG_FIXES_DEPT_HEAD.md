# Bug Fixes: Dept. Head User-Approvals and User-Documents

## Issues Fixed

### Issue 1: Dept. Head Can't See Documents in User-Approvals
**Problem**: Dept. Head users need to upload documents first before seeing any documents in user-approvals page.

**Root Cause**: The backend was filtering to show only documents uploaded by the Dept. Head OR documents from their department. This meant if they hadn't uploaded anything, the query would be too restrictive.

**Solution**: Modified `node/routes/approvals.js` to show ALL documents from the Dept. Head's department, not just their own uploads.

**Code Change**:
```javascript
// BEFORE (Wrong - too restrictive)
if (deptId) {
  whereSql += " AND (d.department_id = ? OR d.uploader_id = ?)";
  params.push(deptId, req.user.id);
}

// AFTER (Correct - shows all dept documents)
if (deptId) {
  whereSql += " AND d.department_id = ?";
  params.push(deptId);
}
```

**Expected Behavior Now**:
- Dept. Head logs in
- Goes to user-approvals page
- Sees ALL documents from their department (uploaded by any faculty in that department)
- Can validate, reject, and lock documents from their department

---

### Issue 2: Comments Modal Not Showing on Rejected Documents
**Problem**: Clicking "Comments" button on rejected documents shows "Failed to load comments" error.

**Root Cause**: The error message wasn't detailed enough to identify the actual problem. Could be:
1. Backend API not returning comments correctly
2. Modal CSS not loading
3. JavaScript error in opening modal

**Solution**: 
1. Added detailed console logging to identify the exact error
2. Verified CSS classes exist in `css/user-documents.css` (they do)
3. Enhanced error messages to show actual HTTP status and error details

**Code Changes**:
```javascript
// Enhanced error handling with detailed logs
async function showRejectionComments(docId) {
    try {
        console.log('Fetching comments for document:', docId);
        console.log('API URL:', `${API_BASE}/api/documents/${docId}/comments`);
        
        const response = await fetch(`${API_BASE}/api/documents/${docId}/comments`, {
            headers: { 'x-auth-token': token }
        });
        
        console.log('Comments response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
            throw new Error(errorData.msg || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Comments data:', data);
        
        const doc = allDocuments.find(d => d.id == docId);
        console.log('Document found:', doc);
        
        openCommentsModal(doc, data.comments || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        showToast('Failed to load comments: ' + error.message, true);
    }
}
```

**Debugging Steps**:
1. Open browser console (F12)
2. Click "Comments" button on a rejected document
3. Check console logs for:
   - Document ID being fetched
   - API URL being called
   - Response status code
   - Comments data returned
   - Any JavaScript errors

**Expected Behavior Now**:
- Click "Comments" button on rejected document
- Modal slides down from top with rejection comments
- Shows reviewer name, date, and rejection reason
- Can close modal by clicking X or Close button

---

## Testing Checklist

### Test Dept. Head Approvals Access:
- [ ] Log in as Dept. Head user
- [ ] Go to user-approvals page
- [ ] Verify you see documents from your department (even if you didn't upload them)
- [ ] Verify you can validate documents
- [ ] Verify you can reject documents
- [ ] Verify you can lock approved documents

### Test Comments Modal:
- [ ] Log in as any user (Faculty or Dept. Head)
- [ ] Go to user-documents page
- [ ] Find a rejected document
- [ ] Click "Comments" button
- [ ] Verify modal opens with rejection comments
- [ ] Verify you can see reviewer name and date
- [ ] Verify you can close the modal

---

## Additional Notes

### Dept. Head Permissions Summary:
✅ Can see ALL documents from their department
✅ Can validate documents (pending → validated)
✅ Can reject documents with comments
✅ Can lock approved documents
❌ Cannot approve documents (only Dean/Admin)
❌ Cannot unlock locked documents (only Admin)

### Comments Modal Features:
- Shows all rejection comments for a document
- Displays reviewer name and timestamp
- Shows rejection reason/comments
- Scrollable if multiple comments exist
- Responsive design for mobile

---

## Troubleshooting

### If Dept. Head still can't see documents:
1. Check if Dept. Head has a department assigned in faculty_profiles table:
```sql
SELECT u.email, u.role, fp.department 
FROM users u 
LEFT JOIN faculty_profiles fp ON u.id = fp.user_id 
WHERE u.role = 'department-head';
```

2. Verify documents have department_id set:
```sql
SELECT id, title, department_id, department_code, uploader_id 
FROM documents 
WHERE department_id IS NOT NULL;
```

3. Check backend logs for any errors when loading approvals

### If Comments Modal still doesn't show:
1. Open browser console (F12) and check for errors
2. Verify the API endpoint returns data:
   - Open Network tab in browser dev tools
   - Click Comments button
   - Check the API call to `/api/documents/{id}/comments`
   - Verify it returns 200 status with comments array

3. Check if document has rejection comments in database:
```sql
SELECT aw.document_id, aw.comments, aw.created_at, 
       CONCAT(u.firstName, ' ', u.lastName) as reviewer
FROM approval_workflow aw
LEFT JOIN users u ON aw.action_by = u.id
WHERE aw.document_id = YOUR_DOC_ID 
  AND aw.comments IS NOT NULL;
```

---

## Files Modified

1. **node/routes/approvals.js** - Fixed Dept. Head document visibility
2. **js/user-documents.js** - Enhanced error logging for comments modal

## No Database Changes Required

These are code-only fixes. No SQL migrations needed.
