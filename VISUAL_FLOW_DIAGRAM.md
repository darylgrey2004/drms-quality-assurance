# Visual Flow Diagram: Role-Based Access Control

## User Login & Redirect Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Enters Credentials                       │
│                      (landing.html)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend Validates & Returns User Data               │
│           (includes: id, email, firstName, lastName, role)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         landing.js: redirectToDashboard(user.role)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌──────────────┐
        │  role='admin' │         │ role='dean'  │
        │  role='dean'  │         └──────┬───────┘
        └───────┬───────┘                │
                │                        │
                └────────┬───────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  homepage.html  │
                └─────────────────┘

                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌──────────────────┐
        │ role='faculty'│         │ role='area-chair'│
        └───────┬───────┘         └──────┬───────────┘
                │                        │
                └────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ user-dashboard.html  │
              └──────────────────────┘

                         │
                         ▼
                ┌─────────────────┐
                │ role='evaluator'│
                └────────┬────────┘
                         │
                         ▼
           ┌──────────────────────────────┐
           │ evaluator-dashboard.html     │
           └──────────────────────────────┘
```

## Page Load Flow (User Pages)

```
┌─────────────────────────────────────────────────────────────────┐
│              User Accesses User Page (e.g., user-dashboard.html)│
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           user-session.js: initializeUserPage()                  │
│                                                                   │
│  1. Check token & user in localStorage                           │
│  2. Validate role                                                │
│  3. Apply role-based redirects                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐     ┌──────────────────────┐
    │ No token/user?    │     │ Role = admin/dean?   │
    │ → landing.html    │     │ → homepage.html      │
    └───────────────────┘     └──────────────────────┘
                │                         │
                │                         ▼
                │             ┌──────────────────────┐
                │             │ Role = evaluator?    │
                │             │ → evaluator-dash.html│
                │             └──────────────────────┘
                │                         │
                │                         ▼
                │             ┌──────────────────────────────┐
                │             │ Role = faculty/area-chair?   │
                │             │ → Continue loading page      │
                │             └──────────┬───────────────────┘
                │                        │
                └────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  populateSidebar(user, role)                     │
│                                                                   │
│  1. Fetch user profile from API                                  │
│  2. Update sidebar initials, name, role, department              │
│  3. Update portal label (Faculty/Area Chair Portal)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  applyRoleBasedUI(role)                          │
│                                                                   │
│  If role = 'faculty':                                            │
│    → Hide "My Approvals" link in sidebar                         │
│                                                                   │
│  If role = 'area-chair':                                         │
│    → Show "My Approvals" link in sidebar                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Setup heartbeat, logout, mobile sidebar             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Page-specific code runs                       │
└─────────────────────────────────────────────────────────────────┘
```

## Profile Edit Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              User Clicks "Edit Profile" Button                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    enableEditMode()                              │
│                                                                   │
│  1. Hide "Edit Profile" button                                   │
│  2. Show "Save Changes" and "Cancel" buttons                     │
│  3. Enable editable fields (remove readonly/disabled)            │
│  4. Change background color (gray → white)                       │
│  5. Add border color (teal)                                      │
│                                                                   │
│  READ-ONLY FIELDS (stay grayed out):                             │
│    - First Name, Last Name, Middle Initial, Email                │
│                                                                   │
│  EDITABLE FIELDS (become white):                                 │
│    - All other fields (DOB, Gender, Phone, etc.)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  User Makes Changes                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐     ┌──────────────────────┐
    │ Clicks "Cancel"   │     │ Clicks "Save Changes"│
    └───────┬───────────┘     └──────────┬───────────┘
            │                            │
            ▼                            ▼
┌───────────────────────┐   ┌──────────────────────────────┐
│ Confirm discard?      │   │ saveUserProfile(userId)      │
│ → Yes: Reload data    │   │                              │
│ → No: Continue edit   │   │ 1. Collect form data         │
└───────────────────────┘   │ 2. Show "Saving..." on button│
                            │ 3. PUT /api/user/profile/:id │
                            │ 4. Update localStorage       │
                            │ 5. Show success message      │
                            │ 6. Reload profile data       │
                            │ 7. Update sidebar            │
                            │ 8. Disable edit mode         │
                            └──────────────────────────────┘
```

## Role-Based Sidebar Visibility

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIDEBAR NAVIGATION                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                                    │
│  📄 My Documents                                                 │
│  ⬆️ Upload Document                                              │
│  🗺️ Evidence Map                                                 │
│  🔍 Search                                                       │
│  ✅ My Approvals  ◄─── CONDITIONAL VISIBILITY                    │
│  👤 Profile                                                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────────┐
│      ROLE            │     "MY APPROVALS" VISIBILITY            │
├──────────────────────┼──────────────────────────────────────────┤
│  Faculty             │  ❌ HIDDEN (display: none)               │
│  Area Chair          │  ✅ VISIBLE                              │
│  Admin               │  N/A (redirected to homepage)            │
│  Dean                │  N/A (redirected to homepage)            │
│  Evaluator           │  N/A (redirected to evaluator-dash)      │
└──────────────────────┴──────────────────────────────────────────┘
```

## File Structure & Dependencies

```
user-dashboard.html
├── css/user-dashboard.css
├── js/user-session.js      ◄─── SHARED (loads first)
└── js/user-dashboard.js    ◄─── PAGE-SPECIFIC (loads second)

