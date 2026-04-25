// js/user-search.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Search JS loaded');

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

    // DOM elements
    const searchInput = document.getElementById('mainSearch');
    const searchBtn = document.getElementById('searchBtn');
    const toggleFilters = document.getElementById('toggleFilters');
    const advancedFilters = document.getElementById('advancedFilters');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const filterDate = document.getElementById('filterDate');
    const sortSelect = document.getElementById('sortResults');
    const resultCount = document.getElementById('resultCount');
    const resultsContainer = document.getElementById('listView') || document.getElementById('searchResults');
    const paginationInfo = document.getElementById('paginationInfo');
    let allDocuments = [];

    // Toggle advanced filters
    if (toggleFilters && advancedFilters) {
        toggleFilters.addEventListener('click', function() {
            advancedFilters.classList.toggle('hidden');
            this.querySelector('span').textContent = advancedFilters.classList.contains('hidden') ? '▼' : '▲';
        });
    }

    // Search function
    function renderResults(rows) {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = rows.map((doc) => `
            <div class="search-result bg-white rounded-lg border border-gray-200 p-4 mb-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-semibold text-gray-800">${doc.title || 'Untitled'}</h3>
                        <p class="text-xs text-gray-500">${doc.category || '-'} · ${doc.area || '-'} · ${doc.workflow_status || '-'}</p>
                    </div>
                    <button class="view-result text-teal-700" data-id="${doc.id}">View</button>
                </div>
            </div>
        `).join('');
        if (paginationInfo) paginationInfo.textContent = `Showing ${rows.length} of ${allDocuments.length} documents`;
        resultsContainer.querySelectorAll('.view-result').forEach((btn) => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                const files = await fetch(`http://localhost:3000/api/documents/${id}/files`, {
                    headers: { 'x-auth-token': token }
                }).then((r) => r.json()).catch(() => []);
                if (Array.isArray(files) && files.length > 0) {
                    window.open(`http://localhost:3000${files[0].url_path}`, '_blank');
                }
            });
        });
    }

    function performSearch() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const category = filterCategory?.value || 'all';
        const status = filterStatus?.value || 'all';
        
        const filtered = allDocuments.filter((doc) => {
            const text = `${doc.title || ''} ${doc.author_name || ''} ${doc.area || ''}`.toLowerCase();
            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesCategory = category === 'all' || String(doc.category || '').toLowerCase() === category;
            const matchesStatus = status === 'all' || String(doc.workflow_status || '').toLowerCase() === status;
            return matchesSearch && matchesCategory && matchesStatus;
        });
        if (resultCount) resultCount.textContent = String(filtered.length);
        renderResults(filtered);
    }

    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    // Search on input (with debounce)
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(performSearch, 300);
        });
    }

    // Filter changes
    if (filterCategory) filterCategory.addEventListener('change', performSearch);
    if (filterStatus) filterStatus.addEventListener('change', performSearch);
    if (filterDate) filterDate.addEventListener('change', performSearch);

    // Sort results
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            alert(`Sort by ${sortBy} would reorder results in the full system.`);
        });
    }

    fetch('http://localhost:3000/api/documents', {
        headers: { 'x-auth-token': token }
    })
        .then((r) => r.json())
        .then((docs) => {
            allDocuments = Array.isArray(docs) ? docs : [];
            if (resultCount) resultCount.textContent = String(allDocuments.length);
            renderResults(allDocuments);
        })
        .catch(() => {
            allDocuments = [];
            renderResults([]);
        });
});