# Bug Fixes Summary - User Portal Session & Profile Issues

## Overview
**FIVE** critical bugs were identified and fixed affecting Faculty and Area-Chair users in the system:

---

## Bug #1: Sidebar Doesn't Fetch User Information ❌ FIXED ✅

### Root Cause
The `user-profile.js` and other user page files were calling an async function `initializeUserPage()` that didn't exist:
```javascript
const session = await initializeUserPage();  // Function undefined!
```

The `user-session.js` file only contained a `DOMContentLoaded` event listener but didn't export or define `initializeUserPage()` as a callable function.

### Impact
- Sidebar user information (name, role, initials) remained blank or unloaded
- Session data was not properly initialized for page-level scripts
- All user pages failed to load session information correctly

### Fix Applied
**File: `js/user-session.js`**
- Added a global `initializeUserPage()` function that:
  - Retrieves token and user data from localStorage
  - Validates the token exists
  - Returns a promise with session data: `{ token, user, role }`
  - Properly handles cases where token/user data is missing

---

## Bug #2: "Profile not found" Error When Saving ❌ FIXED ✅

### Root Cause
When a Faculty or Area-Chair user tried to save profile changes:
1. The PUT endpoint (`/api/user/profile/:userId`) attempted to UPDATE the `faculty_profiles` table
2. If no matching `faculty_profiles` record existed for that user, the update affected 0 rows
3. The API returned error: `{ msg: 'Profile not found' }`
4. This happened because new users might not have profile records created during registration

### Impact
- Users couldn't save profile changes even though they had valid accounts
- Error message displayed: "Failed to save profile: Profile not found"
- User frustration as they couldn't update personal information

