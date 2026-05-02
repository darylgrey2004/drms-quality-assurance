// js/sidebar-updater.js
// Shared utility to update sidebar user information across all admin/dean pages

function updateSidebarUserInfo() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update user initials
    const userInitialsElem = document.getElementById('userInitials');
    if (userInitialsElem && userData.firstName && userData.lastName) {
        const initials = (userData.firstName[0] + userData.lastName[0]).toUpperCase();
        userInitialsElem.textContent = initials;
    }
    
    // Update user name
    const userNameElem = document.getElementById('userName');
    if (userNameElem && userData.firstName && userData.lastName) {
        userNameElem.textContent = `${userData.firstName} ${userData.lastName}`;
    }
    
    // Update user role
    const userRoleElem = document.getElementById('userRole');
    if (userRoleElem && userData.role) {
        const roleMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'faculty': 'Faculty Member',
            'area-chair': 'Dept. Head',
            'department-head': 'Dept. Head',
            'evaluator': 'External Evaluator'
        };
        userRoleElem.textContent = roleMap[userData.role] || userData.role;
    }
    
    // Update footer access level
    const footerAccessElem = document.querySelector('.border-t.border-teal-900\\/40 .text-teal-300');
    if (footerAccessElem && userData.role) {
        const accessMap = {
            'admin': 'Admin · Full Access',
            'dean': 'Dean · Full Access',
            'faculty': 'Faculty · Limited Access',
            'area-chair': 'Dept. Head · Department Access',
            'department-head': 'Dept. Head · Department Access',
            'evaluator': 'Evaluator · Read-Only Access'
        };
        footerAccessElem.textContent = accessMap[userData.role] || 'User Access';
    }
}

// Call immediately when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateSidebarUserInfo);
} else {
    updateSidebarUserInfo();
}
