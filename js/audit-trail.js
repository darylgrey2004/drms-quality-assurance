// js/audit-trail.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    const searchInput = document.getElementById('searchAudit');
    const actionTypeFilter = document.getElementById('actionTypeFilter');
    const userFilter = document.getElementById('userFilter');
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    const exportBtn = document.getElementById('exportAuditBtn');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const listView = document.getElementById('listView');
    const timelineView = document.getElementById('timelineView');
    const eventCount = document.getElementById('eventCount');
    const tableBody = document.querySelector('tbody');
    let auditData = [];

    function api(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: { 'x-auth-token': token }
        }).then((r) => r.json());
    }

    async function buildAuditData() {
        const docs = await api('/api/documents').catch(() => []);
        const rows = [];
        for (const doc of (Array.isArray(docs) ? docs : [])) {
            const logs = await api(`/api/documents/approval-logs/${doc.id}`).catch(() => []);
            if (Array.isArray(logs) && logs.length > 0) {
                logs.forEach((log) => {
                    rows.push({
                        id: log.id,
                        timestamp: log.created_at || doc.updated_at || doc.created_at,
                        user: `${log.firstName || ''} ${log.lastName || ''}`.trim() || 'System',
                        action: log.action || doc.workflow_status,
                        document: doc.title || 'Untitled',
                        details: log.reason || '-'
                    });
                });
            } else {
                rows.push({
                    id: `doc-${doc.id}`,
                    timestamp: doc.updated_at || doc.created_at,
                    user: doc.author_name || 'Uploader',
                    action: doc.workflow_status || 'updated',
                    document: doc.title || 'Untitled',
                    details: doc.description || '-'
                });
            }
        }
        return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    function renderRows(rows) {
        if (!tableBody) return;
        tableBody.innerHTML = rows.map((row) => `
            <tr class="audit-row">
                <td>${row.timestamp ? new Date(row.timestamp).toLocaleString() : '-'}</td>
                <td>${row.user}</td>
                <td><span>${row.action}</span></td>
                <td>${row.document}</td>
                <td><a href="#" class="view-details" data-id="${row.id}">View</a></td>
            </tr>
        `).join('');
    }
    
    // Filter function
    function filterAudit() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const actionType = actionTypeFilter ? actionTypeFilter.value : 'all';
        const user = userFilter ? userFilter.value : 'all';
        const dateRange = dateRangeFilter ? dateRangeFilter.value : 'month';
        
        let visibleCount = 0;
        
        const filtered = auditData.filter((row) => {
            const rowText = `${row.user} ${row.action} ${row.document} ${row.details}`.toLowerCase();
            const matchesSearch = searchTerm === '' || rowText.includes(searchTerm);
            const matchesAction = actionType === 'all' || String(row.action).toLowerCase().includes(actionType.toLowerCase());
            const matchesUser = user === 'all' || String(row.user).toLowerCase().includes(user.toLowerCase());
            let matchesDate = true;
            const when = row.timestamp ? new Date(row.timestamp) : null;
            if (when && dateRange !== 'all') {
                const now = Date.now();
                const age = now - when.getTime();
                if (dateRange === 'today') matchesDate = age <= 24 * 60 * 60 * 1000;
                if (dateRange === 'week') matchesDate = age <= 7 * 24 * 60 * 60 * 1000;
                if (dateRange === 'month') matchesDate = age <= 30 * 24 * 60 * 60 * 1000;
            }
            return matchesSearch && matchesAction && matchesUser && matchesDate;
        });
        visibleCount = filtered.length;
        renderRows(filtered);
        
        // Update event count
        if (eventCount) {
            eventCount.textContent = `Showing ${visibleCount} events`;
        }
        
    }
    
    // Add event listeners for filters
    if (searchInput) searchInput.addEventListener('input', filterAudit);
    if (actionTypeFilter) actionTypeFilter.addEventListener('change', filterAudit);
    if (userFilter) userFilter.addEventListener('change', filterAudit);
    if (dateRangeFilter) dateRangeFilter.addEventListener('change', filterAudit);
    
    // View toggle functionality
    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Update active state
            viewToggles.forEach(t => {
                t.classList.remove('active-view', 'bg-teal-700', 'text-white');
                t.classList.add('bg-white', 'text-gray-600');
            });
            this.classList.remove('bg-white', 'text-gray-600');
            this.classList.add('active-view', 'bg-teal-700', 'text-white');
            
            // Show/hide views
            if (view === 'list') {
                listView.classList.remove('hidden');
                listView.classList.add('block');
                timelineView.classList.add('hidden');
                timelineView.classList.remove('block');
            } else {
                listView.classList.add('hidden');
                listView.classList.remove('block');
                timelineView.classList.remove('hidden');
                timelineView.classList.add('block');
            }
        });
    });
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = `audit-trail-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(href);
        });
    }

    tableBody?.addEventListener('click', function(e) {
        const btn = e.target.closest('.view-details');
        if (!btn) return;
        e.preventDefault();
        const eventId = btn.getAttribute('data-id');
        const match = auditData.find((row) => String(row.id) === String(eventId));
        if (match) {
            const detailsWindow = window.open('', '_blank');
            if (detailsWindow) {
                detailsWindow.document.write(`<pre>${JSON.stringify(match, null, 2)}</pre>`);
                detailsWindow.document.close();
            }
        }
    });
    
    // Custom date range handling
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', function() {
            if (this.value === 'custom') this.value = 'month';
        });
    }
    
    // Pagination buttons (demo)
    const paginationButtons = document.querySelectorAll('.flex.gap-2 button');
    paginationButtons.forEach(btn => {
        btn.addEventListener('click', function() {});
    });
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'audit-trail.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            // Remove active class from all
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            // Add active class to current
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });
    
    buildAuditData()
        .then((rows) => {
            auditData = rows;
            filterAudit();
        })
        .catch(() => {
            auditData = [];
            filterAudit();
        });
});