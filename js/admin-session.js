document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logoutBtn');
    const adminAccessLabel = document.getElementById('adminAccessLabel');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const el = (id) => document.getElementById(id);

    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    // Admin capability registry (single source of truth for admin functions).
    // Other admin page scripts can call window.AdminAccess.* helpers.
    const ADMIN_FUNCTIONS = {
        dashboard: 'View complete system overview with all metrics and statistics',
        documents: 'View, edit, delete, and manage any document regardless of category, department, or ownership',
        upload: 'Upload documents to any category (ISO, AACCUP, COE) and any area/clause',
        evidenceMap: 'View and edit all document-to-standard mappings (ISO clauses, AACCUP areas, COE indicators)',
        search: 'Search across all documents with all available filters',
        approvals: 'Approve, reject, or return documents at any workflow stage (Upload -> Validate -> Approve -> Lock)',
        reports: 'Generate all report types (completeness, compliance, workflow, user activity, gap analysis) and export PDF/Excel/CSV',
        users: 'Create, edit, delete, activate, deactivate users, assign roles, reset passwords, and view user activity logs',
        auditTrail: 'View complete system activity including user actions, document changes, logins, and settings modifications',
        settings: 'Configure system settings (general, workflow, standards, notifications, backup, API keys, security)',
        profile: 'Edit personal profile information and preferences',
        systemMaintenance: 'Perform system backups, clear caches, and run diagnostics',
        dataExport: 'Export system data in formats needed for external audits'
    };

    const DEAN_FUNCTIONS = {
        dashboard: 'View college-level statistics and overview across all departments',
        documents: 'View all documents across all departments (read-only)',
        evidenceMap: 'View document mapping to standards (read-only)',
        search: 'Search across all documents to find evidence for accreditation',
        approvals: 'Provide final approval after QA validation (approve only, no validation)',
        reports: 'Generate college-level and accreditation-readiness reports',
        users: 'View faculty list and user information (read-only)',
        auditTrail: 'View activity logs (read-only)',
        profile: 'Edit personal profile information and preferences'
    };

    const DEAN_RESTRICTIONS = {
        upload: 'Cannot upload documents directly',
        editDocuments: 'Cannot edit any document content',
        deleteDocuments: 'Cannot delete any documents',
        editEvidenceMap: 'Cannot edit or modify standard mappings',
        userManagement: 'Cannot create, edit, or delete user accounts',
        settings: 'Cannot modify system settings',
        fullAuditTrail: 'Cannot see detailed system-level audit logs',
        bulkActions: 'Cannot perform bulk document operations'
    };

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
        return 'System User';
    }

    function getInitials(data, fullName) {
        const fromFirstLast = (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '');
        if (fromFirstLast.trim()) return fromFirstLast.toUpperCase();
        const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
        return ((parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '')).toUpperCase() || 'SU';
    }

    function applyIdentity(data) {
        const roleValue = data.role || 'Admin';
        const role = roleValue.toString().toLowerCase().trim();
        const fullName = getFullName(data);
        const initials = getInitials(data, fullName);
        const department = data.department ? ` · ${data.department}` : '';

        if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
        if (el('sidebarName')) el('sidebarName').textContent = fullName;
        if (el('sidebarRole')) el('sidebarRole').textContent = `${roleValue}${department}`;
        if (el('sidebarPortal')) {
            const portalLabel = role === 'dean' ? 'Dean Portal' : role === 'admin' ? 'Admin Portal' : `${roleValue} Portal`;
            el('sidebarPortal').textContent = portalLabel;
        }
        if (adminAccessLabel) {
            adminAccessLabel.textContent = role === 'admin' ? 'Admin · Full Access' : `${roleValue} · Access`;
        }
    }

    function syncProfileSidebarLink(data) {
        const nav = document.querySelector('aside nav');
        if (!nav) return;

        const role = (data?.role || '').toString().toLowerCase().trim();
        const existingLink = nav.querySelector('a[data-nav-profile]');
        const shouldShowProfile = role !== 'admin';

        if (!shouldShowProfile) {
            if (existingLink) existingLink.remove();
            return;
        }

        if (existingLink) {
            existingLink.href = 'user-profile.html';
            return;
        }

        const profileLink = document.createElement('a');
        profileLink.href = 'user-profile.html';
        profileLink.setAttribute('data-nav-profile', 'true');
        profileLink.className = 'flex items-center px-3 py-2.5 rounded-md text-gray-300 hover-nav';
        profileLink.innerHTML = '<span class="mr-3 text-teal-300/70">👤</span> Profile';
        nav.appendChild(profileLink);
    }

    function getNormalizedRole(data) {
        return (data?.role || '').toString().toLowerCase().trim();
    }

    function isAdminAccount(data) {
        return getNormalizedRole(data) === 'admin';
    }

    function isDeanOrAdmin(data) {
        const role = getNormalizedRole(data);
        return role === 'dean' || role === 'admin';
    }

    function getAccountFunctions(data) {
        // Dean and Admin use admin sidebar/pages.
        // Admin gets full access; Dean gets college-level restricted access.
        if (isAdminAccount(data)) return { ...ADMIN_FUNCTIONS };
        if (getNormalizedRole(data) === 'dean') return { ...DEAN_FUNCTIONS };
        return {};
    }

    function hasFunction(functionKey, data = JSON.parse(localStorage.getItem('user') || '{}')) {
        const allowed = getAccountFunctions(data);
        return Object.prototype.hasOwnProperty.call(allowed, functionKey);
    }

    function getRestrictions(data) {
        return getNormalizedRole(data) === 'dean' ? { ...DEAN_RESTRICTIONS } : {};
    }

    function isReadOnlyScope(functionKey, data = JSON.parse(localStorage.getItem('user') || '{}')) {
        if (getNormalizedRole(data) !== 'dean') return false;
        const readOnlyFunctions = ['documents', 'evidenceMap', 'users', 'auditTrail'];
        return readOnlyFunctions.includes(functionKey);
    }

    // Expose helpers for other admin scripts/pages.
    window.AdminAccess = {
        getDefinitions: () => ({ ...ADMIN_FUNCTIONS }),
        getDeanDefinitions: () => ({ ...DEAN_FUNCTIONS }),
        getRestrictions: () => getRestrictions(JSON.parse(localStorage.getItem('user') || '{}')),
        getAccountFunctions: () => getAccountFunctions(JSON.parse(localStorage.getItem('user') || '{}')),
        hasFunction,
        isReadOnlyScope,
        isAdminAccount: () => isAdminAccount(JSON.parse(localStorage.getItem('user') || '{}'))
    };

    const resolvedUserId = resolveUserId(user, token);
    if (resolvedUserId) {
        localStorage.setItem('user', JSON.stringify({
            ...user,
            id: resolvedUserId
        }));
    }
    applyIdentity(user);
    syncProfileSidebarLink(user);

    // Guard: these pages are for Dean/Admin only.
    if (!isDeanOrAdmin(user)) {
        window.location.href = 'user-dashboard.html';
        return;
    }

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
                syncProfileSidebarLink(mergedUser);
            })
            .catch(() => {
                // Keep fallback from localStorage.
            });
    }

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
