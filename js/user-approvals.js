// js/user-approvals.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Approvals JS loaded');
    // ── Role guard ──
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) { window.location.href = 'landing.html'; return; }
    const role = (user.role || '').toLowerCase().trim();
    if (role === 'faculty member') { window.location.href = 'user-dashboard.html'; return; }
    if (role === 'dean' || role === 'qa coordinator' || role === 'admin') { window.location.href = 'homepage.html'; return; }
    // ── Sidebar ──
    const portalLabels = {
        'faculty member': 'Faculty Portal',
        'area chair/program head': 'Area Chair Portal'
    };
    const el = (id) => document.getElementById(id);
    const initials = (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
    if (el('sidebarInitials')) el('sidebarInitials').textContent = initials;
    if (el('sidebarName')) el('sidebarName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (el('sidebarRole')) el('sidebarRole').textContent = user.role || '';
    if (el('sidebarPortal')) el('sidebarPortal').textContent = portalLabels[role] || `${user.role} Portal`;
    const accessLabels = { 'faculty member': 'Faculty Access', 'area chair/program head': 'Area Chair Access' };
    if (el('sidebarAccess')) el('sidebarAccess').textContent = accessLabels[role] || `${user.role} Access`;
    fetch(`http://localhost:3000/api/user/profile/${user.id}`, {
        headers: { 'x-auth-token': token }
    }).then(r => r.json()).then(data => {
        if (el('sidebarRole')) {
            const dept = data.department ? ` · ${data.department}` : '';
            el('sidebarRole').textContent = `${data.role || user.role}${dept}`;
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
    // ────────────────────────────────────────────────────────

    const approvalsList = document.getElementById('approvalsList');
    const searchInput = document.getElementById('searchApprovals');
    const areaFilter = document.getElementById('areaFilter');
    let queue = [];

    function api(path, options) {
        return fetch(`http://localhost:3000${path}`, {
            ...(options || {}),
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
                ...((options && options.headers) || {})
            }
        }).then(async (res) => {
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload.error?.message || payload.msg || 'Request failed');
            return payload;
        });
    }

    function render() {
        if (!approvalsList) return;
        const term = String(searchInput?.value || '').toLowerCase();
        const area = String(areaFilter?.value || 'all').toLowerCase();
        const filtered = queue.filter((doc) => {
            const haystack = `${doc.title || ''} ${doc.area || ''} ${doc.category || ''}`.toLowerCase();
            return (!term || haystack.includes(term)) && (area === 'all' || String(doc.area || '').toLowerCase().includes(area));
        });
        approvalsList.innerHTML = filtered.map((doc) => `
            <div class="border-l-4 border-blue-500 bg-white p-4 rounded-lg shadow-sm mb-3" data-id="${doc.id}">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-semibold">${doc.title || 'Untitled'}</h3>
                        <p class="text-xs text-gray-500">${doc.category || '-'} · ${doc.area || '-'}</p>
                    </div>
                    <div class="space-x-2">
                        <button class="validate-btn text-teal-700">Validate</button>
                        <button class="reject-btn text-red-600">Reject</button>
                    </div>
                </div>
            </div>
        `).join('');
        const pendingElement = document.querySelector('.grid .stat-card:first-child .text-3xl');
        if (pendingElement) pendingElement.textContent = String(filtered.length);
    }

    async function loadQueue() {
        queue = await api('/api/documents/approvals');
        render();
    }

    approvalsList?.addEventListener('click', async (e) => {
        const wrap = e.target.closest('[data-id]');
        if (!wrap) return;
        const id = wrap.getAttribute('data-id');
        try {
            if (e.target.closest('.validate-btn')) {
                await api(`/api/documents/${id}/validate`, { method: 'POST' });
            } else if (e.target.closest('.reject-btn')) {
                const reason = prompt('Provide feedback for rejection:') || '';
                await api(`/api/documents/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
            } else {
                return;
            }
            await loadQueue();
        } catch (error) {
            alert(error.message || 'Approval action failed');
        }
    });

    searchInput?.addEventListener('input', render);
    areaFilter?.addEventListener('change', render);
    loadQueue().catch((error) => alert(error.message || 'Failed to load approvals'));
});