# Evaluator Expiry - Testing & Verification Guide

## Test Data Updated

### SQL File Change
**File**: `node/drms_db.sql`

**Changed**:
```sql
-- OLD (Future date - NOT expired)
INSERT INTO `evaluator_access_limits` (`id`, `user_id`, `expiresAt`, `createdAt`, `updatedAt`) VALUES
(10, 71, '2026-05-13 00:05:00', '2026-05-11 18:40:55', '2026-05-11 18:40:55');

-- NEW (Past date - EXPIRED)
INSERT INTO `evaluator_access_limits` (`id`, `user_id`, `expiresAt`, `createdAt`, `updatedAt`) VALUES
(10, 71, '2024-01-01 00:00:00', '2026-05-11 18:40:55', '2026-05-11 18:40:55');
```

### Test Evaluator Account
- **User ID**: 71
- **Email**: q1guilmar@gmail.com
- **Role**: evaluator
- **Expiry Date**: 2024-01-01 00:00:00 (EXPIRED)
- **Status**: This account should be BLOCKED from all access

---

## How to Test

### Step 1: Reset Database (If Needed)
```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE IF EXISTS drms_db;
CREATE DATABASE drms_db;
exit

# Import updated SQL file
mysql -u root -p drms_db < node/drms_db.sql
```

### Step 2: Test Login Prevention
1. Go to login page
2. Try to login with expired evaluator:
   - Email: `q1guilmar@gmail.com`
   - Password: (whatever is set in database)
3. **Expected Result**: 
   - ❌ Login should FAIL
   - Error message: "Your External Evaluator access has expired. Please contact the administrator."
   - Should NOT receive OTP
   - Should NOT be able to proceed

### Step 3: Test Users Page Display
1. Login as Admin
2. Go to Users page
3. Look for the evaluator account (q1guilmar@gmail.com)
4. **Expected Result**:
   - Status badge should show "EXPIRED" in red
   - Department column should show expiry date with "⚠️ EXPIRED" warning
   - Total count should show "(1 expired)" in red text
   - User should be clearly marked as expired

### Step 4: Test Direct Page Access (If Somehow Has Token)
1. If evaluator somehow has a token in localStorage
2. Try to access any evaluator page directly
3. **Expected Result**:
   - Immediate redirect to landing.html
   - Alert: "Your External Evaluator access has expired..."
   - localStorage cleared
   - Cannot view any content

### Step 5: Test API Requests
1. Try to make any API request with expired evaluator token
2. **Expected Result**:
   - 403 Forbidden response
   - Response body: `{ "msg": "...", "expired": true }`
   - Request blocked by middleware

---

## What Should Happen

### ✅ Correct Behavior

#### On Login Attempt:
```
User enters credentials
↓
Backend checks evaluator_access_limits table
↓
Finds expiresAt = 2024-01-01 (past date)
↓
Returns 403 error
↓
Login page shows error message
↓
User CANNOT login
```

#### On Users Page:
```
Admin views users list
↓
Backend joins evaluator_access_limits table
↓
Returns evaluatorExpiresAt field
↓
Frontend checks: new Date('2024-01-01') < new Date()
↓
Shows "EXPIRED" badge in red
↓
Shows expiry date with warning icon
↓
Counts expired evaluators in total
```

#### On Page Access:
```
Evaluator tries to access page
↓
evaluator-session.js runs checkEvaluatorAccess()
↓
API call to /api/admin/evaluator/access-expiry/:userId
↓
Backend checks expiry
↓
Returns expired: true
↓
Frontend shows alert and redirects
↓
localStorage cleared
```

#### On API Request:
```
Request sent with token
↓
Middleware auth() function runs
↓
Checks evaluator_access_limits table
↓
Finds expired date
↓
Returns 403 with expired: true
↓
Request blocked
```

---

## Verification Checklist

### Backend Verification
- [ ] `evaluator_access_limits` table exists
- [ ] Test data has user_id 71 with expired date
- [ ] Login route checks expiry (auth.js line ~180)
- [ ] Middleware checks expiry (auth.js middleware)
- [ ] Users API returns evaluatorExpiresAt field

