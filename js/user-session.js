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

    // Dean/Admin should use the admin-style pages/sidebar.
    // Redirecting here temporarily hides old user sidebar for these roles.
    if (normalizedRole === 'dean' || normalizedRole === 'admin') {
        window.location.href = 'homepage.html';
        return;
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
