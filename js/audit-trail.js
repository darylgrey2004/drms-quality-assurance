// js/audit-trail.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // ── Admin Role-Based Access Control ──
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id) { window.location.href = 'landing.html'; return; }

    const role = (user.role || '').toLowerCase().trim();
    const currentPage = window.location.pathname.split('/').pop() || 'homepage.html';

    // Redirect user-level roles to their dashboard
    if (role === 'faculty member' || role === 'area chair/program head') {
        window.location.href = 'user-dashboard.html'; return;
    }

    // Populate sidebar user info
    const elById = (id) => document.getElementById(id);
    const initials = (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
    if (elById('sidebarInitials')) elById('sidebarInitials').textContent = initials;
    if (elById('sidebarName')) elById('sidebarName').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (elById('sidebarRole')) elById('sidebarRole').textContent = user.role || 'Admin';
    fetch(`http://localhost:3000/api/user/profile/${user.id}`, {
        headers: { 'x-auth-token': token }
    }).then(r => r.json()).then(data => {
        if (elById('sidebarRole')) {
            const dept = data.department ? ` · ${data.department}` : '';
            elById('sidebarRole').textContent = `${data.role || user.role}${dept}`;
        }
    }).catch(() => {});

    // Hide Upload, Users, and Settings links for QA Coordinator on all pages
    if (role === 'qa coordinator') {
        const uploadLink = document.querySelector('a[href="upload.html"]');
        if (uploadLink) uploadLink.style.display = 'none';
        const usersLink = document.querySelector('a[href="users.html"]');
        if (usersLink) usersLink.style.display = 'none';
        const settingsLink = document.querySelector('a[href="settings.html"]');
        if (settingsLink) settingsLink.style.display = 'none';
    }

    // Logout button
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

    // Heartbeat
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);
    // ─────────────────────────────────────────────────

    console.log('Audit Trail page JS loaded successfully');
    
    // DOM elements
    const searchInput = document.getElementById('searchAudit');
    const actionTypeFilter = document.getElementById('actionTypeFilter');
    const userFilter = document.getElementById('userFilter');
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    const exportBtn = document.getElementById('exportAuditBtn');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const listView = document.getElementById('listView');
    const timelineView = document.getElementById('timelineView');
    const eventCount = document.getElementById('eventCount');
    const auditRows = document.querySelectorAll('.audit-row');
    const viewDetailsBtns = document.querySelectorAll('.view-details');
    
    // Filter function
    function filterAudit() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const actionType = actionTypeFilter ? actionTypeFilter.value : 'all';
        const user = userFilter ? userFilter.value : 'all';
        const dateRange = dateRangeFilter ? dateRangeFilter.value : 'month';
        
        let visibleCount = 0;
        
        auditRows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            
            // Get action type from the row
            const actionSpan = row.querySelector('td:nth-child(3) span');
            const actionText = actionSpan ? actionSpan.textContent.toLowerCase() : '';
            
            // Get user from the row
            const userSpan = row.querySelector('td:nth-child(2) span:last-child');
            const userText = userSpan ? userSpan.textContent.toLowerCase() : '';
            
            // Search match
            const matchesSearch = searchTerm === '' || rowText.includes(searchTerm);
            
            // Action type match
            let matchesAction = actionType === 'all';
            if (!matchesAction) {
                matchesAction = actionText.includes(actionType.toLowerCase());
            }
            
            // User match
            let matchesUser = user === 'all';
            if (!matchesUser) {
                const userMap = {
                    'santos': 'santos',
                    'garcia': 'garcia',
                    'cruz': 'cruz',
                    'reyes': 'reyes',
                    'mendoza': 'mendoza',
                    'qa': 'qa'
                };
                matchesUser = userText.includes(userMap[user] || user);
            }
            
            // Date range match (simplified - would be more complex in real system)
            let matchesDate = true;
            
            if (matchesSearch && matchesAction && matchesUser && matchesDate) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });
        
        // Update event count
        if (eventCount) {
            eventCount.textContent = `Showing ${visibleCount} events`;
        }
        
        console.log(`Filtered: ${visibleCount} events visible`);
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
            const actionType = actionTypeFilter ? actionTypeFilter.value : 'all';
            const dateRange = dateRangeFilter ? dateRangeFilter.value : 'month';
            
            alert(`Exporting audit trail\n\nFilters: Action=${actionType}, Period=${dateRange}\n\nThis would download the audit log in CSV/PDF format.`);
        });
    }
    
    // View details buttons
    viewDetailsBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const eventId = this.getAttribute('data-id') || 'unknown';
            const row = this.closest('tr');
            const action = row?.querySelector('td:nth-child(3) span')?.textContent || 'action';
            const document = row?.querySelector('td:nth-child(4)')?.textContent || 'item';
            
            alert(`Audit Event Details (ID: ${eventId})\n\nAction: ${action}\nDocument: ${document}\nTimestamp: ${row?.querySelector('td:first-child')?.textContent}\nUser: ${row?.querySelector('td:nth-child(2)')?.textContent.trim()}\n\nThis would show complete event details including before/after values.`);
        });
    });
    
    // Custom date range handling
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', function() {
            if (this.value === 'custom') {
                const startDate = prompt('Enter start date (YYYY-MM-DD):', '2026-01-01');
                const endDate = prompt('Enter end date (YYYY-MM-DD):', '2026-12-31');
                
                if (startDate && endDate) {
                    alert(`Custom range: ${startDate} to ${endDate}\n\nThis would filter events between these dates.`);
                } else {
                    // Reset to previous value if cancelled
                    this.value = 'month';
                }
            }
        });
    }
    
    // Pagination buttons (demo)
    const paginationButtons = document.querySelectorAll('.flex.gap-2 button');
    paginationButtons.forEach(btn => {
        if (btn.textContent === 'Previous' || btn.textContent === 'Next') {
            btn.addEventListener('click', function() {
                alert(`${this.textContent} page would load in the full system`);
            });
        } else if (btn.textContent.match(/^\d+$/)) {
            btn.addEventListener('click', function() {
                // Page number click
                paginationButtons.forEach(b => {
                    if (b.textContent.match(/^\d+$/)) {
                        b.classList.remove('bg-teal-700', 'text-white');
                        b.classList.add('bg-white', 'border', 'border-gray-300', 'text-gray-600');
                    }
                });
                this.classList.remove('bg-white', 'border', 'border-gray-300', 'text-gray-600');
                this.classList.add('bg-teal-700', 'text-white');
                
                alert(`Page ${this.textContent} would load in the full system`);
            });
        }
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
    
    // Initialize filter count
    filterAudit();
});