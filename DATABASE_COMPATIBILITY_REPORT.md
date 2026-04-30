# DATABASE COMPATIBILITY REPORT
## DRMS-QA System vs drms_db.sql Schema Analysis

**Date**: 2026-04-29  
**Status**: ⚠️ CRITICAL MISMATCHES FOUND

---

## 🔴 CRITICAL ISSUES

### 1. **users.role ENUM Mismatch**
**Database Schema**:
```sql
`role` enum('admin','dean','area-chair','faculty','evaluator')
```

**System Uses** (from conversation history):
- `Faculty Member`
- `Area Chair/Program Head`
- `Dean`
- `QA Coordinator`
- `External Evaluator`
- `admin`

**Impact**: ❌ BLOCKING - Users cannot be created with full role names
**Fix Required**: Update ENUM to match system or change system to use short codes

---

### 2. **documents.category Mismatch**
**Database Schema**:
```sql
`category` varchar(50) NOT NULL
```
**Values in DB**: `iso`, `aaccup`, `coe`

**System Uses** (from upload.html):
- `instruction`
- `research`
- `extension`
- `employment`

**Impact**: ❌ BLOCKING - Document uploads will fail or use wrong categories
**Fix Required**: Align category values between upload form and database

---

### 3. **documents.area Field**
**Database Schema**:
```sql
`area` varchar(120) NOT NULL
```

**System Uses** (from upload.js):
- ISO: `clause4`, `clause5`, `clause6`, `clause7`, `clause8`, `clause9`, `clause10`
- AACCUP: `area1` through `area10`
- COE: `indicator1` through `indicator7`

**Status**: ✅ COMPATIBLE (but depends on category fix)

---

### 4. **Missing department Field in users Table**
**Database Schema**: ❌ NOT PRESENT in `users` table

**System Uses**:
- users.js displays `user.department`
- admin.js queries for department
- User profile shows department

**Impact**: ⚠️ HIGH - Department filtering and display will fail
**Fix Required**: Add `department` VARCHAR(255) to users table OR always join with faculty_profiles

---

### 5. **Missing evaluatorExpiresAt in users Table**
**Database Schema**: ❌ NOT PRESENT in `users` table  
**Separate Table**: `evaluator_access_limits` exists with `expiresAt`

**System Uses**:
- users.js checks `user.evaluatorExpiresAt`
- admin.js creates users with `evaluatorExpiresAt`

**Impact**: ⚠️ MEDIUM - Evaluator expiry tracking broken
**Fix Required**: Either add field to users table OR update queries to join evaluator_access_limits

---

### 6. **faculty_profiles Missing Fields**
**Database Has**: 26 fields including dateOfBirth, age, gender, etc.

**System May Need** (from user-profile.html context):
- `dateOfHire` - ❌ NOT IN DATABASE
- `yearsOfService` - ❌ NOT IN DATABASE (calculated field)

**Impact**: ⚠️ MEDIUM - Profile save/load may fail for these fields
**Fix Required**: Add dateOfHire DATE field to faculty_profiles

---

## 🟡 COMPATIBILITY WARNINGS

### 7. **documents Table - Unused Fields**
**Database Has**:
- `category_id` INT (FK to categories table)
- `department_id` INT (FK to departments table)
- `category_name` VARCHAR(50)
- `department_code` VARCHAR(10)

**System Uses**:
- Only `category` (string) and `area` (string)
- Does NOT use category_id or department_id

**Impact**: ⚠️ LOW - Redundant fields, potential data inconsistency
**Recommendation**: Either use FK relationships OR remove unused fields

---

### 8. **categories Table Not Used**
**Database Has**: Full `categories` table with:
- instruction, research, extension, employment

**System**: Does NOT query this table, uses hardcoded values

**Impact**: ⚠️ LOW - Database normalization not utilized
**Recommendation**: Update system to query categories table for dropdown options

---

### 9. **departments Table Not Used**
**Database Has**: Full `departments` table with:
- BEED, BSED, BSNED, BCAED, BPED

**System**: Does NOT query this table, uses hardcoded values

**Impact**: ⚠️ LOW - Database normalization not utilized
**Recommendation**: Update system to query departments table for dropdown options

---

## 🟢 COMPATIBLE FEATURES

### ✅ Working Correctly:
1. **users table** - Basic fields (id, email, password, firstName, lastName, middleInitial, status, isVerified, lastActive, createdAt)
2. **faculty_profiles table** - Core profile fields
3. **documents table** - Basic document metadata
4. **document_files table** - File storage and linking
5. **otps table** - OTP verification system
6. **approval_workflow table** - Approval tracking structure
7. **audit_logs table** - Audit trail structure
8. **notifications table** - Notification system structure

---

## 📋 REQUIRED DATABASE MIGRATIONS

### Migration 1: Fix users.role ENUM
```sql
ALTER TABLE users 
MODIFY COLUMN role VARCHAR(100) DEFAULT 'Faculty Member';

-- Update existing data
UPDATE users SET role = 'Faculty Member' WHERE role = 'faculty';
UPDATE users SET role = 'Area Chair/Program Head' WHERE role = 'area-chair';
UPDATE users SET role = 'External Evaluator' WHERE role = 'evaluator';
UPDATE users SET role = 'Dean' WHERE role = 'dean';
-- admin stays as 'admin'
```