### Fix Applied
**File: `node/routes/user.js` (PUT /api/user/profile/:userId endpoint)**
- Changed from simple UPDATE to INSERT-OR-UPDATE strategy:
  - First attempt to UPDATE the existing `faculty_profiles` record
  - If UPDATE affects 0 rows (record doesn't exist), automatically INSERT a new record
  - This ensures the profile is created on first save if it doesn't exist

---

## Bug #3: User Logs Out When Changing Pages ❌ FIXED ✅

### Root Cause
Multiple issues contributed to premature logouts:
1. The session validation code was too strict, logging users out on any API failure or minor token issues
2. The profile fetch had no error handling - any API failure could trigger a logout
3. There was no distinction between "token missing" vs "API temporarily unavailable"

### Impact
- Users were logged out unexpectedly when navigating between pages
- Profile API failures caused complete logout instead of graceful fallback
- Bad user experience with unexpected redirects to login

### Fix Applied
**File: `js/user-session.js`**

**Improvement 1: Better token validation**
- Only redirect if token is truly missing or invalid
- Added proper string validation to prevent false negatives

**Improvement 2: Better profile fetch error handling**
- Distinguished between authorization failures (401/403) vs temporary API failures
- Only clear session on 401/403 errors (auth failed)
- Keep cached user data if API is temporarily unavailable

---

## Bug #4: Faculty/Area-Chair Registration Skips Employment Form ❌ FIXED ✅

### Root Cause
**File: `js/registration.js`**

When faculty or area-chair users register, they need to fill:
1. Initial registration form (name, email, password)
2. Employment information form (employee ID, position, department, status)

But the registration.js was redirecting ALL users directly to landing.html, skipping the employment form:

```javascript
// ❌ WRONG - immediately redirects to login for all roles
window.location.href = 'landing.html';
```

This meant faculty/area-chair users never had their employment data stored in the `faculty_profiles` table.

### Impact
- Faculty/area-chair users couldn't complete their profiles
- No employment data in database
- Sidebar couldn't display department information
- Users appearing as incomplete registrations in the system

### Fix Applied
**File: `js/registration.js`**

After registration succeeds:
1. Check the user's role
2. If faculty or area-chair:
   - Store registration data in localStorage
   - Redirect to `faculty-profile-form.html`
3. If admin/dean/evaluator:
   - Redirect directly to `landing.html`

```javascript
const normalizedRole = role?.toLowerCase().trim();
if (normalizedRole === 'faculty' || normalizedRole === 'area-chair') {
    // Store registration data for employment form
    const registrationData = { firstName, lastName, middleInitial, email, password, role };
    localStorage.setItem('registrationData', JSON.stringify(registrationData));
    window.location.href = 'faculty-profile-form.html';
} else {
    // Direct login for other roles
    window.location.href = 'landing.html';
}
```

---

## Bug #5: Role Label Mismatch in Sidebar ❌ FIXED ✅

### Root Cause
**File: `js/user-session.js`**

The login API returns role as `"area-chair"` (lowercase with hyphen), but the sidebar portal labels were using different string formats:

```javascript
// ❌ Mismatch - role is "area-chair" but labels use "area chair/program head"
const portalLabels = {
    'faculty member': 'Faculty Portal',
    'area chair/program head': 'Area Chair Portal'  // ❌ Never matches "area-chair"
};
```

### Impact
- Area-Chair users saw generic "Faculty Portal" label instead of "Area Chair Portal"
- Confusing UX for area-chair users
- Inconsistent display of portal labels

### Fix Applied
**File: `js/user-session.js`**

Added both role formats to portal and access labels:

```javascript
const portalLabels = {
    'faculty member': 'Faculty Portal',
    'faculty': 'Faculty Portal',
    'area chair/program head': 'Area Chair Portal',
    'area-chair': 'Area Chair Portal'  // ✅ Now matches role format from login
};
const accessLabels = {
    'faculty member': 'Faculty Access',
    'faculty': 'Faculty Access',
    'area chair/program head': 'Area Chair Access',
    'area-chair': 'Area Chair Access'  // ✅ Now matches role format from login
};
```

---

## Additional Improvements

**File: `faculty-profile-form.html`**
- Added Cancel button to allow users to exit employment form and return to registration

**File: `js/faculty-profile-form.js`**
- Added cancel button handler with confirmation dialog
- Improved validation for employee ID (must be numeric 1-6 digits)
- Better error handling and user feedback
- Disable submit button during processing to prevent double submissions

---

## Testing Checklist

Verify all fixes with this checklist:

### Scenario 1: Faculty Registration & Login
- [ ] Navigate to registration.html
- [ ] Select "Faculty Member" role
- [ ] Fill registration form and submit
- [ ] **Verify:** Redirected to faculty-profile-form.html (NOT landing.html)
- [ ] Fill employment information and submit
- [ ] **Verify:** Success message and redirected to landing.html
- [ ] Log in with faculty credentials
- [ ] **Verify:** Redirected to user-dashboard.html
- [ ] **Verify:** Sidebar shows "Faculty Portal" label (not "Faculty Portal")
- [ ] **Verify:** Sidebar displays name, department, and role
- [ ] Navigate through pages (Documents, Upload, Profile)
- [ ] **Verify:** Remain logged in, no logout redirects

### Scenario 2: Area-Chair Registration & Login
- [ ] Navigate to registration.html
- [ ] Select "Area Chair/Program Head" role
- [ ] Fill registration form and submit
- [ ] **Verify:** Redirected to faculty-profile-form.html
- [ ] Fill employment information and submit
- [ ] **Verify:** Success message, redirected to landing.html
- [ ] Log in with area-chair credentials
- [ ] **Verify:** Redirected to user-dashboard.html
- [ ] **Verify:** Sidebar shows "Area Chair Portal" label (not "Faculty Portal")
- [ ] **Verify:** Sidebar displays area-chair user info and department
- [ ] Click Edit Profile on profile page
- [ ] Make changes and save
- [ ] **Verify:** Profile saves successfully (not "Profile not found" error)
- [ ] **Verify:** Changes are saved and reflected

### Scenario 3: Faculty Profile Edit
- [ ] Log in as faculty user
- [ ] Navigate to profile page
- [ ] Click "Edit Profile"
- [ ] Change personal information
- [ ] Click "Save Changes"
- [ ] **Verify:** Success message appears
- [ ] **Verify:** Page reloads with new data
- [ ] **Verify:** Sidebar information updates

### Scenario 4: Error Handling
- [ ] Log in as faculty
- [ ] Simulate backend API outage (e.g., stop server briefly)
- [ ] Navigate between pages
- [ ] **Verify:** NOT logged out automatically
- [ ] **Verify:** Sidebar shows cached user information
- [ ] **Verify:** Graceful fallback behavior

---

## Files Modified

1. **`js/user-session.js`**
   - Added `initializeUserPage()` function
   - Improved token validation logic
   - Enhanced profile fetch error handling
   - Fixed role label mapping

2. **`js/registration.js`**
   - Added role-based redirect after registration
   - Store registration data in localStorage for faculty/area-chair
   - Redirect faculty/area-chair to employment form

3. **`js/faculty-profile-form.js`**
   - Added cancel button handler
   - Improved validation for employee ID
   - Better error handling and user feedback
   - Disable submit button during processing

4. **`faculty-profile-form.html`**
   - Added Cancel button to form

5. **`node/routes/user.js`**
   - Modified PUT `/api/user/profile/:userId` endpoint
   - Added INSERT fallback when UPDATE affects 0 rows

6. **`js/user-profile.js`**
   - Removed call to undefined `populateSidebar()` function

---

## Summary of Root Causes

| Bug | Root Cause | Impact |
|-----|-----------|--------|
| #1 | Missing `initializeUserPage()` function | Sidebar not populating |
| #2 | No INSERT fallback for new profiles | Users couldn't save profiles |
| #3 | Strict session validation | Unexpected logouts on page navigation |
| #4 | Registration skips employment form | Faculty data not created |
| #5 | Role label string mismatch | Wrong sidebar labels for area-chair |

All bugs are now fixed and the user registration and login flow should work correctly for Faculty and Area-Chair users!

---

## Bug #1: Sidebar Doesn't Fetch User Information ❌ FIXED ✅

### Root Cause
The `user-profile.js` and other user page files were calling an async function `initializeUserPage()` that didn't exist:
```javascript
const session = await initializeUserPage();  // Function undefined!
```

The `user-session.js` file only contained a `DOMContentLoaded` event listener but didn't export or define `initializeUserPage()` as a callable function.

### Impact
- Sidebar user information (name, role, initials) remained blank or unloaded
- Session data was not properly initialized for page-level scripts
- All user pages failed to load session information correctly

### Fix Applied
**File: `js/user-session.js`**
- Added a global `initializeUserPage()` function that:
  - Retrieves token and user data from localStorage
  - Validates the token exists
  - Returns a promise with session data: `{ token, user, role }`
  - Properly handles cases where token/user data is missing

```javascript
// Global function to initialize user pages with session data
async function initializeUserPage() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        console.warn('No token found, redirecting to landing page');
        window.location.href = 'landing.html';
        return null;
    }

    const normalizedRole = (user.role || '').toString().toLowerCase().trim();
    
    // Validate that the user has required fields
    if (!normalizedRole) {
        console.warn('No role found in user data, redirecting to landing page');
        window.location.href = 'landing.html';
        return null;
    }

    return { token, user, role: normalizedRole };
}
```

---

## Bug #2: "error found: no user profile found" When Saving Profile ❌ FIXED ✅

### Root Cause
When a Faculty or Area-Chair user tried to save profile changes:
1. The PUT endpoint (`/api/user/profile/:userId`) attempted to UPDATE the `faculty_profiles` table
2. If no matching `faculty_profiles` record existed for that user, the update affected 0 rows
3. The API returned error: `{ msg: 'Profile not found' }`
4. This happened because new users might not have profile records created during registration

### Impact
- Users couldn't save profile changes even though they had valid accounts
- Error message displayed: "Failed to save profile: Profile not found"
- User frustration as they couldn't update personal information

### Fix Applied
**File: `node/routes/user.js` (PUT /api/user/profile/:userId endpoint)**
- Changed from simple UPDATE to INSERT-OR-UPDATE strategy:
  - First attempt to UPDATE the existing `faculty_profiles` record
  - If UPDATE affects 0 rows (record doesn't exist), automatically INSERT a new record
  - This ensures the profile is created on first save if it doesn't exist

```javascript
// If no rows were affected, try to insert a new profile record
if (result.affectedRows === 0) {
  console.log('Profile not found, attempting to insert new profile for user_id:', userId);
  try {
    const insertData = { user_id: userId, ...profileData };
    await db.query('INSERT INTO faculty_profiles SET ?', [insertData]);
    console.log('New profile created successfully');
  } catch (insertErr) {
    console.error('Failed to create profile:', insertErr.message);
    return res.status(400).json({ msg: 'Unable to create or update profile. Please try again.' });
  }
}
```

---

## Bug #3: User Logs Out When Changing Pages ❌ FIXED ✅

### Root Cause
Multiple issues contributed to premature logouts:
1. The `DOMContentLoaded` event listener in `user-session.js` was running on every page load
2. If token validation failed for any reason, it redirected immediately to landing.html
3. The profile fetch had no error handling - any API failure could trigger a logout
4. There was no distinction between "token missing" vs "API temporarily unavailable"

### Impact
- Users were logged out unexpectedly when navigating between pages
- Profile API failures caused complete logout instead of graceful fallback
- Bad user experience with unexpected redirects to login

### Fix Applied
**File: `js/user-session.js`**

**Improvement 1: Better token validation**
- Only redirect if token is truly missing or invalid
- Added proper string validation to prevent false negatives
- Added validation for user role to prevent edge cases

```javascript
// Only redirect if token is completely missing - don't redirect if just user data is missing
if (!token || typeof token !== 'string' || token.trim() === '') {
    console.warn('No valid token found');
    window.location.href = 'landing.html';
    return;
}
```

**Improvement 2: Better profile fetch error handling**
- Distinguished between authorization failures (401/403) vs temporary API failures
- Only clear session on 401/403 errors (auth failed)
- Keep cached user data if API is temporarily unavailable
- Added proper logging to help diagnose issues

```javascript
if (resolvedUserId) {
    fetch(`http://localhost:3000/api/user/profile/${resolvedUserId}`, {
        headers: { 'x-auth-token': token }
    })
        .then(async (response) => {
            // Only process successful responses
            if (response.status === 401 || response.status === 403) {
                // Token invalid or unauthorized, clear session
                console.error('Token validation failed, clearing session');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
                return null;
            }
            if (!response.ok) {
                console.warn('Profile fetch failed with status:', response.status);
                throw new Error('Failed to load profile');
            }
            return response.json();
        })
        .then((profileData) => {
            if (profileData) {
                const mergedUser = { ...user, ...profileData };
                localStorage.setItem('user', JSON.stringify(mergedUser));
                applyIdentity(mergedUser);
            }
        })
        .catch((err) => {
            // Keep sidebar values from localStorage fallback when profile API is unavailable
            console.warn('Error fetching profile, using cached data:', err.message);
        });
}
```

**Improvement 3: Removed non-existent function call**
**File: `js/user-profile.js`**
- Removed call to undefined `populateSidebar()` function that was causing errors
- The page reload is sufficient to refresh the sidebar

---

## Testing Checklist

When you run the system, verify the following:

- [ ] **Bug #1 - Sidebar Information**: Log in as Faculty/Area-Chair and verify:
  - Sidebar displays user name correctly
  - Sidebar displays user role (Faculty · Department)
  - Sidebar displays initials
  - Portal label shows "Faculty Portal" or "Area Chair Portal"

- [ ] **Bug #2 - Profile Saving**: Log in as Faculty/Area-Chair and:
  - Click "Edit Profile" on profile page
  - Make changes to any field
  - Click "Save Changes"
  - Verify success message appears (not "Profile not found" error)
  - Verify changes are saved and reflected on page reload

- [ ] **Bug #3 - Session Persistence**: Log in as Faculty/Area-Chair and:
  - Navigate between different pages (Dashboard → Documents → Profile → Upload)
  - Verify you remain logged in and don't get redirected to login
  - Check console for any "Token validation failed" messages
  - Verify sidebar information is consistent across pages

---

## Files Modified

1. **`js/user-session.js`**
   - Added `initializeUserPage()` function
   - Improved token validation logic
   - Enhanced profile fetch error handling

2. **`node/routes/user.js`**
   - Modified PUT `/api/user/profile/:userId` endpoint
   - Added INSERT fallback when UPDATE affects 0 rows
   - Improved error handling

3. **`js/user-profile.js`**
   - Removed call to undefined `populateSidebar()` function

---

## Additional Notes

- All user page files (user-documents.js, user-upload.js, user-evidence-map.js, etc.) already have the correct calls to `initializeUserPage()`, so no changes were needed there
- The fixes maintain backward compatibility with existing functionality
- Console logging was enhanced to help diagnose future issues
- The fixes follow the principle of graceful degradation - if API is temporarily unavailable, cached data is used instead of logging out
