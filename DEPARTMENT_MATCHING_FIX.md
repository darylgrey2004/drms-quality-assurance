# Department Matching Fix

## Problem Identified

Your Dept. Head's faculty profile has:
```
department: 'Bachelor of Elementary Education (BEED)'
```

But the `departments` table doesn't have a matching entry.

## Step 1: Check Your Departments Table

Run this SQL query to see what departments exist:

```sql
SELECT id, code, name FROM departments WHERE is_active = 1;
```

## Step 2: Check Your Dept. Head's Faculty Profile

```sql
SELECT user_id, department FROM faculty_profiles WHERE user_id = 63;
```

## Step 3: Check the Document's Department

```sql
SELECT id, title, department_id, department_code FROM documents WHERE id = 28;
```

## Solutions

### Option A: Update Faculty Profile to Match Departments Table

If your departments table has an entry like:
```
id: 1, code: 'BEED', name: 'Elementary Education'
```

Then update your faculty profile:
```sql
UPDATE faculty_profiles 
SET department = 'BEED'  -- Use the CODE from departments table
WHERE user_id = 63;
```

OR use the full name:
```sql
UPDATE faculty_profiles 
SET department = 'Elementary Education'  -- Use the NAME from departments table
WHERE user_id = 63;
```

### Option B: Add Missing Department to Departments Table

If 'Bachelor of Elementary Education (BEED)' should be in the departments table:

```sql
INSERT INTO departments (code, name, is_active, created_at, updated_at)
VALUES ('BEED', 'Bachelor of Elementary Education (BEED)', 1, NOW(), NOW());
```

Then check the new department_id:
```sql
SELECT id FROM departments WHERE code = 'BEED';
```

### Option C: Update Document's Department

If the document should belong to a different department:

```sql
-- First, find the correct department_id
SELECT id, code, name FROM departments;

-- Then update the document
UPDATE documents 
SET department_id = 1  -- Replace with correct department_id
WHERE id = 28;
```

## Recommended Solution

Based on your logs, I recommend **Option A**:

1. Check what departments exist:
   ```sql
   SELECT id, code, name FROM departments;
   ```

2. Find the department with id = 1 (since document has department_id = 1):
   ```sql
   SELECT id, code, name FROM departments WHERE id = 1;
   ```

3. Update your faculty profile to match:
   ```sql
   UPDATE faculty_profiles 
   SET department = 'CODE_FROM_STEP_2'  -- Use the code or name from step 2
   WHERE user_id = 63;
   ```

## After Fixing

1. Restart your Node.js server
2. Clear browser cache (Ctrl+F5)
3. Try clicking Comments and Delete buttons again
4. Check server logs to confirm it works

## Expected Server Logs (After Fix)

```
=== COMMENTS REQUEST ===
Document ID: 28
User ID: 63
User Role (raw): department-head
Normalized Role: department-head
Document: { uploader_id: null, department_id: 1 }
Authorization checks: { viewAll: false, isDeptHead: true, isOwner: false }
Checking Dept. Head department...
Faculty profile: [ { department: 'BEED' } ]
Dept. Head department value: BEED
Department lookup result: [ { id: 1 } ]
Authorized: Dept. Head of same department
Final authorization: true
```
