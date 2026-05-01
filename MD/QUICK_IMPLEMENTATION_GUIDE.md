# Quick Implementation Guide

## What Was Fixed

### 1. Profile Edit Function (user-profile.html)
- ✅ Name fields (firstName, lastName, middleInitial) are now READ-ONLY
- ✅ Only editable fields can be modified
- ✅ Save button shows loading state
- ✅ Proper error handling
- ✅ Sidebar updates after save

### 2. Role-Based Access Control
- ✅ **Area Chair**: Can access ALL user pages including user-approvals.html
- ✅ **Faculty**: Can access all user pages EXCEPT user-approvals.html (link hidden)
- ✅ Automatic role validation on page load
- ✅ Redirect to correct dashboard based on role

### 3. Shared Session Management
- ✅ Created `js/user-session.js` for centralized session handling
- ✅ Automatic sidebar population with user info
- ✅ Heartbeat mechanism to keep session alive
- ✅ Mobile-responsive sidebar toggle
- ✅ Active navigation highlighting

## Files Modified

1. **js/user-session.js** (NEW) - Shared session management
2. **js/user-profile.js** (UPDATED) - Fixed edit profile functionality
3. **js/user-dashboard.js** (UPDATED) - Added role-based access control
4. **js/homepage.js** (UPDATED) - Added role-based access control
5. **node/routes/auth.js** (UPDATED) - Fixed registration to save role

## How to Apply to All User Pages

### Step 1: Update HTML Files

Add `user-session.js` before page-specific scripts in ALL user pages:

**Files to update:**
- user-dashboard.html
- user-documents.html
- user-upload.html
- user-evidence-map.html
- user-search.html
- user-approvals.html
- user-profile.html

**Change:**
```html
<!-- OLD (at end of body) -->
<script src="js/user-dashboard.js"></script>

<!-- NEW (at end of body) -->
<script src="js/user-session.js"></script>
<script src="js/user-dashboard.js"></script>
```

### Step 2: Update JavaScript Files

Update each page-specific JS file to use shared session:

**Files to update:**
- js/user-documents.js
- js/user-upload.js
- js/user-evidence-map.js
- js/user-search.js
- js/user-approvals.js

**Pattern to follow:**
```javascript
// OLD
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) {
        window.location.href = 'landing.html';
        return;
    }
    
    // Duplicate sidebar population code
    // Duplicate logout handler
    // Duplicate mobile sidebar code
    
    // Page-specific code...
});

// NEW
document.addEventListener('DOMContentLoaded', function() {
    const session = initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    // Page-specific code only...
});
```

### Step 3: Remove Duplicate Code

Remove these from page-specific JS files (now handled by user-session.js):
- Session validation
- Sidebar population
- Logout handler
- Mobile sidebar toggle
- Heartbeat mechanism
- Active navigation highlighting

### Step 4: Test Each Page

For each page, test:
1. Login as **Faculty** → Verify "My Approvals" link is hidden
2. Login as **Area Chair** → Verify "My Approvals" link is visible
3. Login as **Admin** → Redirected to homepage.html
4. Login as **Dean** → Redirected to homepage.html
5. Sidebar shows correct user info
6. Mobile sidebar works
7. Logout works

## Specific Page Updates

### user-approvals.html
No changes needed - user-session.js automatically hides link for faculty role.

### user-profile.html
Already updated with fixed edit functionality.

### user-dashboard.html
Already updated with role-based access control.

### user-documents.html
Update to use shared session:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const session = initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    // Load documents
    loadDocuments();
});
```

### user-upload.html
Update to use shared session:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const session = initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    // Setup upload form
    setupUploadForm();
});
```

### user-search.html
Update to use shared session:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const session = initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    // Setup search functionality
    setupSearch();
});
```

### user-evidence-map.html
Update to use shared session:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const session = initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    // Load evidence map
    loadEvidenceMap();
});
```

## Testing Checklist

### Faculty Role
- [ ] Can access: dashboard, documents, upload, evidence-map, search, profile
- [ ] Cannot see: "My Approvals" link in sidebar
- [ ] Cannot access: user-approvals.html (redirected if URL entered)
- [ ] Sidebar shows: "Faculty Portal" and "Faculty Access"

### Area Chair Role
- [ ] Can access: dashboard, documents, upload, evidence-map, search, profile, approvals
- [ ] Can see: "My Approvals" link in sidebar
- [ ] Can access: user-approvals.html
- [ ] Sidebar shows: "Area Chair Portal" and "Area Chair Access"

### Profile Edit
- [ ] Click "Edit Profile" button
- [ ] Name fields (First, Last, Middle) are READ-ONLY (grayed out)
- [ ] Other fields become editable (white background)
- [ ] Make changes and click "Save Changes"
- [ ] Button shows "Saving..." during save
- [ ] Success message appears
- [ ] Changes persist after page reload
- [ ] Sidebar updates with new info

## Common Issues & Solutions

**Issue: "My Approvals" still visible for faculty**
- Solution: Clear browser cache and localStorage
- Verify user-session.js is loaded before page-specific JS

**Issue: Redirected to wrong dashboard**
- Solution: Check database users.role value
- Verify role is lowercase: 'faculty', 'area-chair', 'dean', 'admin', 'evaluator'

**Issue: Sidebar not showing user info**
- Solution: Check browser console for errors
- Verify API endpoint /api/user/profile/:userId is accessible

**Issue: Profile edit not saving**
- Solution: Check browser console for errors
- Verify JWT token is valid
- Check API endpoint /api/user/profile/:userId accepts PUT requests

## Summary

**What you need to do:**
1. Add `<script src="js/user-session.js"></script>` to all user HTML pages
2. Update page-specific JS files to use `initializeUserPage()`
3. Remove duplicate session/sidebar/logout code from JS files
4. Test with different roles

**What's automatically handled:**
- Role-based access control
- Sidebar population
- "My Approvals" visibility
- Logout functionality
- Mobile sidebar
- Active navigation
- Heartbeat mechanism

**Result:**
- ✅ Faculty cannot access approvals
- ✅ Area Chair can access approvals
- ✅ Profile edit works correctly
- ✅ All pages share consistent behavior
- ✅ Proper role-based redirects
