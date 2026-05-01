# Role-Based Registration & Dashboard Redirect Fix

## Problem Identified

When users registered with a specific role (e.g., area-chair/program head), they were being redirected to the wrong dashboard after login. Specifically:
- Users registering as "area-chair" were redirected to `homepage.html` (admin dashboard) instead of `user-dashboard.html`
- The backend registration endpoint was not saving the `role` field from the registration form
- No role-based access control existed on dashboard pages

## Root Cause

1. **Backend Issue**: The `/api/auth/register` endpoint in `node/routes/auth.js` was not accepting or saving the `role` field
2. **Missing Validation**: No validation of role values against database ENUM
3. **No Access Control**: Dashboard pages (homepage.html, user-dashboard.html) had no role-based access control

## Solution Implemented

### 1. Backend Registration Fix (`node/routes/auth.js`)

**Changes:**
- Added `role` parameter to registration endpoint
- Added validation to ensure role matches database ENUM values: `['admin', 'dean', 'area-chair', 'faculty', 'evaluator']`
- Included `role` and `middleInitial` in the user insert query
- Added proper error handling for invalid roles

**Code:**
```javascript
router.post('/register', async (req, res) => {
  const { firstName, lastName, middleInitial, email, password, role } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Validate role against ENUM values
  const validRoles = ['admin', 'dean', 'area-chair', 'faculty', 'evaluator'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ msg: 'Invalid role selected' });
  }

  // ... rest of registration logic with role included
});
```

### 2. User Dashboard Access Control (`js/user-dashboard.js`)

**Changes:**
- Added role validation on page load
- Redirect admin/dean to `homepage.html`
- Redirect evaluator to `evaluator-dashboard.html`
- Only allow faculty and area-chair to access user-dashboard.html
- Clear localStorage and redirect to login if invalid role

**Code:**
```javascript
// Validate user role - only faculty, area-chair should access user-dashboard
const role = (user.role || '').toLowerCase().trim();
const allowedRoles = ['faculty', 'area-chair'];

// Redirect admin and dean to homepage.html
if (role === 'admin' || role === 'dean') {
    window.location.href = 'homepage.html';
    return;
}

// Redirect evaluator to evaluator-dashboard.html
if (role === 'evaluator') {
    window.location.href = 'evaluator-dashboard.html';
    return;
}

// If role is not in allowed list, redirect to landing
if (!allowedRoles.includes(role)) {
    alert('Access denied. Invalid role for this dashboard.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'landing.html';
    return;
}
```

### 3. Homepage Access Control (`js/homepage.js`)

**Changes:**
- Added role validation on page load
- Redirect faculty/area-chair to `user-dashboard.html`
- Redirect evaluator to `evaluator-dashboard.html`
- Only allow admin and dean to access homepage.html
- Clear localStorage and redirect to login if invalid role

**Code:**
```javascript
// Validate user role - only admin and dean should access homepage
const role = (user.role || '').toLowerCase().trim();
const allowedRoles = ['admin', 'dean'];

// Redirect faculty and area-chair to user-dashboard.html
if (role === 'faculty' || role === 'area-chair') {
    window.location.href = 'user-dashboard.html';
    return;
}

// Redirect evaluator to evaluator-dashboard.html
if (role === 'evaluator') {
    window.location.href = 'evaluator-dashboard.html';
    return;
}

// If role is not in allowed list, redirect to landing
if (!allowedRoles.includes(role)) {
    alert('Access denied. Invalid role for this dashboard.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'landing.html';
    return;
}
```

## Role-Based Dashboard Mapping

| Role | Dashboard | Access Level |
|------|-----------|--------------|
| `admin` | `homepage.html` | Full system access, user management, all documents |
| `dean` | `homepage.html` | Department oversight, approvals, reports |
| `area-chair` | `user-dashboard.html` | Program management, faculty documents, approvals |
| `faculty` | `user-dashboard.html` | Upload documents, view own documents, track status |
| `evaluator` | `evaluator-dashboard.html` | Review documents, provide feedback (time-limited) |

## Registration Flow (Updated)

```
1. User visits registration.html
   ↓
2. User fills form with role selection:
   - Faculty Member (value: "faculty")
   - Area Chair/Program Head (value: "area-chair")
   - Dean (value: "dean")
   - External Evaluator (value: "evaluator")
   ↓
3. Frontend sends POST /api/auth/register with:
   { firstName, lastName, middleInitial, email, password, role }
   ↓
4. Backend validates role against ENUM values
   ↓
5. Backend creates user with:
   - role: selected role
   - status: 'pending'
   - isVerified: 0
   ↓
6. User redirected to landing.html
   ↓
7. User logs in → OTP sent to email
   ↓
8. User verifies OTP → status: 'approved', isVerified: 1
   ↓
9. Backend returns user object with role
   ↓
10. Frontend redirects based on role:
    - admin/dean → homepage.html
    - faculty/area-chair → user-dashboard.html
    - evaluator → evaluator-dashboard.html
```

