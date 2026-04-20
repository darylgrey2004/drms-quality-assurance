// js/user-search.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Search JS loaded');

<<<<<<< HEAD
=======
<<<<<<< Updated upstream
=======
>>>>>>> registration-feature
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
<<<<<<< HEAD
=======
    const portalLabels = {
        'faculty member': 'Faculty Portal',
        'area chair/program head': 'Area Chair Portal'
    };
    if (el('sidebarPortal')) el('sidebarPortal').textContent = portalLabels[role] || `${user.role} Portal`;
    const accessLabels = { 'faculty member': 'Faculty Access', 'area chair/program head': 'Area Chair Access' };
    if (el('sidebarAccess')) el('sidebarAccess').textContent = accessLabels[role] || `${user.role} Access`;
>>>>>>> registration-feature
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

<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> registration-feature
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
    const searchResults = document.querySelectorAll('.search-result');
    const viewButtons = document.querySelectorAll('.view-result');

    // Toggle advanced filters
    if (toggleFilters && advancedFilters) {
        toggleFilters.addEventListener('click', function() {
            advancedFilters.classList.toggle('hidden');
            this.querySelector('span').textContent = advancedFilters.classList.contains('hidden') ? '▼' : '▲';
        });
    }

    // Search function
    function performSearch() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const category = filterCategory?.value || 'all';
        const status = filterStatus?.value || 'all';
        
        let visibleCount = 0;

        searchResults.forEach(result => {
            const text = result.textContent.toLowerCase();
            const categoryBadge = result.querySelector('.bg-teal-100, .bg-amber-100, .bg-indigo-100')?.textContent.toLowerCase() || '';
            const statusBadge = result.querySelector('.bg-green-100, .bg-amber-100, .bg-blue-100')?.textContent.toLowerCase() || '';

            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesCategory = category === 'all' || categoryBadge.includes(category);
            const matchesStatus = status === 'all' || statusBadge.includes(status);

            if (matchesSearch && matchesCategory && matchesStatus) {
                result.classList.remove('hidden');
                visibleCount++;
            } else {
                result.classList.add('hidden');
            }
        });

        if (resultCount) resultCount.textContent = visibleCount;
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

    // View result buttons
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const result = this.closest('.search-result');
            const title = result?.querySelector('h3')?.textContent || 'Document';
            alert(`Viewing: ${title}\n\nThis would open the document.`);
        });
    });

    // Pagination
    document.querySelectorAll('.flex.gap-2 button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === 'Previous' || this.textContent === 'Next') {
                alert(this.textContent + ' page');
            } else if (this.textContent.match(/^\d+$/)) {
                document.querySelectorAll('.flex.gap-2 button').forEach(b => {
                    if (b.textContent.match(/^\d+$/)) {
                        b.classList.remove('bg-teal-700', 'text-white');
                        b.classList.add('bg-white', 'border', 'text-gray-600');
                    }
                });
                this.classList.add('bg-teal-700', 'text-white');
                alert(`Page ${this.textContent}`);
            }
        });
    });
});