# Testing Guide: Dept. Head Authorization Debug

## Changes Made

### 1. Fixed `isDeptHead` Check in DELETE Endpoint
**Problem**: Was only checking `normalizedRole === 'department-head'`
**Fix**: Now checks `normalizedRole === 'area-chair' || normalizedRole === 'department-head'`

### 2. Added Detailed Console Logging
Both endpoints now log:
- User ID and Role (raw and normalized)
- Document details (ID, uploader_id, department_id, status)
- Authorization checks (isAdmin, isDeptHead, isOwner, etc.)
- Faculty profile lookup results
- Department matching results
- Final authorization decision

## Testing Steps

### Step 1: Restart Node.js Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
cd node
node server.js
```

### Step 2: Clear Browser Cache
- Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear cache in browser settings

### Step 3: Test Comments Button
1. Login as Dept. Head
2. Navigate to user-documents.html
3. Find a rejected document from your department
4. Open browser console (F12)
5. Click "Comments" button
6. **Check console logs** for:
   ```
   === COMMENTS REQUEST ===
   Document ID: X
   User ID: Y
   User Role (raw): [your role value]
   Normalized Role: [normalized value]
   Document: { uploader_id: ..., department_id: ... }
   Authorization checks: { viewAll: ..., isDeptHead: ..., isOwner: ... }
   ```

### Step 4: Test Delete Button
1. Still logged in as Dept. Head
2. Find a rejected document from your department
3. Click "Delete" button
4. Confirm deletion
5. **Check console logs** for:
   ```
   === DELETE REQUEST ===
   Document ID: X
   User ID: Y
   User Role (raw): [your role value]
   Normalized Role: [normalized value]
   Document: { id: ..., uploader_id: ..., department_id: ..., workflow_status: ... }
   Authorization checks: { isAdmin: ..., isDeptHead: ..., isOwner: ..., isDraft: ..., isRejected: ... }
   ```

## What to Look For in Logs

### Check 1: User Role Value
```
User Role (raw): area-chair  OR  department-head
Normalized Role: area-chair  OR  department-head
```
**Expected**: Should be one of these two values
**If different**: Your user's role in the database is not set correctly

### Check 2: isDeptHead Flag
```
Authorization checks: { ..., isDeptHead: true, ... }
```
**Expected**: `isDeptHead: true`
**If false**: Role normalization issue

### Check 3: Faculty Profile
```
Faculty profile: [ { department: 'BSIT' } ]  OR  [ { department: 'Information Technology' } ]
```
**Expected**: Should return a row with department value
**If empty array**: User has no faculty_profiles entry

### Check 4: Department Lookup
```
Department lookup result: [ { id: 1 } ]
```
**Expected**: Should return a row with department id
**If empty array**: Department name/code doesn't match departments table

### Check 5: Department Match
```
Authorized: Dept. Head of same department
```
**OR**
```
NOT Authorized: Department mismatch { deptHeadDeptId: 1, documentDeptId: 2 }
```
**Expected**: Should see "Authorized" message
**If mismatch**: Document's department_id doesn't match Dept. Head's department_id

## Common Issues and Solutions

### Issue 1: Role is not 'area-chair' or 'department-head'
**Solution**: Update user's role in database
```sql
UPDATE users SET role = 'department-head' WHERE id = YOUR_USER_ID;
```

### Issue 2: No faculty profile found
**Solution**: Create faculty profile entry
```sql
INSERT INTO faculty_profiles (user_id, department, created_at, updated_at)
VALUES (YOUR_USER_ID, 'BSIT', NOW(), NOW());
```

### Issue 3: Department name doesn't match
**Check departments table**:
```sql
SELECT * FROM departments;
```
**Update faculty_profiles to match**:
```sql
UPDATE faculty_profiles 
SET department = 'EXACT_DEPARTMENT_CODE_OR_NAME'
WHERE user_id = YOUR_USER_ID;
```

### Issue 4: Document has NULL department_id
**Solution**: Update document's department_id
```sql
-- First, find the correct department_id
SELECT id, code, name FROM departments;

-- Then update the document
UPDATE documents 
SET department_id = CORRECT_DEPT_ID
WHERE id = DOCUMENT_ID;
```

## Expected Console Output (Success Case)

### Comments Request (Success)
```
=== COMMENTS REQUEST ===
Document ID: 123
User ID: 45
User Role (raw): department-head
Normalized Role: department-head
Document: { uploader_id: 67, department_id: 1 }
Authorization checks: { viewAll: false, isDeptHead: true, isOwner: false }
Checking Dept. Head department...
Faculty profile: [ { department: 'BSIT' } ]
Dept. Head department value: BSIT
Department lookup result: [ { id: 1 } ]
Authorized: Dept. Head of same department
Final authorization: true
Comments data: { comments: [...] }
```

### Delete Request (Success)
```
=== DELETE REQUEST ===
Document ID: 123
User ID: 45
User Role (raw): department-head
Normalized Role: department-head
Document: { id: 123, uploader_id: 67, department_id: 1, workflow_status: 'rejected' }
Authorization checks: { isAdmin: false, isDeptHead: true, isOwner: false, isDraft: false, isRejected: true }
Checking Dept. Head department...
Faculty profile: [ { department: 'BSIT' } ]
Dept. Head department value: BSIT
Department lookup result: [ { id: 1 } ]
Authorized: Dept. Head of same department
Final authorization: true
Delete success: { msg: 'Document deleted successfully' }
```

## Next Steps After Testing

1. **Copy the console logs** from your browser
2. **Share the logs** so we can identify the exact issue
3. Based on the logs, we'll know if it's:
   - Role value issue
   - Faculty profile missing
   - Department name mismatch
   - Department ID mismatch
   - Something else

## Files Modified

1. `node/routes/documents.js`
   - Fixed `isDeptHead` check in DELETE endpoint
   - Added detailed logging to both endpoints

2. `js/user-documents.js`
   - Added detailed logging to delete function
   - Improved error handling

## Remove Logging Later

Once the issue is fixed, we can remove the console.log statements for production:
- Search for `console.log('===` in documents.js
- Remove all debug logging blocks
- Keep only error logging (console.error)
