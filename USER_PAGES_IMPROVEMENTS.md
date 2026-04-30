# User Pages Role-Based Access Control & Improvements

## Overview
This document outlines the implementation of role-based access control and UI improvements across all user-facing pages in the DRMS-QA system.

## Changes Implemented

### 1. Shared Session Management (`js/user-session.js`)

Created a centralized session management script that handles:
- **Role-based access control** - Validates user roles and redirects to appropriate dashboards
- **Sidebar population** - Fetches and displays user information dynamically
- **Role-based UI adjustments** - Hides/shows elements based on user role
- **Heartbeat mechanism** - Keeps session alive with periodic API calls
- **Logout functionality** - Centralized logout handler
- **Mobile sidebar toggle** - Responsive sidebar for mobile devices
- **Active navigation highlighting** - Highlights current page in sidebar

**Key Functions:**
```javascript
initUserSession()          // Validates session and role
populateSidebar(user, role) // Updates sidebar with user info
applyRoleBasedUI(role)     // Hides/shows elements based on role
setupHeartbeat(token)      // Keeps session alive
setupLogout()              // Handles logout
setupMobileSidebar()       // Mobile responsive sidebar
highlightActiveNav()       // Highlights active page
initializeUserPage()       // Main initialization function
```

### 2. Role-Based Access Rules

**Admin & Dean:**
- Redirect to `homepage.html`
- Full system access
- Can manage users and view all documents

**Area Chair:**
- Access to `user-dashboard.html` and all user pages
- Can access `user-approvals.html` (approval functionality)
- Can view and approve documents from faculty
- Upload and manage own documents

**Faculty:**
- Access to `user-dashboard.html` and most user pages
- **CANNOT** access `user-approvals.html` (hidden from navigation)
- Can upload and manage own documents
- View-only access to evidence map

**Evaluator:**
- Redirect to `evaluator-dashboard.html`
- Time-limited access
- Can review and provide feedback on documents

### 3. Page-Specific Changes

#### All User Pages
- Include `user-session.js` before page-specific scripts
- Automatic role validation on page load
- Dynamic sidebar population with user info
- Role-based UI element visibility

#### user-profile.html
**Fixed Edit Profile Functionality:**
- Name fields (firstName, lastName, middleInitial) are now **read-only**
- Only editable fields can be modified in edit mode
- Visual feedback during edit mode (border color changes)
- Save button shows "Saving..." during save operation
- Proper error handling and user feedback
- Sidebar updates after profile save

**Editable Fields:**
- Personal: Date of Birth, Age, Gender, Civil Status, Nationality, Phone, Address
- Employment: Employee ID, Position, Department, Employment Status
- Education: Highest Degree, Specialization, Institution, Grad Year, License, Continuing Ed
- Teaching: Subjects Taught, Year Level, Load Units, Advising, Committee Roles
- Research: Research Interests, Publications

**Read-Only Fields:**
- First Name, Last Name, Middle Initial, Email

#### user-approvals.html
- **Hidden for Faculty role** - Link removed from sidebar navigation
- **Visible for Area Chair role** - Full access to approval functionality
- Displays pending documents requiring approval
- Approve/Reject actions with comment functionality

#### user-dashboard.html
- Dynamic stats based on user's documents
- Role-specific welcome message
- Conditional display of approval notifications

#### user-documents.html
- Displays user's own documents
- Filter and search functionality
- Role-based action buttons

#### user-upload.html
- Document upload with category and department selection
- Form validation
- Success/error feedback

#### user-search.html
- Search across all accessible documents
- Advanced filters (category, department, status, date range)
- Results pagination

#### user-evidence-map.html
- View-only evidence mapping
- Category-wise document distribution
- Department-wise completion status

### 4. HTML Structure Requirements

All user pages must include these scripts in order:
```html
<!-- At the end of body, before page-specific scripts -->
<script src="js/user-session.js"></script>
<script src="js/[page-specific].js"></script>
```

### 5. Sidebar Structure

