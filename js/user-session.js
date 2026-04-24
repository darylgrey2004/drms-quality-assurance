// Shared session UI for all user portal pages.
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    const el = (id) => document.getElementById(id);
    const resolvedUserId = resolveUserId(user, token);
    const normalizedRole = (user.role || '').toString().toLowerCase().trim();
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();

    // Admin should always use admin-style pages/sidebar.
    if (normalizedRole === 'admin') {
        window.location.href = 'homepage.html';
        return;
    }

    // Dean can access the shared profile page, but keeps admin-style pages elsewhere.
    if (normalizedRole === 'dean' && currentPage !== 'user-profile.html') {
        window.location.href = 'homepage.html';
        return;
    }

    function syncDeanProfileSidebar() {
        if (normalizedRole !== 'dean' || currentPage !== 'user-profile.html') return;
        const nav = document.querySelector('aside nav');
        if (!nav) return;

        nav.innerHTML = `
            <a href="homepage.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">📊</span> Dashboard
            </a>
            <a href="documents.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">📄</span> Documents
            </a>
            <a href="upload.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">⬆️</span> Upload
            </a>
            <a href="evidence-map.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">🗺️</span> Evidence Map
            </a>
            <a href="search.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">🔍</span> Search
            </a>
            <a href="approvals.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">✅</span> Approvals
            </a>
            <a href="reports.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">📈</span> Reports
            </a>
            <a href="users.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">👥</span> Users
            </a>
            <a href="audit-trail.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">📋</span> Audit Trail
            </a>
            <a href="settings.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav">
                <span class="mr-3 text-teal-300/70">⚙️</span> Settings
            </a>
            <a href="user-profile.html" class="flex items-center px-3 py-2.5 rounded-md text-gray-100 bg-teal-800/40 border-l-4 border-teal-400 active-nav">
                <span class="mr-3 text-teal-300">👤</span> Profile
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
            'area chair/program head': 'Area Chair Portal'
        };
        const accessLabels = {
            'faculty member': 'Faculty Access',
            'area chair/program head': 'Area Chair Access'
        };

        if (el('sidebarPortal')) el('sidebarPortal').textContent = portalLabels[role] || `${roleValue} Portal`;
        if (el('sidebarAccess')) el('sidebarAccess').textContent = accessLabels[role] || `${roleValue} Access`;

        if (el('sidebarRole')) {
            const department = data.department ? ` · ${data.department}` : '';
            el('sidebarRole').textContent = `${roleValue}${department}`;
        }
        if (el('welcomeUserText')) el('welcomeUserText').textContent = `Welcome back, ${first}`;
    }

    syncDeanProfileSidebar();
    applyIdentity(user);

    // Re-apply after page-level scripts run to prevent blank sidebar identity.
    const reapplyIdentity = () => {
        const latestUser = JSON.parse(localStorage.getItem('user') || '{}');
        applyIdentity({ ...user, ...latestUser });
    };
    setTimeout(reapplyIdentity, 0);
    setTimeout(reapplyIdentity, 300);

    // Pull complete profile to ensure name/role/department stay consistent across pages.
    if (resolvedUserId) {
        fetch(`http://localhost:3000/api/user/profile/${resolvedUserId}`, {
            headers: { 'x-auth-token': token }
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Failed to load profile');
                return response.json();
            })
            .then((profileData) => {
                const mergedUser = { ...user, ...profileData };
                localStorage.setItem('user', JSON.stringify(mergedUser));
                applyIdentity(mergedUser);
            })
            .catch(() => {
                // Keep sidebar values from localStorage fallback when profile API is unavailable.
            });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }
});
