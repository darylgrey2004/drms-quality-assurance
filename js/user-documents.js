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
    const tableRows = document.querySelectorAll('#documentsTable tr');
    
    function filterDocuments() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const status = statusFilter?.value || 'all';
        const category = categoryFilter?.value || 'all';
        
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
    
    // Document action buttons
    document.querySelectorAll('.view-doc').forEach(btn => {
        btn.addEventListener('click', () => alert('Document viewer would open'));
    });
    
    document.querySelectorAll('.attach-doc').forEach(btn => {
        btn.addEventListener('click', () => alert('Attachments panel would open'));
    });
    
    document.querySelectorAll('.version-doc').forEach(btn => {
        btn.addEventListener('click', () => alert('Version history would open'));
    });
    
    // Pagination
    document.querySelectorAll('.flex.gap-2 button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === 'Previous' || this.textContent === 'Next') {
                alert(this.textContent + ' page');
            } else if (this.textContent.match(/^\d+$/)) {
                document.querySelectorAll('.flex.gap-2 button').forEach(b => {
                    b.classList.remove('bg-teal-700', 'text-white');
                    b.classList.add('bg-white', 'border', 'text-gray-600');
                });
                this.classList.add('bg-teal-700', 'text-white');
            }
        });
    });
});