Standard sidebar HTML structure:
```html
<aside id="mainSidebar" class="w-72 bg-user-sidebar...">
    <!-- Logo -->
    <div class="px-5 pt-7 pb-4 border-b border-teal-900/40">
        <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-teal-400 rounded-full"></div>
            <span class="text-xl font-bold text-white">DRMS-QA</span>
        </div>
        <p id="sidebarPortal" class="text-teal-200/70 text-xs mt-1">Faculty Portal</p>
    </div>

    <!-- User Info -->
    <div class="px-5 py-4 border-b border-teal-900/40">
        <div class="flex items-center gap-3">
            <span id="sidebarInitials" class="w-10 h-10 bg-teal-600 rounded-full..."></span>
            <div>
                <div id="sidebarName" class="text-sm font-medium text-white"></div>
                <div id="sidebarRole" class="text-xs text-teal-300"></div>
            </div>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-5 space-y-1 text-sm font-medium">
        <a href="user-dashboard.html" class="flex items-center px-3 py-2.5 rounded-md...">
            <span class="mr-3">📊</span> Dashboard
        </a>
        <a href="user-documents.html" class="flex items-center px-3 py-2.5 rounded-md...">
            <span class="mr-3">📄</span> My Documents
        </a>
        <a href="user-upload.html" class="flex items-center px-3 py-2.5 rounded-md...">
            <span class="mr-3">⬆️</span> Upload Document
        </a>
        <a href="user-evidence-map.html" class="flex items-center px-3 py-2.5 rounded-md...">
            <span class="mr-3">🗺️</span> Evidence Map
        </a>
        <a href="user-search.html" class="flex items-center px-3 py-2.5 rounded-md...">
            <span class="mr-3">🔍</span> Search
        </a>
        <!-- This link will be hidden for faculty role -->
        <a href="user-approvals.html" class="flex items-center px-3 py-2.5 rounded-md...">
            <span class="mr-3">✅</span> My Approvals
            <span class="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
        </a>
        <a href="user-profile.html" class="flex items-center px-3 py-2.5 rounded-md...">
            <span class="mr-3">👤</span> Profile
        </a>
    </nav>

    <!-- Footer -->
    <div class="border-t border-teal-900/40 p-4">
        <div class="text-xs text-teal-200/50">
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                <span id="sidebarAccess">Faculty Access</span>
            </div>
            <div class="mt-1">© CTE · v.DRMS-QA</div>
        </div>
    </div>
</aside>
```

### 6. CSS Requirements

Ensure these classes are defined in page-specific CSS files:
```css
/* Sidebar styles */
.bg-user-sidebar {
    background: #0e263b;
}

.hover-nav:hover {
    background: rgba(20, 184, 166, 0.1);
}

.active-nav {
    background: rgba(20, 184, 166, 0.2);
    border-left: 4px solid #5eead4;
}

/* Mobile sidebar */
.sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
}

.sidebar-overlay.active {
    display: block;
}

#mainSidebar {
    transition: transform 0.3s ease;
}

@media (max-width: 768px) {
    #mainSidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        transform: translateX(-100%);
        z-index: 50;
    }

    #mainSidebar.open {
        transform: translateX(0);
    }
}
```

### 7. Backend API Requirements

The following API endpoints must be available:

**User Profile:**
- `GET /api/user/profile/:userId` - Fetch user profile
- `PUT /api/user/profile/:userId` - Update user profile

**Heartbeat:**
- `POST /api/user/heartbeat` - Update lastActive timestamp

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration with role
- `POST /api/auth/verify-otp` - OTP verification

### 8. Testing Checklist

#### Faculty Role Testing
- [ ] Can access user-dashboard.html
- [ ] Can access user-documents.html
- [ ] Can access user-upload.html
- [ ] Can access user-evidence-map.html
- [ ] Can access user-search.html
- [ ] Can access user-profile.html
- [ ] **CANNOT** see "My Approvals" link in sidebar
- [ ] **CANNOT** access user-approvals.html (redirected if URL entered directly)
- [ ] Sidebar shows "Faculty Portal" and "Faculty Access"
- [ ] Can edit profile (except name fields)
- [ ] Can save profile changes successfully