## Login Flow (Updated)

```
1. User enters email/password on landing.html
   ↓
2. Backend validates credentials
   ↓
3. If not verified → Send OTP → Verify → Set isVerified=1, status='approved'
   ↓
4. Backend returns JWT token + user object (includes role)
   ↓
5. Frontend stores token and user in localStorage
   ↓
6. landing.js redirectToDashboard() checks role:
   - admin → homepage.html
   - dean → homepage.html
   - faculty → user-dashboard.html
   - area-chair → user-dashboard.html
   - evaluator → evaluator-dashboard.html
   ↓
7. Dashboard page loads
   ↓
8. Dashboard JS validates role on page load:
   - homepage.js: Only allows admin/dean
   - user-dashboard.js: Only allows faculty/area-chair
   - If wrong role → Redirect to correct dashboard
```

## Testing Checklist

### Registration Testing
- [ ] Register as Faculty → Role saved as "faculty" in database
- [ ] Register as Area Chair → Role saved as "area-chair" in database
- [ ] Register as Dean → Role saved as "dean" in database
- [ ] Register as Evaluator → Role saved as "evaluator" in database
- [ ] Try registering with invalid role → Error message displayed
- [ ] Try registering without role → Error message displayed

### Login & Redirect Testing
- [ ] Login as Faculty → Redirected to user-dashboard.html
- [ ] Login as Area Chair → Redirected to user-dashboard.html
- [ ] Login as Dean → Redirected to homepage.html
- [ ] Login as Admin → Redirected to homepage.html
- [ ] Login as Evaluator → Redirected to evaluator-dashboard.html

### Access Control Testing
- [ ] Faculty tries to access homepage.html → Redirected to user-dashboard.html
- [ ] Area Chair tries to access homepage.html → Redirected to user-dashboard.html
- [ ] Admin tries to access user-dashboard.html → Redirected to homepage.html
- [ ] Dean tries to access user-dashboard.html → Redirected to homepage.html
- [ ] Evaluator tries to access homepage.html → Redirected to evaluator-dashboard.html
- [ ] Evaluator tries to access user-dashboard.html → Redirected to evaluator-dashboard.html

### Database Verification
- [ ] Check users table → role column populated correctly
- [ ] Verify role values match ENUM: 'admin', 'dean', 'area-chair', 'faculty', 'evaluator'
- [ ] Verify status is 'pending' after registration
- [ ] Verify isVerified is 0 after registration
- [ ] Verify status becomes 'approved' and isVerified becomes 1 after OTP verification

## Files Modified

1. **node/routes/auth.js**
   - Added role parameter to registration endpoint
   - Added role validation against ENUM values
   - Included role in user insert query

2. **js/user-dashboard.js**
   - Added role-based access control on page load
   - Redirect admin/dean to homepage.html
   - Redirect evaluator to evaluator-dashboard.html
   - Only allow faculty/area-chair access

3. **js/homepage.js**
   - Added role-based access control on page load
   - Redirect faculty/area-chair to user-dashboard.html
   - Redirect evaluator to evaluator-dashboard.html
   - Only allow admin/dean access

## Database Schema Reference

```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `middleInitial` varchar(10) DEFAULT NULL,
  `role` enum('admin','dean','area-chair','faculty','evaluator') NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `lastActive` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Security Considerations

1. **Frontend Validation**: Role values validated in registration.html dropdown
2. **Backend Validation**: Role values validated against ENUM in auth.js
3. **Access Control**: Each dashboard validates role on page load
4. **Token-Based Auth**: JWT token required for all dashboard access
5. **Session Management**: Token stored in localStorage, cleared on logout
6. **Redirect Protection**: Invalid roles trigger logout and redirect to login

## Known Limitations

1. **Client-Side Redirect**: Access control relies on client-side JavaScript (can be bypassed)
2. **Backend Protection Needed**: API endpoints should also validate user roles (future enhancement)
3. **Role Change**: If admin changes user role in database, user must logout/login to see new dashboard

## Future Enhancements

1. Add backend middleware to validate role-based access to API endpoints
2. Implement role-based permissions for specific features within dashboards
3. Add audit logging for role changes and unauthorized access attempts
4. Create admin interface to manage user roles
5. Add role-based menu items (hide/show based on permissions)

## Conclusion

The registration and login flow now properly handles role-based redirects. Users are directed to the appropriate dashboard based on their role, and each dashboard validates access on page load to prevent unauthorized access.

**Key Points:**
- Backend now saves role during registration
- Role values validated against database ENUM
- Each dashboard has role-based access control
- Proper redirects ensure users land on correct dashboard
- Security enhanced with client-side validation (backend validation recommended for production)
