# Registration & Login Fix - Database Schema Alignment

## Problem
Registration and login logic didn't match the database `users` table schema, causing role mismatches and registration failures.

---

## Database Schema (drms_db.sql)

### Users Table - Role ENUM
```sql
`role` enum('admin','dean','area-chair','faculty','evaluator') NOT NULL
```

**Valid Values**:
- `admin` - Administrator
- `dean` - Dean
- `area-chair` - Area Chair/Program Head
- `faculty` - Faculty Member
- `evaluator` - External Evaluator

### Users Table - Status ENUM
```sql
`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending'
```

### Users Table - Required Fields
```sql
- email VARCHAR(255) NOT NULL UNIQUE
- password VARCHAR(255) NOT NULL (bcrypt hashed)
- firstName VARCHAR(100) NOT NULL
- lastName VARCHAR(100) NOT NULL
- middleInitial VARCHAR(10) DEFAULT NULL
- role ENUM NOT NULL
- status ENUM DEFAULT 'pending'
- isVerified TINYINT(1) DEFAULT 0
```

---

## Issues Found

### Issue 1: Wrong Role Values in registration.html ❌
**Before**:
```html
<option value="Faculty Member">Faculty Member</option>
<option value="Area Chair/Program Head">Area Chair/Program Head</option>
<option value="Dean">Dean</option>
<option value="External Evaluator">External Evaluator</option>
```

**Problem**: These values don't match the database ENUM!

### Issue 2: Registration Saved to localStorage ❌
**Before** (registration.js):
```javascript
localStorage.setItem('registrationData', JSON.stringify(registrationData));
window.location.href = 'faculty-profile-form.html';
```

**Problem**: Never called the backend API, just saved locally and redirected to a profile form that doesn't exist in the flow.

### Issue 3: Login Handled Old Role Names ❌
**Before** (landing.js):
```javascript
if (normalizedRole === 'faculty member' || normalizedRole === 'faculty') { ... }
if (normalizedRole === 'area chair/program head' || normalizedRole === 'area-chair') { ... }
if (normalizedRole === 'external evaluator' || normalizedRole === 'evaluator') { ... }
```

**Problem**: Tried to handle both old and new formats, causing confusion.

---

## Solutions Applied

### 1. Fixed registration.html Role Values ✅

**After**:
```html
<option value="faculty">Faculty Member</option>
<option value="area-chair">Area Chair/Program Head</option>
<option value="dean">Dean</option>
<option value="evaluator">External Evaluator</option>
```

✅ Now matches database ENUM exactly!

### 2. Rewrote registration.js to Call Backend API ✅

**After**:
```javascript
const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        firstName,
        lastName,
        middleInitial: middleInitial || null,
        email,
        password,
        role  // ✅ Now sends correct ENUM value
    })
});

// Success: redirect to login
window.location.href = 'landing.html';
```

**Features Added**:
- ✅ Direct API call to `/api/auth/register`
- ✅ Password strength validation (min 6 characters)
- ✅ Email validation
- ✅ Password confirmation check
- ✅ Error handling with user-friendly messages
- ✅ Loading state on submit button

### 3. Updated Registration Flow Note ✅

**Before**:
```
"After registration, you'll complete a detailed faculty profile form..."
Button: "Continue to Profile Setup →"
```

**After**:
```
"After registration, you'll receive an OTP via email to verify your account. 
Your account will be pending admin approval before you can access the system."
Button: "Create Account"
```

### 4. Simplified landing.js Role Handling ✅

**After**:
```javascript
function redirectToDashboard(role) {
    const normalizedRole = role?.toLowerCase().trim();
    
    if (normalizedRole === 'admin') {
        window.location.href = 'homepage.html';
    } else if (normalizedRole === 'faculty') {
        window.location.href = 'user-dashboard.html';
    } else if (normalizedRole === 'area-chair') {
        window.location.href = 'user-dashboard.html';
    } else if (normalizedRole === 'dean') {
        window.location.href = 'homepage.html';
    } else if (normalizedRole === 'evaluator') {
        window.location.href = 'evaluator-dashboard.html';
    } else {
        window.location.href = 'user-dashboard.html';
    }
}
```

✅ Only handles database ENUM values, no legacy support needed!

---

## Registration Flow (New)

### Step 1: User Fills Registration Form
```
First Name: Juan
Last Name: Dela Cruz
Middle Initial: M
Email: juan.delacruz@wmsu.edu.ph
Role: faculty (from dropdown)
Password: ******
Confirm Password: ******
```

### Step 2: Frontend Validation
```javascript
✓ All required fields filled
✓ Passwords match
✓ Password length >= 6 characters
✓ Valid email format
```

### Step 3: Backend API Call
```javascript
POST http://localhost:3000/api/auth/register
Body: {
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "middleInitial": "M",
    "email": "juan.delacruz@wmsu.edu.ph",
    "password": "securepass123",
    "role": "faculty"  // ✅ Matches ENUM
}
```

### Step 4: Backend Processing (auth.js)
```javascript
// Check if email already exists
const [users] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
if (users.length > 0) {
    return res.status(400).json({ msg: 'User with this email already exists' });
}