#### Area Chair Role Testing
- [ ] Can access user-dashboard.html
- [ ] Can access user-documents.html
- [ ] Can access user-upload.html
- [ ] Can access user-evidence-map.html
- [ ] Can access user-search.html
- [ ] Can access user-profile.html
- [ ] **CAN** see "My Approvals" link in sidebar
- [ ] **CAN** access user-approvals.html
- [ ] Sidebar shows "Area Chair Portal" and "Area Chair Access"
- [ ] Can edit profile (except name fields)
- [ ] Can save profile changes successfully
- [ ] Can approve/reject documents

#### Admin/Dean Role Testing
- [ ] Redirected to homepage.html when accessing user pages
- [ ] Cannot access user-dashboard.html
- [ ] Cannot access user-approvals.html
- [ ] Has access to admin-specific pages

#### Evaluator Role Testing
- [ ] Redirected to evaluator-dashboard.html when accessing user pages
- [ ] Cannot access user-dashboard.html
- [ ] Cannot access user-approvals.html
- [ ] Has time-limited access

### 9. Implementation Steps

**Step 1: Add user-session.js to all user pages**
```html
<!-- Before closing </body> tag -->
<script src="js/user-session.js"></script>
<script src="js/[page-specific].js"></script>
```

**Step 2: Update page-specific JS files**
Remove duplicate session validation code and use `initializeUserPage()`:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const session = initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;
    
    // Page-specific code here
});
```

**Step 3: Test role-based access**
- Register users with different roles
- Login and verify correct dashboard redirect
- Test navigation between pages
- Verify "My Approvals" visibility

**Step 4: Test profile edit functionality**
- Click "Edit Profile" button
- Verify only editable fields are enabled
- Make changes and save
- Verify changes persist after page reload

### 10. Security Considerations

**Client-Side Protection:**
- Role validation on every page load
- Automatic redirect for unauthorized roles
- Session token validation
- Heartbeat mechanism to detect inactive sessions

**Backend Protection (Required):**
- API endpoints must validate user role
- JWT token verification on all protected routes
- Role-based permissions on document operations
- Audit logging for sensitive operations

**Note:** Client-side protection is not sufficient for production. Backend API endpoints MUST implement proper role-based access control.

### 11. Troubleshooting

**Issue: User redirected to wrong dashboard**
- Check `users.role` value in database
- Verify role is lowercase and matches ENUM values
- Check localStorage for correct user object

**Issue: "My Approvals" link visible for faculty**
- Verify `user-session.js` is loaded before page-specific scripts
- Check role value in localStorage
- Clear browser cache and localStorage

**Issue: Profile edit not saving**
- Check browser console for errors
- Verify API endpoint is accessible
- Check JWT token is valid
- Verify user has permission to update profile

**Issue: Sidebar not showing user info**
- Check `sidebarInitials`, `sidebarName`, `sidebarRole` elements exist
- Verify API `/api/user/profile/:userId` returns data
- Check browser console for fetch errors

### 12. Future Enhancements

1. **Backend Role Validation**
   - Implement middleware to validate user roles on API endpoints
   - Add role-based permissions for document operations

2. **Real-time Notifications**
   - WebSocket integration for real-time approval notifications
   - Push notifications for document status changes

3. **Advanced Approval Workflow**
   - Multi-level approval process
   - Conditional approval routing based on document type

4. **Audit Trail**
   - Log all profile changes
   - Track document access and modifications
   - Generate audit reports

5. **Profile Picture Upload**
   - Allow users to upload profile pictures
   - Display in sidebar and profile page

## Summary

This implementation provides:
- ✅ Centralized session management
- ✅ Role-based access control
- ✅ Dynamic sidebar population
- ✅ Fixed profile edit functionality
- ✅ Hidden "My Approvals" for faculty
- ✅ Visible "My Approvals" for area-chair
- ✅ Proper role-based redirects
- ✅ Mobile-responsive sidebar
- ✅ Active navigation highlighting
- ✅ Heartbeat mechanism
- ✅ Centralized logout

All user pages now share consistent behavior and proper role-based access control.
