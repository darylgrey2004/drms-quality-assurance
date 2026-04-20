// js/evidence-map.js

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

    console.log('Evidence Map page JS loaded successfully');
    
    // DOM elements
    const searchInput = document.getElementById('searchMap');
    const standardFilter = document.getElementById('standardFilter');
    const statusFilter = document.getElementById('statusFilter');
    const refreshBtn = document.getElementById('refreshMap');
    const tabLinks = document.querySelectorAll('#mapTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    const viewClauseBtns = document.querySelectorAll('.view-clause');
    const bulkMapBtn = document.getElementById('bulkMapBtn');
    
    // Tab switching functionality
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get tab id
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab styling
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            // Show selected tab
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('block');
            }
            
            // Update standard filter to match tab
            if (standardFilter) {
                if (tabId === 'iso') standardFilter.value = 'iso';
                if (tabId === 'aaccup') standardFilter.value = 'aaccup';
                if (tabId === 'coe') standardFilter.value = 'coe';
            }
            
            // Apply filters to new tab
            filterClauses();
        });
    });
    
    // Filter function for clauses
    function filterClauses() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const standard = standardFilter ? standardFilter.value : 'all';
        const status = statusFilter ? statusFilter.value : 'all';
        
        // Determine which tab is active
        let activeTabId = 'iso';
        tabLinks.forEach(link => {
            if (link.classList.contains('active-tab')) {
                activeTabId = link.getAttribute('data-tab');
            }
        });
        
        // Get visible tab content
        const activeTab = document.getElementById(activeTabId + 'Tab');
        if (!activeTab) return;
        
        const clauseItems = activeTab.querySelectorAll('.clause-item');
        
        clauseItems.forEach(item => {
            const clauseText = item.textContent.toLowerCase();
            const itemStatus = item.getAttribute('data-status') || 'partial';
            
            // Search match
            const matchesSearch = searchTerm === '' || clauseText.includes(searchTerm);
            
            // Status match
            let matchesStatus = status === 'all';
            if (!matchesStatus) {
                matchesStatus = itemStatus === status;
            }
            
            // Show/hide based on filters
            if (matchesSearch && matchesStatus) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Update count
        const visibleCount = activeTab.querySelectorAll('.clause-item:not(.hidden)').length;
        const totalCount = activeTab.querySelectorAll('.clause-item').length;
        console.log(`Showing ${visibleCount} of ${totalCount} clauses`);
    }
    
    // Add event listeners for filters
    if (searchInput) searchInput.addEventListener('input', filterClauses);
    if (standardFilter) {
        standardFilter.addEventListener('change', function() {
            const standard = this.value;
            if (standard !== 'all') {
                // Switch to corresponding tab
                tabLinks.forEach(link => {
                    const tabId = link.getAttribute('data-tab');
                    if (tabId === standard) {
                        link.click();
                    }
                });
            } else {
                filterClauses();
            }
        });
    }
    if (statusFilter) statusFilter.addEventListener('change', filterClauses);
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Clear filters
            if (searchInput) searchInput.value = '';
            if (standardFilter) standardFilter.value = 'all';
            if (statusFilter) statusFilter.value = 'all';
            
            // Reset to ISO tab
            tabLinks.forEach(link => {
                if (link.getAttribute('data-tab') === 'iso') {
                    link.click();
                }
            });
            
            filterClauses();
            
            // Visual feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="mr-2">✓</span> Refreshed';
            setTimeout(() => {
                this.innerHTML = '<span class="mr-2">🔄</span> Refresh';
            }, 1000);
        });
    }
    
    // View clause buttons
    viewClauseBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const clause = this.getAttribute('data-clause') || 'clause';
            const clauseItem = this.closest('.clause-item');
            const clauseTitle = clauseItem?.querySelector('h4')?.textContent || 'Clause';
            
            console.log(`Viewing ${clause}: ${clauseTitle}`);
            alert(`Viewing documents mapped to: ${clauseTitle}\n(This would show all documents for this standard in the full system)`);
        });
    });
    
    // Bulk map button
    if (bulkMapBtn) {
        bulkMapBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Bulk mapping interface would open here.\nSelect multiple documents and map them to standards.');
        });
    }
    
    // Document action buttons in mini lists
    const docViewBtns = document.querySelectorAll('.text-teal-600:contains("View")');
    document.querySelectorAll('.text-teal-600').forEach(btn => {
        if (btn.textContent.trim() === 'View') {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const docRow = this.closest('.grid');
                const docTitle = docRow?.querySelector('.col-span-6')?.textContent || 'Document';
                alert(`Viewing: ${docTitle}`);
            });
        }
    });
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'evidence-map.html';
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
    filterClauses();
});
// Mobile Sidebar Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.w-72');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar && overlay) {
        // Toggle sidebar when hamburger menu is clicked
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
        
        // Close sidebar when overlay is clicked
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
        
        // Close sidebar when a navigation link is clicked (optional)
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });
    }
    
    // Close sidebar when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    });
});