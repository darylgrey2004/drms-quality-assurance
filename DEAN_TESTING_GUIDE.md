# Dean Data Fetching Test

## Quick Test for Dean Users

### Step 1: Login as Dean
1. Go to landing page
2. Login with Dean credentials
3. Navigate to Documents page

### Step 2: Open Browser Console
- Press `F12` or Right-click → Inspect
- Click on "Console" tab

### Step 3: Run Test Commands

Copy and paste these commands one by one into the console:

```javascript
// Test 1: Check role
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('Current Role:', user.role);
console.log('Expected: dean');
```

```javascript
// Test 2: Check total documents loaded
console.log('Total Documents Loaded:', allDocuments.length);
console.log('Expected: Should see documents from ALL departments');
```

```javascript
// Test 3: Check which departments are represented
const depts = [...new Set(allDocuments.map(d => d.department_code))].filter(d => d);
console.log('Departments Represented:', depts);
console.log('Expected: [BEED, BSED, BSNED, BCAED, BPED] or subset depending on data');
```

```javascript
// Test 4: Count documents by department
const deptCounts = {};
allDocuments.forEach(doc => {
  const dept = doc.department_code || 'Unknown';
  deptCounts[dept] = (deptCounts[dept] || 0) + 1;
});
console.table(deptCounts);
console.log('Expected: Should see counts for multiple departments');
```

```javascript
// Test 5: Check if scope parameter was used
console.log('Check Network tab for the API call to /api/documents');
console.log('URL should include: ?scope=all');
```

### Step 4: Verify Results

#### ✅ PASS Criteria:
- Role shows as "dean"
- Total documents > 0
- Multiple departments shown (BEED, BSED, etc.)
- Department counts show data from different departments

#### ❌ FAIL Criteria:
- Role is not "dean"
- Total documents = 0
- Only ONE department shown
- All documents from same department

### Step 5: Test on Other Pages

#### Approvals Page:
```javascript
// On approvals.html page
console.log('Approval Documents:', allDocuments.length);
const approvalDepts = [...new Set(allDocuments.map(d => d.department_code))];
console.log('Departments in Approvals:', approvalDepts);
```

#### Homepage (Dashboard):
- Check if statistics show college-wide data
- Verify department breakdown shows all departments
- Charts should include data from all departments

### Common Issues and Solutions

#### Issue 1: "allDocuments is not defined"
**Solution:** You're on the wrong page or documents haven't loaded yet. Wait for page to fully load.

#### Issue 2: Only seeing one department
**Solution:** 
1. Check console for "Fetching documents with scope:" message
2. Should say "?scope=all"
3. If not, clear browser cache and reload

#### Issue 3: Seeing 0 documents
**Solution:**
1. Check if there are any documents in the database
2. Verify Dean account is approved (status = 'approved')
3. Check backend logs for errors

### Backend Verification

If frontend tests fail, verify backend:

1. **Check Database:**
```sql
-- Count total documents
SELECT COUNT(*) as total FROM documents;

-- Count by department
SELECT department_code, COUNT(*) as count 
FROM documents 
GROUP BY department_code;
```

2. **Check Backend Logs:**
- Look at Node.js terminal
- Should see: "GET /api/documents?scope=all"
- Should NOT see any 403 or 401 errors

3. **Test API Directly:**
```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -H "x-auth-token: YOUR_TOKEN" http://localhost:3000/api/documents?scope=all
```

### Expected Behavior Summary

| Page | What Dean Should See |
|------|---------------------|
| Documents | ALL documents from ALL departments |
| Approvals | ALL pending/validated documents from ALL departments |
| Dashboard | College-wide statistics across ALL departments |
| Search | Search results from ALL departments |
| Evidence Map | ALL document mappings from ALL departments |
| Reports | College-level reports with ALL departments |
| Users | ALL users (read-only) |
| Audit Trail | ALL activity logs (read-only) |

### Report Results

After running tests, report:
1. ✅ or ❌ for each test
2. Console output screenshots
3. Any error messages
4. Which pages work vs don't work

### Quick Fix if Tests Fail

1. **Clear browser cache:** Ctrl + Shift + Delete
2. **Hard refresh:** Ctrl + F5
3. **Re-login:** Logout and login again
4. **Check backend:** Ensure Node.js server is running
5. **Verify database:** Ensure documents exist in database

### Success Indicators

You'll know it's working when:
- ✅ Console shows "Fetching documents with scope: ?scope=all"
- ✅ Multiple departments appear in the list
- ✅ Document count matches database total
- ✅ Can see documents uploaded by other users
- ✅ Can see documents from all 5 departments (if they exist)

### Still Not Working?

If tests still fail after trying fixes:
1. Take screenshots of console output
2. Copy any error messages
3. Check backend terminal for errors
4. Verify Dean account role in database:
   ```sql
   SELECT id, email, role, status FROM users WHERE role = 'dean';
   ```
5. Report findings with screenshots