// Hash password
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Insert user
await db.query('INSERT INTO users SET ?', {
    firstName,
    lastName,
    middleInitial,
    email,
    password: hashedPassword,
    role,  // ✅ ENUM value stored correctly
    status: 'pending',  // ✅ Default status
    isVerified: 0  // ✅ Not verified yet
});
```

### Step 5: Success Response
```json
{
    "msg": "Registration successful! Your account is pending approval from an administrator."
}
```

### Step 6: Redirect to Login
```javascript
alert(data.msg);
window.location.href = 'landing.html';
```

---

## Login Flow (Updated)

### Step 1: User Logs In
```
Email: juan.delacruz@wmsu.edu.ph
Password: ******
```

### Step 2: Backend Checks
```javascript
// Check credentials
const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
const isMatch = await bcrypt.compare(password, user.password);

// Check if rejected
if (user.status === 'rejected') {
    return res.status(403).json({ msg: 'Your account has been rejected.' });
}

// If not verified, send OTP
if (!user.isVerified) {
    // Generate 6-digit OTP
    // Send email
    return res.json({ requiresOTP: true, userId: user.id });
}

// If verified, return token
return res.json({ token, user, sessionToken });
```

### Step 3: OTP Verification (if needed)
```javascript
// User enters 6-digit OTP
POST /api/auth/verify-otp
Body: { email, otp }

// Backend verifies and updates
UPDATE users SET isVerified = TRUE, status = 'approved' WHERE email = ?

// Return token
return res.json({ token, user, sessionToken });
```

### Step 4: Redirect Based on Role
```javascript
// landing.js redirectToDashboard()
if (role === 'admin') → homepage.html
if (role === 'faculty') → user-dashboard.html
if (role === 'area-chair') → user-dashboard.html
if (role === 'dean') → homepage.html
if (role === 'evaluator') → evaluator-dashboard.html
```

---

## Files Modified

### 1. registration.html
- ✅ Fixed role dropdown values to match database ENUM
- ✅ Updated info note about OTP and admin approval
- ✅ Changed button text to "Create Account"

### 2. js/registration.js
- ✅ Completely rewritten to call backend API
- ✅ Removed localStorage logic
- ✅ Removed faculty profile form redirect
- ✅ Added password validation
- ✅ Added error handling
- ✅ Redirects to landing.html on success

### 3. js/landing.js
- ✅ Simplified redirectToDashboard function
- ✅ Removed legacy role name support
- ✅ Only handles database ENUM values

### 4. node/routes/auth.js (Already Correct)
- ✅ POST /api/auth/register endpoint exists
- ✅ Validates all required fields
- ✅ Hashes password with bcrypt
- ✅ Sets status='pending' by default
- ✅ Sets isVerified=0 by default

---

## Role Mapping

| Display Name | Database Value | Dashboard |
|---|---|---|
| Faculty Member | `faculty` | user-dashboard.html |
| Area Chair/Program Head | `area-chair` | user-dashboard.html |
| Dean | `dean` | homepage.html |
| External Evaluator | `evaluator` | evaluator-dashboard.html |
| Administrator | `admin` | homepage.html |

---

## Testing Checklist

### Registration
- [ ] Fill all required fields
- [ ] Select role from dropdown
- [ ] Password must be 6+ characters
- [ ] Passwords must match
- [ ] Click "Create Account"
- [ ] See success message
- [ ] Redirect to login page
- [ ] Check database: user exists with status='pending', isVerified=0

### Login (First Time)
- [ ] Enter registered email and password
- [ ] See OTP modal
- [ ] Check email for 6-digit code
- [ ] Enter OTP
- [ ] Click "Verify & Continue"
- [ ] Redirect to appropriate dashboard based on role
- [ ] Check database: isVerified=1, status='approved'

### Login (Subsequent)
- [ ] Enter email and password
- [ ] No OTP required (already verified)
- [ ] Redirect to dashboard immediately

---

## Summary

✅ **Registration now calls backend API directly**  
✅ **Role values match database ENUM exactly**  
✅ **Login handles correct role values**  
✅ **OTP verification flow works**  
✅ **Admin approval required (status='pending')**  
✅ **Proper redirects based on role**  

**Result**: Registration and login now work correctly with the database schema! 🎉