user-documents.html
├── css/user-documents.css
├── js/user-session.js      ◄─── SHARED (loads first)
└── js/user-documents.js    ◄─── PAGE-SPECIFIC (loads second)

user-upload.html
├── css/user-upload.css
├── js/user-session.js      ◄─── SHARED (loads first)
└── js/user-upload.js       ◄─── PAGE-SPECIFIC (loads second)

user-evidence-map.html
├── css/user-evidence-map.css
├── js/user-session.js      ◄─── SHARED (loads first)
└── js/user-evidence-map.js ◄─── PAGE-SPECIFIC (loads second)

user-search.html
├── css/user-search.css
├── js/user-session.js      ◄─── SHARED (loads first)
└── js/user-search.js       ◄─── PAGE-SPECIFIC (loads second)

user-approvals.html
├── css/user-approvals.css
├── js/user-session.js      ◄─── SHARED (loads first)
└── js/user-approvals.js    ◄─── PAGE-SPECIFIC (loads second)

user-profile.html
├── css/user-profile.css
├── js/user-session.js      ◄─── SHARED (loads first)
└── js/user-profile.js      ◄─── PAGE-SPECIFIC (loads second)
```

## user-session.js Functions

```
┌─────────────────────────────────────────────────────────────────┐
│                      user-session.js                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  initUserSession()                                               │
│    ├─ Check token & user in localStorage                         │
│    ├─ Validate role (faculty, area-chair only)                   │
│    ├─ Redirect admin/dean → homepage.html                        │
│    ├─ Redirect evaluator → evaluator-dashboard.html              │
│    └─ Return { token, user, role }                               │
│                                                                   │
│  populateSidebar(user, role)                                     │
│    ├─ Update sidebar initials                                    │
│    ├─ Update sidebar name                                        │
│    ├─ Fetch department from API                                  │
│    ├─ Update sidebar role & department                           │
│    ├─ Update portal label                                        │
│    └─ Update access label                                        │
│                                                                   │
│  applyRoleBasedUI(role)                                          │
│    └─ If faculty: Hide "My Approvals" link                       │
│                                                                   │
│  setupHeartbeat(token)                                           │
│    ├─ Send initial heartbeat                                     │
│    └─ Setup interval (every 2 minutes)                           │
│                                                                   │
│  setupLogout()                                                   │
│    └─ Add click handler to logout button                         │
│                                                                   │
│  setupMobileSidebar()                                            │
│    ├─ Toggle sidebar on mobile                                   │
│    ├─ Close on overlay click                                     │
│    └─ Close on navigation                                        │
│                                                                   │
│  highlightActiveNav()                                            │
│    └─ Highlight current page in sidebar                          │
│                                                                   │
│  initializeUserPage()  ◄─── MAIN FUNCTION (call this)            │
│    ├─ initUserSession()                                          │
│    ├─ populateSidebar()                                          │
│    ├─ applyRoleBasedUI()                                         │
│    ├─ setupHeartbeat()                                           │
│    ├─ setupLogout()                                              │
│    ├─ setupMobileSidebar()                                       │
│    ├─ highlightActiveNav()                                       │
│    └─ Return { token, user, role }                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION STEPS                          │
└─────────────────────────────────────────────────────────────────┘

✅ Step 1: Backend Registration Fix
   └─ node/routes/auth.js accepts and saves role field

✅ Step 2: Create Shared Session Management
   └─ js/user-session.js created with all functions

✅ Step 3: Fix Profile Edit
   └─ js/user-profile.js updated with read-only name fields

✅ Step 4: Update Dashboard Access Control
   ├─ js/user-dashboard.js validates role
   └─ js/homepage.js validates role

□ Step 5: Add user-session.js to HTML Files
   ├─ user-dashboard.html
   ├─ user-documents.html
   ├─ user-upload.html
   ├─ user-evidence-map.html
   ├─ user-search.html
   ├─ user-approvals.html
   └─ user-profile.html

□ Step 6: Update Page-Specific JS Files
   ├─ js/user-documents.js
   ├─ js/user-upload.js
   ├─ js/user-evidence-map.js
   ├─ js/user-search.js
   └─ js/user-approvals.js

□ Step 7: Test with Different Roles
   ├─ Faculty role testing
   ├─ Area Chair role testing
   ├─ Admin/Dean role testing
   └─ Profile edit testing

□ Step 8: Deploy & Monitor
   └─ Deploy to production and monitor for issues
```

## Quick Reference

**To add to HTML:**
```html
<script src="js/user-session.js"></script>
<script src="js/[page-specific].js"></script>
```

**To use in JS:**
```javascript
const session = initializeUserPage();
if (!session) return;
const { token, user, role } = session;
```

**Role Values:**
- `'faculty'` - Faculty member
- `'area-chair'` - Area Chair/Program Head
- `'admin'` - System administrator
- `'dean'` - Dean
- `'evaluator'` - External evaluator
```
