# Database Migration: Update area-chair to department-head

## Overview
This migration removes the `area-chair` role and replaces it with `department-head` while maintaining all permissions and workflow functionality.

## Step 1: Backup Your Database
**IMPORTANT: Always backup before making schema changes!**

```sql
-- Create a backup of your database
mysqldump -u root -p drms_db > drms_db_backup_$(date +%Y%m%d).sql
```

## Step 2: Run the SQL Migration Script

Open MySQL command line or phpMyAdmin and execute the following commands:

```sql
-- ============================================================================
-- Migration Script: Update area-chair role to department-head
-- ============================================================================

-- Step 1: Update all existing users with 'area-chair' role to 'department-head'
UPDATE users 
SET role = 'department-head' 
WHERE role = 'area-chair';

-- Step 2: Verify the update
SELECT id, email, firstName, lastName, role 
FROM users 
WHERE role = 'department-head';

-- Step 3: Update the ENUM to remove 'area-chair' and keep 'department-head'
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'dean', 'department-head', 'faculty', 'evaluator') NOT NULL;

-- Step 4: Verify the table structure
DESCRIBE users;

-- Step 5: Check for any remaining references (should return 0 rows)
SELECT COUNT(*) as area_chair_count 
FROM users 
WHERE role = 'area-chair';
```

## Step 3: Verify Backend Changes

The following backend files have been updated to support both `area-chair` (for backward compatibility) and `department-head`:

### Updated Files:
1. **node/routes/approvals.js** - All approval workflow functions
2. **node/routes/admin.js** - User creation and management
3. **node/routes/auth.js** - Registration validation
4. **node/routes/documents.js** - Document upload and viewing permissions

### Key Changes:
- `canApprove()` function now accepts both roles
- All role checks include both `area-chair` and `department-head`
- Department requirement checks updated
- Access control maintains same permissions

## Step 4: Verify Frontend Changes

The following frontend files have been updated:

### Updated Files:
1. **js/user-approvals.js** - Access control for approvals page
2. **js/user-session.js** - Role display mapping
3. **js/users.js** - Role display in user management
4. **js/documents.js** - Role display in documents
5. **js/profile.js** - Role display in profile
6. **users.html** - Role dropdown options
7. **registration.html** - Role selection
8. **user-approvals.html** - Sidebar labels

### Display Names:
- Database value: `department-head`
- Display name: `Dept. Head`
- Old value `area-chair` is mapped to display as `Dept. Head` for backward compatibility

## Step 5: Test the Migration

### Test Checklist:
- [ ] Existing department-head users can log in
- [ ] Department-head users can access user-approvals page
- [ ] Department-head users can validate documents
- [ ] Department-head users can lock documents
- [ ] Department-head users can reject documents
- [ ] Department-head users see correct role in sidebar
- [ ] New users can register as Dept. Head
- [ ] Admin can create Dept. Head users
- [ ] Role displays as "Dept. Head" throughout the application

### Test Commands:
```sql
-- Check all users with department-head role
SELECT id, email, firstName, lastName, role, status 
FROM users 
WHERE role = 'department-head';

-- Check if any area-chair references remain
SELECT id, email, role 
FROM users 
WHERE role = 'area-chair';

-- Verify ENUM values
SHOW COLUMNS FROM users LIKE 'role';
```

## Step 6: Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Add area-chair back to ENUM
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'dean', 'area-chair', 'department-head', 'faculty', 'evaluator') NOT NULL;

-- Convert department-head back to area-chair
UPDATE users 
SET role = 'area-chair' 
WHERE role = 'department-head';

-- Remove department-head from ENUM
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'dean', 'area-chair', 'faculty', 'evaluator') NOT NULL;
```

## Permissions Summary

### Department Head (department-head) Can:
✅ Access user-approvals page
✅ Validate documents (pending → validated)
✅ Reject documents with comments
✅ Lock approved documents
✅ View documents from their department
✅ Upload documents
✅ See department-scoped statistics

### Department Head Cannot:
❌ Approve documents (only Dean/Admin can approve)
❌ Unlock locked documents (only Admin can unlock)
❌ Access admin-only features
❌ Manage users (only Admin can)

## Notes

1. **Backward Compatibility**: The backend code supports both `area-chair` and `department-head` to ensure smooth transition.

2. **Display Consistency**: All frontend displays show "Dept. Head" regardless of whether the database value is `area-chair` or `department-head`.

3. **Database Integrity**: The migration preserves all user data, documents, and relationships.

4. **No Data Loss**: Documents uploaded by area-chair users remain intact and accessible.

5. **Session Handling**: Existing logged-in users may need to log out and log back in to see updated role displays.

## Troubleshooting

### Issue: Users can't log in after migration
**Solution**: Check if the role value in database matches the ENUM values. Run:
```sql
SELECT role FROM users WHERE email = 'user@example.com';
SHOW COLUMNS FROM users LIKE 'role';
```

### Issue: Role displays as "area-chair" instead of "Dept. Head"
**Solution**: Clear browser cache and localStorage, then refresh the page.

### Issue: Department Head can't access approvals page
**Solution**: Verify the role in database is exactly `department-head` (lowercase with hyphen):
```sql
UPDATE users SET role = 'department-head' WHERE email = 'user@example.com';
```

## Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check the Node.js server logs for backend errors
3. Verify database role values match ENUM exactly
4. Ensure all backend files have been updated
5. Clear browser cache and localStorage

## Migration Complete! ✅

After completing all steps, your system will:
- Display "Dept. Head" instead of "Area Chair"
- Support the new `department-head` role
- Maintain all existing permissions and workflows
- Be backward compatible with any remaining `area-chair` references