### Frontend Verification
- [ ] evaluator-session.js has checkEvaluatorAccess()
- [ ] users.js checks isExpired condition
- [ ] users.js shows EXPIRED badge
- [ ] users.js shows expiry date in department column
- [ ] users.js counts expired evaluators

### Integration Testing
- [ ] Cannot login with expired account
- [ ] Users page shows expired status
- [ ] Direct page access blocked
- [ ] API requests blocked
- [ ] Heartbeat detects expiry

---

## Troubleshooting

### Issue: Can Still Login
**Check**:
1. Is database updated with expired date?
   ```sql
   SELECT * FROM evaluator_access_limits WHERE user_id = 71;
   ```
2. Is backend checking expiry in login route?
3. Is the date actually in the past?

**Fix**: Verify SQL file imported correctly

### Issue: Users Page Doesn't Show Expired
**Check**:
1. Is backend returning evaluatorExpiresAt?
   - Check Network tab in browser
   - Look at /api/admin/users response
2. Is frontend checking the date?
   - Check browser console for errors
3. Is the date format correct?

**Fix**: Verify users.js has expiry checking code

### Issue: Can Access Pages After Expiry
**Check**:
1. Is evaluator-session.js loaded?
2. Is checkEvaluatorAccess() running?
3. Check browser console for errors
4. Is API endpoint responding?

**Fix**: Clear browser cache and localStorage

---

## Expected UI Display

### Users Page - Expired Evaluator Row

```
┌─────────────────────────────────────────────────────────────────┐
│ Name: Jelmar Kemba                                              │
│ Email: q1guilmar@gmail.com                                      │
│ Role: External Evaluator                                        │
│ Department: ⚠️ Expires: Jan 1, 2024 (EXPIRED)                  │
│ Status: [EXPIRED] (red badge)                                   │
│ Actions: [Edit] [Delete]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Users Page - Header Stats

```
Total Users: 5 total (1 expired)  ← Red text
Active: 4
Pending: 0
```

### Login Page - Error Message

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Login Failed                                               │
│                                                                  │
│  Your External Evaluator access has expired.                    │
│  Please contact the administrator.                              │
│                                                                  │
│  [OK]                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Queries for Testing

### Check Evaluator Expiry
```sql
SELECT 
    u.id,
    u.email,
    u.role,
    eal.expiresAt,
    CASE 
        WHEN eal.expiresAt < NOW() THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END AS status
FROM users u
LEFT JOIN evaluator_access_limits eal ON u.id = eal.user_id
WHERE u.role = 'evaluator';
```

### Manually Set Expiry to Past
```sql
UPDATE evaluator_access_limits 
SET expiresAt = '2024-01-01 00:00:00' 
WHERE user_id = 71;
```

### Manually Set Expiry to Future
```sql
UPDATE evaluator_access_limits 
SET expiresAt = '2026-12-31 23:59:59' 
WHERE user_id = 71;
```

### Check All Expired Evaluators
```sql
SELECT 
    u.email,
    u.firstName,
    u.lastName,
    eal.expiresAt,
    DATEDIFF(NOW(), eal.expiresAt) AS days_expired
FROM users u
INNER JOIN evaluator_access_limits eal ON u.id = eal.user_id
WHERE u.role = 'evaluator' 
AND eal.expiresAt < NOW()
ORDER BY eal.expiresAt DESC;
```

---

## Summary

### What Was Fixed
1. ✅ SQL test data updated to have expired evaluator
2. ✅ Backend already has 4-layer protection
3. ✅ Frontend already has expiry checking
4. ✅ Users page already shows expiry status

### What You Need to Do
1. **Import updated SQL file** to database
2. **Test login** with expired evaluator
3. **Check users page** shows expired status
4. **Verify** all protection layers work

### Expected Outcome
- ❌ Expired evaluator CANNOT login
- ❌ Expired evaluator CANNOT access pages
- ❌ Expired evaluator CANNOT make API requests
- ✅ Users page SHOWS expired status clearly
- ✅ Admin can see which evaluators are expired

The system is fully protected - you just need to import the updated SQL file with the expired test data! 🔒
