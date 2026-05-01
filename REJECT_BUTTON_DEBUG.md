# Reject Button Debugging Guide

## Changes Made

I've updated `js/user-approvals.js` with enhanced error handling and console logging to help identify the issue with the reject button.

## What Was Fixed

1. **Added Console Logging** - The reject button now logs:
   - When the button is clicked
   - The document ID being rejected
   - Whether the document was found in the array
   - The rejection submission process
   - Response status and data

2. **Better Error Handling** - Added:
   - Error message if document is not found
   - Error message if no document ID is set
   - Detailed error messages from the server

3. **Improved Document Lookup** - Now checks for both numeric and string IDs

## How to Test

1. **Open the browser console** (F12 or Right-click → Inspect → Console)

2. **Navigate to the Approvals page** (user-approvals.html)

3. **Click a Reject button** on any document

4. **Check the console** for these messages:
   ```
   Reject button clicked for document ID: [number]
   Found document: [object]
   ```

5. **Fill in the rejection reason** and click "Submit Rejection"

6. **Check the console** for:
   ```
   Submitting rejection for document ID: [number]
   Rejection reason: [your reason]
   Rejection response status: [200 or error code]
   Rejection response data: [response object]
   ```

## Common Issues & Solutions

### Issue 1: Modal doesn't open
**Symptoms:** Nothing happens when clicking reject button
**Check console for:** "Document not found in allDocuments array"
**Solution:** The document list might not be loaded. Try refreshing the page.

### Issue 2: Modal opens but submission fails
**Symptoms:** Modal appears but clicking "Submit Rejection" shows an error
**Check console for:** "Rejection response status: [error code]"
**Possible causes:**
- 403: Not authorized (check user role)
- 404: Document not found (document might have been deleted)
- 400: Missing rejection reason
- 500: Server error (check backend logs)

### Issue 3: Button doesn't appear
**Symptoms:** No reject button visible
**Possible causes:**
- User role doesn't have permission
- Document status doesn't allow rejection
- CSS issue hiding the button

## Backend Endpoint

The reject button calls:
```
POST /api/approvals/:documentId/reject
Headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
Body: { "reason": "rejection reason text" }
```

## User Permissions

Users who can reject documents:
- Admin
- Dean
- Department Head (area-chair)

Department Heads can only reject documents from their own department.

## Document Status Requirements

Documents can be rejected when in these statuses:
- draft
- pending
- validated

## Testing Checklist

- [ ] Console shows no JavaScript errors
- [ ] Reject button is visible on eligible documents
- [ ] Clicking reject button opens the modal
- [ ] Modal displays document information correctly
- [ ] Rejection reason textarea is editable
- [ ] Submit button is clickable
- [ ] Console shows "Submitting rejection..." message
- [ ] Server responds with success (status 200)
- [ ] Document status updates to "rejected"
- [ ] Success toast appears
- [ ] Modal closes automatically

## If Still Not Working

1. **Check browser console** for any red error messages
2. **Check network tab** (F12 → Network) to see if the API call is being made
3. **Check backend logs** in your Node.js terminal for server-side errors
4. **Verify user role** - Make sure you're logged in as Admin, Dean, or Department Head
5. **Check document status** - Make sure the document is in a rejectable state
6. **Clear browser cache** and reload the page
7. **Try a different browser** to rule out browser-specific issues

## Contact Information

If the issue persists after following this guide, please provide:
1. Screenshots of the browser console
2. Screenshots of the Network tab showing the API call
3. Your user role
4. The document status you're trying to reject
5. Any error messages displayed
