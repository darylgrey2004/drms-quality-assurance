// js/user-documents.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Documents JS loaded');

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
    if (role === 'faculty member') {
        const approvalsLink = document.querySelector('a[href="user-approvals.html"]');
        if (approvalsLink) approvalsLink.style.display = 'none';
    }
    // ─────────────────────────────────────────────────
    
    // Search functionality
    const searchInput = document.getElementById('searchDocuments');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const filterBtn = document.querySelector('.bg-teal-700.text-white');
    const documentsTable = document.getElementById('documentsTable');
    let documentsCache = [];

    function formatUploadDate(isoDate) {
        const date = new Date(isoDate);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

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

    function renderRows(rows) {
        if (!documentsTable) return;
        documentsTable.innerHTML = rows.map((doc) => `
            <tr data-id="${doc.id}">
                <td class="py-3">
                    <div class="font-medium text-gray-800">${doc.title || 'Untitled Document'}</div>
                    <div class="text-xs text-gray-400">${doc.author_name || 'Uploader'}</div>
                </td>
                <td class="py-3"><span class="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">${doc.category || '-'}</span></td>
                <td class="py-3 text-gray-600">${doc.area || '-'}</td>
                <td class="py-3"><span class="badge-pending px-2 py-1 rounded-full text-xs">${doc.workflow_status || 'pending'}</span></td>
                <td class="py-3 text-gray-600">${doc.version || 'v1.0'}</td>
                <td class="py-3 text-gray-400">${formatUploadDate(doc.created_at)}</td>
                <td class="py-3">
                    <button class="text-teal-600 hover:text-teal-800 mr-2 view-doc">👁️</button>
                    <button class="text-gray-500 hover:text-gray-700 mr-2 attach-doc">📎</button>
                </td>
            </tr>
        `).join('');
    }
    
    function filterDocuments() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const status = statusFilter?.value || 'all';
        const category = categoryFilter?.value || 'all';
        
        const tableRows = document.querySelectorAll('#documentsTable tr');
        tableRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowStatus = row.querySelector('td:nth-child(4) span')?.textContent.toLowerCase() || '';
            const rowCategory = row.querySelector('td:nth-child(2) span')?.textContent.toLowerCase() || '';
            
            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesStatus = status === 'all' || rowStatus.includes(status);
            const matchesCategory = category === 'all' || rowCategory.includes(category);
            
            if (matchesSearch && matchesStatus && matchesCategory) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });
    }
    
    if (searchInput) searchInput.addEventListener('input', filterDocuments);
    if (statusFilter) statusFilter.addEventListener('change', filterDocuments);
    if (categoryFilter) categoryFilter.addEventListener('change', filterDocuments);
    if (filterBtn) filterBtn.addEventListener('click', filterDocuments);

    documentsTable?.addEventListener('click', async (e) => {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;
        const id = row.getAttribute('data-id');
        if (e.target.closest('.view-doc') || e.target.closest('.attach-doc')) {
            try {
                const files = await apiRequest(`/api/documents/${id}/files`);
                if (!Array.isArray(files) || files.length === 0) {
                    alert('No files available for this document.');
                    return;
                }
                window.open(`http://localhost:3000${files[0].url_path}`, '_blank');
            } catch (error) {
                alert(error.message || 'Failed to load document files');
            }
        }
    });
    
    apiRequest('/api/documents')
        .then((rows) => {
            documentsCache = Array.isArray(rows) ? rows : [];
            renderRows(documentsCache);
            filterDocuments();
        })
        .catch((error) => {
            console.error('Failed to load documents', error);
        });
});