# Quick Reference: Add Scripts to HTML Files

## What You Need to Do

Add these two lines before the closing `</body>` tag in each HTML file:

```html
<script src="js/user-session.js"></script>
<script src="js/[page-specific].js"></script>
```

## File-by-File Instructions

### 1. user-dashboard.html
```html
<!-- Find the closing </body> tag and add BEFORE it: -->
<script src="js/user-session.js"></script>
<script src="js/user-dashboard.js"></script>
</body>
</html>
```

### 2. user-documents.html
```html
<!-- Find the closing </body> tag and add BEFORE it: -->
<script src="js/user-session.js"></script>
<script src="js/user-documents.js"></script>
</body>
</html>
```

### 3. user-upload.html
```html
<!-- Find the closing </body> tag and add BEFORE it: -->
<script src="js/user-session.js"></script>
<script src="js/user-upload.js"></script>
</body>
</html>
```

### 4. user-evidence-map.html
```html
<!-- Find the closing </body> tag and add BEFORE it: -->
<script src="js/user-session.js"></script>
<script src="js/user-evidence-map.js"></script>
</body>
</html>
```

### 5. user-search.html
```html
<!-- Find the closing </body> tag and add BEFORE it: -->
<script src="js/user-session.js"></script>
<script src="js/user-search.js"></script>
</body>
</html>
```

### 6. user-approvals.html
```html
<!-- Find the closing </body> tag and add BEFORE it: -->
<script src="js/user-session.js"></script>
<script src="js/user-approvals.js"></script>
</body>
</html>
```

### 7. user-profile.html
```html
<!-- Find the closing </body> tag and add BEFORE it: -->
<script src="js/user-session.js"></script>
<script src="js/user-profile.js"></script>
</body>
</html>
```

## Important Notes

1. **Order Matters!** 
   - `user-session.js` MUST come FIRST
   - Page-specific JS comes SECOND

2. **Remove Old Scripts**
   - If the HTML file already has inline `<script>` tags with session code, you can remove them
   - If it already has the page-specific script tag, just add `user-session.js` BEFORE it

3. **Check for Duplicates**
   - Make sure you don't add the same script twice
   - Each script should only appear once

## Quick Test

After adding scripts to a file:

1. Open the HTML file in browser
2. Open browser console (F12)
3. Check for errors
4. Verify sidebar shows your name
5. Verify "My Approvals" visibility matches your role

## What Should Happen

### For Faculty:
- ✅ Sidebar shows your name and role
- ✅ "My Approvals" link is HIDDEN
- ✅ Can access all pages except approvals
- ✅ Logout button works

### For Area Chair:
- ✅ Sidebar shows your name and role
- ✅ "My Approvals" link is VISIBLE
- ✅ Can access all pages including approvals
- ✅ Logout button works

### For Admin/Dean:
- ✅ Redirected to homepage.html when accessing user pages

## Troubleshooting

**Problem:** Console shows "initializeUserPage is not defined"
- **Solution:** Make sure `user-session.js` is loaded BEFORE the page-specific JS

**Problem:** Sidebar doesn't show user info
- **Solution:** Check that `sidebarInitials`, `sidebarName`, `sidebarRole` elements exist in HTML

**Problem:** "My Approvals" still visible for faculty
- **Solution:** Clear browser cache and localStorage, then reload

**Problem:** Redirected to wrong page
- **Solution:** Check database `users.role` value, should be lowercase: 'faculty', 'area-chair', etc.

## Summary

**7 HTML files to update:**
1. user-dashboard.html
2. user-documents.html
3. user-upload.html
4. user-evidence-map.html
5. user-search.html
6. user-approvals.html
7. user-profile.html

**Pattern for each:**
```html
<script src="js/user-session.js"></script>
<script src="js/[page-name].js"></script>
</body>
</html>
```

**That's it!** Once you add these scripts, everything should work automatically.
