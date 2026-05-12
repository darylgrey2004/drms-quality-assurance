// Shared session UI for all user portal pages.

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

// Function to update the approvals badge count
function updateApprovalsBadge(count) {
    const badge = document.getElementById('approvalsBadge');
    if (badge) {
        badge.textContent = count || '0';
        if (count > 0) {
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'inline-block';
            badge.textContent = '0';
        }
    }
}

// Export function to be called from other pages
window.updateApprovalsBadge = updateApprovalsBadge;

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Only redirect if token is completely missing - don't redirect if just user data is missing
    if (!token || typeof token !== 'string' || token.trim() === '') {
        console.warn('No valid token found');
        window.location.href = 'landing.html';
        return;
    }

    const el = (id) => document.getElementById(id);
    const resolvedUserId = resolveUserId(user, token);
    const normalizedRole = (user.role || '').toString().toLowerCase().trim();
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();

    // Admin should always use admin-style pages/sidebar.
    if (normalizedRole === 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Dean can access the shared profile page, but keeps admin-style pages elsewhere.
    if (normalizedRole === 'dean' && currentPage !== 'user-profile.html') {
        window.location.href = 'index.html';
        return;
    }

    // Function to update sidebar navigation based on role
    function updateSidebarNavigation() {
        const nav = document.querySelector('aside nav');
        if (!nav) return;

        // Check if we're on a user portal page (not dean profile)
        const isUserPortal = currentPage.includes('user-') || currentPage === 'user-dashboard.html' || 
                            currentPage === 'user-documents.html' || currentPage === 'user-upload.html' ||
                            currentPage === 'user-evidence-map.html' || currentPage === 'user-search.html' ||
                            currentPage === 'user-profile.html';

        if (!isUserPortal && normalizedRole !== 'dean') return;

        // For Dean on profile page, use admin sidebar
        if (normalizedRole === 'dean' && currentPage === 'user-profile.html') {
            nav.innerHTML = `
                <a href="index.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Dashboard</span>
                </a>
                <a href="documents.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Documents</span>
                </a>
                <a href="upload.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Upload</span>
                </a>
                <a href="evidence-map.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Evidence Map</span>
                </a>
                <a href="search.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Search</span>
                </a>
                <a href="approvals.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Approvals</span>
                </a>
                <a href="reports.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Reports</span>
                </a>
                <a href="users.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Users</span>
                </a>
                <a href="audit-trail.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Audit Trail</span>
                </a>
                <a href="settings.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Settings</span>
                </a>
                <a href="user-profile.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-100 bg-teal-800/40 border-l-4 border-teal-400 active-nav">
                    <span class="mr-3 text-teal-300 w-5">Profile</span>
                </a>
            `;
            return;
        }

        // Determine if user is Department Head (can see My Approvals)
        const isDeptHead = normalizedRole === 'department-head' || normalizedRole === 'area-chair' || normalizedRole === 'area chair/program head';
        
        // For Faculty (no My Approvals) vs Department Head (with My Approvals)
        if (isDeptHead) {
            // Department Head sidebar - includes My Approvals with badge
            nav.innerHTML = `
                <a href="user-dashboard.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Dashboard</span>
                </a>
                <a href="user-documents.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">My Documents</span>
                </a>
                <a href="user-upload.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Upload Document</span>
                </a>
                <a href="user-evidence-map.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Evidence Map</span>
                </a>
                <a href="user-search.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Search</span>
                </a>
                <a href="user-approvals.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">My Approvals</span>
                    <span class="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full" id="approvalsBadge">0</span>
                </a>
                <a href="user-profile.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Profile</span>
                </a>
            `;
        } else {
            // Faculty sidebar - NO My Approvals
            nav.innerHTML = `
                <a href="user-dashboard.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Dashboard</span>
                </a>
                <a href="user-documents.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">My Documents</span>
                </a>
                <a href="user-upload.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Upload Document</span>
                </a>
                <a href="user-evidence-map.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Evidence Map</span>
                </a>
                <a href="user-search.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Search</span>
                </a>
                <a href="user-profile.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                    <span class="mr-3 text-teal-300/70 w-5">Profile</span>
                </a>
            `;
        }
        
        // Update active state for current page
        setTimeout(() => {
            const currentHref = currentPage;
            const navLinks = document.querySelectorAll('aside nav a');
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentHref) {
                    navLinks.forEach(l => {
                        l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                    });
                    link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                }
            });
        }, 50);
    }

    function syncDeanProfileSidebar() {
        if (normalizedRole !== 'dean' || currentPage !== 'user-profile.html') return;
        const nav = document.querySelector('aside nav');
        if (!nav) return;

        nav.innerHTML = `
            <a href="index.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Dashboard</span>
            </a>
            <a href="documents.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Documents</span>
            </a>
            <a href="upload.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Upload</span>
            </a>
            <a href="evidence-map.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Evidence Map</span>
            </a>
            <a href="search.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Search</span>
            </a>
            <a href="approvals.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Approvals</span>
            </a>
            <a href="reports.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Reports</span>
            </a>
            <a href="users.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Users</span>
            </a>
            <a href="audit-trail.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Audit Trail</span>
            </a>
            <a href="settings.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70 w-5">Settings</span>
            </a>
            <a href="user-profile.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-100 bg-teal-800/40 border-l-4 border-teal-400 active-nav">
                <span class="mr-3 text-teal-300 w-5">Profile</span>
            </a>
        `;
    }

    if (resolvedUserId) {
        localStorage.setItem('user', JSON.stringify({
            ...user,
            id: resolvedUserId
        }));
    }

    function resolveUserId(userData, authToken) {
        try {
            if (authToken) {
                const base64Url = authToken.split('.')[1] || '';
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
                const payload = JSON.parse(atob(padded));
                const tokenId = Number(payload?.user?.id ?? payload?.id ?? null);
                if (Number.isFinite(tokenId) && tokenId > 0) return tokenId;
            }
        } catch (_error) {
            // Fall back to localStorage user object when token parsing fails.
        }
        const idFromStorage = Number(userData?.id ?? userData?.userId ?? userData?._id ?? null);
        if (Number.isFinite(idFromStorage) && idFromStorage > 0) return idFromStorage;
        return null;
    }

    function getFullName(data) {
        const firstLast = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        if (firstLast) return firstLast;
        if (data.fullName) return String(data.fullName).trim();
        if (data.name) return String(data.name).trim();
        if (data.email) return String(data.email).split('@')[0];
        return 'Faculty User';
    }

    function getInitials(data, fullName) {
        const fromFirstLast = (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '');
        if (fromFirstLast.trim()) return fromFirstLast.toUpperCase();
        const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
        return ((parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '')).toUpperCase() || 'FU';
    }

    function applyIdentity(data) {
        const roleValue = data.role || 'Faculty Member';
        const role = roleValue.toLowerCase().trim();
        const fullName = getFullName(data);
        const initials = getInitials(data, fullName);
        const first = data.firstName || fullName.split(' ')[0] || 'User';

        if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
        if (el('sidebarName')) el('sidebarName').textContent = fullName;

        const portalLabels = {
            'faculty member': 'Faculty Portal',
            'faculty': 'Faculty Portal',
            'area chair/program head': 'Department Head Portal',
            'area-chair': 'Department Head Portal',
            'department-head': 'Department Head Portal'
        };
        const accessLabels = {
            'faculty member': 'Faculty Access',
            'faculty': 'Faculty Access',
            'area chair/program head': 'Department Head Access',
            'area-chair': 'Department Head Access',
            'department-head': 'Department Head Access'
        };
        
        // Map role values to display names
        const roleDisplayMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'faculty': 'Faculty',
            'faculty member': 'Faculty',
            'area-chair': 'Department Head',
            'area chair/program head': 'Department Head',
            'department-head': 'Department Head',
            'evaluator': 'External Evaluator'
        };
        
        const displayRole = roleDisplayMap[role] || roleValue;

        if (el('sidebarPortal')) el('sidebarPortal').textContent = portalLabels[role] || `${displayRole} Portal`;
        if (el('sidebarAccess')) el('sidebarAccess').textContent = accessLabels[role] || `${displayRole} Access`;

        if (el('sidebarRole')) {
            const department = data.department ? ` · ${data.department}` : '';
            el('sidebarRole').textContent = `${displayRole}${department}`;
        }
        if (el('welcomeUserText')) el('welcomeUserText').textContent = `Welcome back, ${first}`;
    }

    syncDeanProfileSidebar();
    applyIdentity(user);
    
    // Update sidebar navigation based on role (for user portal pages)
    const isUserPortalPage = currentPage.includes('user-') || currentPage === 'user-dashboard.html' || 
                            currentPage === 'user-documents.html' || currentPage === 'user-upload.html' ||
                            currentPage === 'user-evidence-map.html' || currentPage === 'user-search.html' ||
                            currentPage === 'user-profile.html';
    
    if (isUserPortalPage && normalizedRole !== 'dean') {
        updateSidebarNavigation();
    }

    // Re-apply after page-level scripts run to prevent blank sidebar identity.
    const reapplyIdentity = () => {
        const latestUser = JSON.parse(localStorage.getItem('user') || '{}');
        applyIdentity({ ...user, ...latestUser });
    };
    setTimeout(reapplyIdentity, 0);
    setTimeout(reapplyIdentity, 300);

    // Pull complete profile to ensure name/role/department stay consistent across pages.
    if (resolvedUserId) {
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/profile/${resolvedUserId}`, {
            headers: { 'x-auth-token': token }
        })
            .then(async (response) => {
                // Only process successful responses
                if (response.status === 401 || response.status === 403) {
                    // Token invalid or unauthorized, clear session
                    console.error('Token validation failed, clearing session');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    alert('Your session has expired or your account has been deleted. Please login again.');
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

    // Logout handled by logout-modal.js
    // No need to attach handler here to prevent duplicates
    
    // Setup heartbeat to check for account deletion
    function sendHeartbeat() {
        if (!token) return;
        
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({})
        })
        .then(response => {
            if (response.status === 401) {
                return response.json().then(data => {
                    if (data.accountDeleted) {
                        // Account was deleted by admin
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        alert('Your account has been deleted by an administrator. You will be logged out.');
                        window.location.href = 'landing.html';
                    }
                });
            }
            return response.json();
        })
        .catch(err => {
            console.warn('Heartbeat failed:', err.message);
        });
    }
    
    // Send heartbeat every 30 seconds to check account status
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 30 * 1000);
    }
});