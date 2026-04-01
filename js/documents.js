// js/documents.js

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

    console.log('Documents page JS loaded successfully');
    
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const docRows = document.querySelectorAll('.doc-row');
    const docCount = document.getElementById('docCount');
    const uploadBtn = document.getElementById('uploadBtn');
    const filterBtn = document.getElementById('filterBtn');
    
    // Update document count
    function updateDocCount() {
        const visibleRows = document.querySelectorAll('.doc-row:not(.hidden)');
        docCount.textContent = visibleRows.length;
    }
    
    // Filter function
    function filterDocuments() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const category = categoryFilter ? categoryFilter.value : 'all';
        const status = statusFilter ? statusFilter.value : 'all';
        
        docRows.forEach(row => {
            const title = row.querySelector('.font-medium')?.textContent.toLowerCase() || '';
            const author = row.querySelector('.text-gray-400')?.textContent.toLowerCase() || '';
            const categoryText = row.querySelector('.col-span-2.text-gray-600')?.textContent.toLowerCase() || '';
            const statusSpan = row.querySelector('[class*="badge-"]')?.textContent.toLowerCase() || '';
            
            // Search match
            const matchesSearch = searchTerm === '' || 
                                 title.includes(searchTerm) || 
                                 author.includes(searchTerm) ||
                                 categoryText.includes(searchTerm);
            
            // Category match
            let matchesCategory = category === 'all';
            if (!matchesCategory) {
                if (category === 'iso' && categoryText.includes('iso')) matchesCategory = true;
                if (category === 'aaccup' && categoryText.includes('aaccup')) matchesCategory = true;
                if (category === 'coe' && categoryText.includes('coe')) matchesCategory = true;
            }
            
            // Status match
            let matchesStatus = status === 'all';
            if (!matchesStatus) {
                if (status === 'approved' && statusSpan.includes('approved')) matchesStatus = true;
                if (status === 'pending' && (statusSpan.includes('pending') || statusSpan.includes('review'))) matchesStatus = true;
                if (status === 'draft' && statusSpan.includes('draft')) matchesStatus = true;
                if (status === 'expired' && statusSpan.includes('expired')) matchesStatus = true;
            }
            
            // Show/hide based on all filters
            if (matchesSearch && matchesCategory && matchesStatus) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });
        
        updateDocCount();
    }
    
    // Add event listeners for filters
    if (searchInput) searchInput.addEventListener('input', filterDocuments);
    if (categoryFilter) categoryFilter.addEventListener('change', filterDocuments);
    if (statusFilter) statusFilter.addEventListener('change', filterDocuments);
    
    // Action button handlers
    const viewBtns = document.querySelectorAll('.view-btn');
    const attachBtns = document.querySelectorAll('.attach-btn');
    const editBtns = document.querySelectorAll('.edit-btn');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docRow = this.closest('.doc-row');
            const docTitle = docRow?.querySelector('.font-medium')?.textContent || 'Document';
            console.log(`View document: ${docTitle}`);
            alert(`Viewing: ${docTitle}\n(This would open the document viewer in the full system)`);
        });
    });
    
    attachBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docRow = this.closest('.doc-row');
            const docTitle = docRow?.querySelector('.font-medium')?.textContent || 'Document';
            console.log(`Attachments for: ${docTitle}`);
            alert(`Attachments for: ${docTitle}\n(This would show version history and attachments)`);
        });
    });
    
    editBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docRow = this.closest('.doc-row');
            const docTitle = docRow?.querySelector('.font-medium')?.textContent || 'Document';
            console.log(`Edit document: ${docTitle}`);
            alert(`Editing: ${docTitle}\n(This would open the document editor)`);
        });
    });
    
    // Upload button handler
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            console.log('Upload button clicked');
            alert('Upload new document - This would open the upload form');
        });
    }
    
    // Filter button handler
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            console.log('Filter button clicked');
            alert('Advanced filters would open here');
        });
    }
    
    // Initialize count
    updateDocCount();
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'documents.html';
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
});