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

    // DOM elements
    const searchInput = document.getElementById('searchApprovals');
    const priorityFilter = document.getElementById('priorityFilter');
    const areaFilter = document.getElementById('areaFilter');
    const viewBtns = document.querySelectorAll('.view-btn');
    const validateBtns = document.querySelectorAll('.validate-btn');
    const rejectBtns = document.querySelectorAll('.reject-btn');

    // Filter function
    function filterApprovals() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const priority = priorityFilter?.value || 'all';
        const area = areaFilter?.value || 'all';

        document.querySelectorAll('.border-l-4').forEach(item => {
            const text = item.textContent.toLowerCase();
            const hasUrgent = item.classList.contains('border-red-500');
            const areaText = item.querySelector('.bg-amber-100, .bg-blue-100, .bg-indigo-100')?.textContent.toLowerCase() || '';

            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesPriority = priority === 'all' || 
                (priority === 'urgent' && hasUrgent) ||
                (priority === 'normal' && !hasUrgent);
            const matchesArea = area === 'all' || areaText.includes(area);

            item.style.display = (matchesSearch && matchesPriority && matchesArea) ? 'block' : 'none';
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterApprovals);
    if (priorityFilter) priorityFilter.addEventListener('change', filterApprovals);
    if (areaFilter) areaFilter.addEventListener('change', filterApprovals);

    // Validate button
    validateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.border-l-4');
            const title = item.querySelector('h3')?.textContent || 'Document';
            
            if (confirm(`Validate "${title}"?`)) {
                alert('Document validated successfully!');
                item.remove();
                updateStats();
            }
        });
    });

    // View button
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.border-l-4');
            const title = item.querySelector('h3')?.textContent || 'Document';
            
            alert(`Opening review panel for: ${title}\n\nThis would show the document for detailed review.`);
        });
    });

    // Reject button
    rejectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.border-l-4');
            const title = item.querySelector('h3')?.textContent || 'Document';
            
            const reason = prompt(`Provide feedback for returning "${title}":`);
            if (reason) {
                alert(`Document returned to faculty.\nFeedback: ${reason}`);
                item.remove();
                updateStats();
            }
        });
    });

    // Update stats after actions
    function updateStats() {
        const pendingCount = document.querySelectorAll('.border-l-4').length;
        const pendingElement = document.querySelector('.grid .stat-card:first-child .text-3xl');
        if (pendingElement) {
            pendingElement.textContent = pendingCount;
        }
    }

    // Stats cards click (for demo)
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', function() {
            const label = this.querySelector('.text-gray-500')?.textContent;
            if (label === 'Pending Review') {
                alert('Showing all pending approvals');
            } else if (label === 'Approved (This Month)') {
                alert('Showing approved documents this month');
            }
        });
    });
});