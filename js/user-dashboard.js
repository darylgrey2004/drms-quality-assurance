// js/user-dashboard.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('User Dashboard JS loaded successfully');

    // ── Sidebar: load user info + logout + heartbeat ──
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) { window.location.href = 'landing.html'; return; }
    const role = (user.role || '').toLowerCase().trim();
    const initials = (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
    const el = (id) => document.getElementById(id);
    if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
    if (el('sidebarName')) el('sidebarName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (el('sidebarRole')) el('sidebarRole').textContent = user.role || 'Faculty Member';
    const portalLabels = {
        'faculty member': 'Faculty Portal',
        'area chair/program head': 'Area Chair Portal'
    };
    if (el('sidebarPortal')) el('sidebarPortal').textContent = portalLabels[role] || `${user.role} Portal`;
    const accessLabels = { 'faculty member': 'Faculty Access', 'area chair/program head': 'Area Chair Access' };
    if (el('sidebarAccess')) el('sidebarAccess').textContent = accessLabels[role] || `${user.role} Access`;
    // Fetch department from profile to match user-profile.html display
    fetch(`http://localhost:3000/api/user/profile/${user.id}`, {
        headers: { 'x-auth-token': token }
    }).then(r => r.json()).then(data => {
        if (el('sidebarRole')) {
            const dept = data.department ? ` · ${data.department}` : '';
            el('sidebarRole').textContent = `${data.role || user.role || 'Faculty Member'}${dept}`;
        }
    }).catch(() => {});
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'landing.html';
            }
        });
    }
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);
    // Hide My Approvals link for Faculty Member
    if (role === 'faculty member') {
        const approvalsLink = document.querySelector('a[href="user-approvals.html"]');
        if (approvalsLink) approvalsLink.style.display = 'none';
    }
    // ─────────────────────────────────────────────────
    
    // Upload buttons in deadlines
    const uploadButtons = document.querySelectorAll('.text-xs.text-teal-700.hover\\:text-teal-800');
    uploadButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'user-upload.html';
        });
    });
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'user-dashboard.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1f5a6e';
        }
    });

    function getApiErrorMessage(payload, fallback) {
        return payload?.error?.details || payload?.error?.message || payload?.msg || fallback;
    }

    async function apiRequest(path) {
        const response = await fetch(`http://localhost:3000${path}`, {
            headers: { 'x-auth-token': token }
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Request failed'));
        return payload;
    }

    function updateDashboardStats(stats) {
        const status = stats?.byStatus || {};
        const total = Number(stats?.total || 0);
        const pending = Number(status.pending || 0);
        const validated = Number(status.validated || 0);
        const approved = Number(status.approved || 0);
        const statValues = document.querySelectorAll('.stat-card .text-3xl');
        if (statValues[0]) statValues[0].textContent = String(total);
        if (statValues[1]) statValues[1].textContent = String(pending + validated);
        if (statValues[2]) statValues[2].textContent = String(approved);
    }

    function renderRecentDocuments(documents) {
        const body = document.querySelector('tbody');
        if (!body) return;
        body.innerHTML = (documents || []).slice(0, 5).map((doc) => `
            <tr>
                <td class="py-3">
                    <div class="font-medium text-gray-800">${doc.title || 'Untitled'}</div>
                    <div class="text-xs text-gray-400">${doc.category || '-'}</div>
                </td>
                <td class="py-3 text-gray-600">${doc.area || '-'}</td>
                <td class="py-3"><span class="badge-pending px-2 py-1 rounded-full text-xs">${doc.workflow_status || 'pending'}</span></td>
                <td class="py-3 text-gray-600">${doc.version || 'v1.0'}</td>
                <td class="py-3 text-gray-500">${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('');
    }

    async function loadDashboardData() {
        try {
            const [stats, documents] = await Promise.all([
                apiRequest('/api/documents/stats'),
                apiRequest('/api/documents')
            ]);
            updateDashboardStats(stats);
            renderRecentDocuments(documents);
        } catch (error) {
            console.error('Dashboard load failed:', error);
        }
    }

    loadDashboardData();
});