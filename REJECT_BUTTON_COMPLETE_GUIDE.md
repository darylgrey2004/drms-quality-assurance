# Reject Button Fix - Complete Guide

## The Issue

You were experiencing the reject button not working when logged in as **Admin** or **Dean**.

## Root Cause

The system has TWO different approval pages:

1. **`approvals.html`** - For Admin and Dean (admin-style interface)
2. **`user-approvals.html`** - For Department Heads/Area Chairs (user-style interface)

When you log in as Admin or Dean and try to access `user-approvals.html`, the system automatically redirects you to `approvals.html` (the admin page).

## The Fix

I've added enhanced error handling and console logging to BOTH pages:

### Files Updated:
1. **`js/approvals.js`** (Admin/Dean page) - Added debugging and error handling
2. **`js/user-approvals.js`** (Department Head page) - Already updated previously

## How to Test

### For Admin/Dean Users:

1. **Log in as Admin or Dean**
2. **Navigate to:** `approvals.html` (NOT `user-approvals.html`)
   - The system should automatically take you there
   - Or click "Approvals" in the sidebar
3. **Open Browser Console** (F12 → Console tab)
4. **Find a document** with status "Pending" or "Validated"
5. **Click the "Reject" button**
6. **Check the console** for these messages:
   ```
   Reject button clicked for document ID: [number]
   Found document: [object]
   ```
7. **Fill in the rejection reason** in the modal
8. **Click "Submit Comment"**
9. **Check the console** for:
   ```
   Submitting rejection for document ID: [number]
   Rejection reason: [your reason]
   performReject called with docId: [number] reason: [your reason]
   Rejection response status: 200
   Rejection response data: {msg: "Document rejected successfully", ...}
   ```

### For Department Head Users:

1. **Log in as Department Head**
2. **Navigate to:** `user-approvals.html`
3. **Follow the same testing steps** as above

## Expected Behavior

### When Reject Button is Clicked:
1. Modal should slide down from the top
2. Document information should be displayed
3. Rejection reason textarea should be empty and ready for input

### When Submit is Clicked:
1. If reason is empty → Toast error: "Please provide a rejection reason."
2. If reason is provided → API call is made
3. On success → Toast success: "Document rejected successfully."
4. Modal closes automatically
5. Document status updates to "Rejected"
6. Stats are refreshed

## Troubleshooting

### Issue: Modal doesn't open
**Check console for:** "Document not found in allDocuments array"
**Solution:** Refresh the page to reload documents

### Issue: Submit button does nothing
**Check console for:** "No document selected for rejection"
**Solution:** Close modal and try clicking reject button again

### Issue: API call fails
**Check console for:** "Rejection response status: [error code]"
**Common errors:**
- **403**: Not authorized (check user role)
- **404**: Document not found
- **400**: Missing rejection reason
- **500**: Server error (check backend logs)

### Issue: Button not visible
**Possible causes:**
- Document status doesn't allow rejection (only pending/validated can be rejected)
- User role doesn't have permission
- Wrong page (Admin should use `approvals.html`, not `user-approvals.html`)

## User Permissions

### Who Can Reject Documents:
- ✅ **Admin** - Can reject any document
- ✅ **Dean** - Can reject any document
- ✅ **Department Head** - Can reject documents from their department only

### Which Documents Can Be Rejected:
- ✅ **Draft** status
- ✅ **Pending** status (awaiting validation)
- ✅ **Validated** status (awaiting approval)
- ❌ **Approved** status (cannot be rejected, only locked)
- ❌ **Locked** status (cannot be rejected)
- ❌ **Rejected** status (already rejected)

## Page Navigation Guide

### Admin Users:
- Homepage: `homepage.html`
- Documents: `documents.html`
- Upload: `upload.html`
- **Approvals: `approvals.html`** ← Use this page!
- Reports: `reports.html`
- Users: `users.html`

### Dean Users:
- Same as Admin (uses admin-style pages)
- **Approvals: `approvals.html`** ← Use this page!

### Department Head Users:
- Dashboard: `user-dashboard.html`
- Documents: `user-documents.html`
- Upload: `user-upload.html`
- **Approvals: `user-approvals.html`** ← Use this page!
- Profile: `user-profile.html`

## Testing Checklist

- [ ] Logged in as correct role (Admin/Dean/Department Head)
- [ ] On correct page (`approvals.html` for Admin/Dean, `user-approvals.html` for Dept Head)
- [ ] Browser console is open (F12)
- [ ] Document has rejectable status (pending or validated)
- [ ] Reject button is visible
- [ ] Clicking reject button opens modal
- [ ] Modal displays document information
- [ ] Can type in rejection reason textarea
- [ ] Submit button is clickable
- [ ] Console shows "Submitting rejection..." message
- [ ] API responds with status 200
- [ ] Success toast appears
- [ ] Modal closes automatically
- [ ] Document status updates to "Rejected"
- [ ] Stats are refreshed

## Quick Fix Commands

If you're still having issues, try these:

1. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard refresh the page:**
   - Press `Ctrl + F5` (Windows)
   - Press `Cmd + Shift + R` (Mac)

3. **Check if backend is running:**
   - Open terminal
   - Navigate to `node` folder
   - Run `node server.js` or `npm start`
   - Should see: "Server running on port 3000"

4. **Verify database connection:**
   - Check if MySQL/MariaDB is running
   - Verify database name is `drms_db`
   - Check credentials in `node/database.js`

## Still Not Working?

If the reject button still doesn't work after following this guide:

1. **Take screenshots of:**
   - The browser console (showing any errors)
   - The Network tab (F12 → Network) showing the API call
   - The page you're on (check URL)

2. **Provide this information:**
   - Your user role (Admin/Dean/Department Head)
   - The page URL you're on
   - The document status you're trying to reject
   - Any error messages in the console
   - Any error messages in the backend terminal

3. **Check backend logs:**
   - Look at your Node.js terminal
   - Check for any error messages when you click reject
   - Copy any error messages you see

## Summary

The reject button SHOULD work now on both pages. The key is:
- **Admin/Dean** → Use `approvals.html`
- **Department Head** → Use `user-approvals.html`

Both pages now have enhanced error handling and console logging to help identify any issues.