### Migration 2: Add department to users table
```sql
ALTER TABLE users 
ADD COLUMN department VARCHAR(255) DEFAULT NULL AFTER role;

-- Populate from faculty_profiles
UPDATE users u
INNER JOIN faculty_profiles fp ON u.id = fp.user_id
SET u.department = fp.department;
```

### Migration 3: Add evaluatorExpiresAt to users table
```sql
ALTER TABLE users 
ADD COLUMN evaluatorExpiresAt DATETIME DEFAULT NULL AFTER department;

-- Populate from evaluator_access_limits
UPDATE users u
INNER JOIN evaluator_access_limits eal ON u.id = eal.user_id
SET u.evaluatorExpiresAt = eal.expiresAt;
```

### Migration 4: Add dateOfHire to faculty_profiles
```sql
ALTER TABLE faculty_profiles 
ADD COLUMN dateOfHire DATE DEFAULT NULL AFTER employmentStatus;
```

### Migration 5: Align document categories (CHOOSE ONE APPROACH)

**Option A: Use new categories (instruction, research, extension, employment)**
```sql
-- Already exists in categories table, just need to update documents
UPDATE documents SET category = 'instruction' WHERE category = 'iso';
UPDATE documents SET category = 'research' WHERE category = 'aaccup';
UPDATE documents SET category = 'extension' WHERE category = 'coe';
-- Add employment category documents as needed
```

**Option B: Keep old categories (iso, aaccup, coe)**
```sql
-- Update upload.html and upload.js to use:
-- iso, aaccup, coe instead of instruction, research, extension, employment
```

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Critical Fixes (IMMEDIATE)
1. ✅ Run Migration 1 (users.role ENUM fix) - **ALREADY DONE per conversation history**
2. ⚠️ Run Migration 2 (add department to users)
3. ⚠️ Run Migration 3 (add evaluatorExpiresAt to users)
4. ⚠️ Decide on category approach and run Migration 5

### Phase 2: Profile Enhancements (HIGH PRIORITY)
1. Run Migration 4 (add dateOfHire to faculty_profiles)
2. Update user-profile.js to handle dateOfHire field
3. Test profile save/load functionality

### Phase 3: Optimization (MEDIUM PRIORITY)
1. Update system to query categories table instead of hardcoding
2. Update system to query departments table instead of hardcoding
3. Implement proper FK relationships for documents.category_id and documents.department_id

### Phase 4: Cleanup (LOW PRIORITY)
1. Remove unused fields from documents table (category_name, department_code)
2. Deprecate evaluator_access_limits table (data moved to users table)
3. Add indexes for performance optimization

---

## 📊 SYSTEM FILES AFFECTED

### Files Using Incompatible Fields:
1. **js/users.js** - Uses user.department, user.evaluatorExpiresAt
2. **js/upload.js** - Uses instruction/research/extension/employment categories
3. **js/user-profile.js** - Uses dateOfHire, yearsOfService
4. **node/routes/admin.js** - Creates users with department and evaluatorExpiresAt
5. **node/routes/user.js** - Queries user.department
6. **node/routes/documents.js** - Handles document categories

### Files That Need Updates After Migration:
1. **upload.html** - Category dropdown options
2. **upload.js** - Category-to-area mapping
3. **documents.js** - Category filtering
4. **user-profile.html** - Date of hire field
5. **user-profile.js** - Date of hire handling

---

## ✅ VERIFICATION CHECKLIST

After running migrations, verify:
- [ ] Users can be created with full role names (Faculty Member, etc.)
- [ ] Department field displays correctly in users.html
- [ ] Evaluator expiry dates show correctly
- [ ] Documents can be uploaded with correct categories
- [ ] Profile date of hire saves and loads correctly
- [ ] All existing data migrated successfully
- [ ] No foreign key constraint violations
- [ ] Application starts without errors

---

## 🔧 QUICK FIX SQL SCRIPT

```sql
-- Run this complete migration script
USE drms_db;

-- 1. Fix role ENUM
ALTER TABLE users MODIFY COLUMN role VARCHAR(100) DEFAULT 'Faculty Member';

-- 2. Add department
ALTER TABLE users ADD COLUMN department VARCHAR(255) DEFAULT NULL AFTER role;
UPDATE users u INNER JOIN faculty_profiles fp ON u.id = fp.user_id SET u.department = fp.department;

-- 3. Add evaluatorExpiresAt
ALTER TABLE users ADD COLUMN evaluatorExpiresAt DATETIME DEFAULT NULL AFTER department;
UPDATE users u INNER JOIN evaluator_access_limits eal ON u.id = eal.user_id SET u.evaluatorExpiresAt = eal.expiresAt;

-- 4. Add dateOfHire
ALTER TABLE faculty_profiles ADD COLUMN dateOfHire DATE DEFAULT NULL AFTER employmentStatus;

-- 5. Verify changes
DESCRIBE users;
DESCRIBE faculty_profiles;
SELECT id, email, role, department, evaluatorExpiresAt FROM users LIMIT 5;
```

---

**END OF REPORT**
