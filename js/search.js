// js/search.js

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

    console.log('Search page JS loaded successfully');
    
    // DOM elements
    const searchForm = document.getElementById('searchForm');
    const mainSearch = document.getElementById('mainSearch');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const filterArea = document.getElementById('filterArea');
    const filterAuthor = document.getElementById('filterAuthor');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const filterVersion = document.getElementById('filterVersion');
    const filterKeyword = document.getElementById('filterKeyword');
    const clearBtn = document.getElementById('clearSearch');
    const searchBtn = document.getElementById('searchBtn');
    const sortSelect = document.getElementById('sortResults');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const listView = document.getElementById('listView');
    const gridView = document.getElementById('gridView');
    const resultCount = document.getElementById('resultCount');
    const paginationInfo = document.getElementById('paginationInfo');
    const searchResults = document.querySelectorAll('.search-result');
    
    // Initialize grid view by cloning list items
    function initGridView() {
        if (!gridView) return;
        
        // Clear existing grid items
        gridView.innerHTML = '';
        
        // Clone each search result for grid view
        searchResults.forEach(result => {
            const clone = result.cloneNode(true);
            clone.classList.add('grid-item');
            gridView.appendChild(clone);
            
            // Re-attach event listeners to cloned buttons
            const viewBtns = clone.querySelectorAll('.view-doc');
            viewBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const docId = this.getAttribute('data-doc') || 'document';
                    alert(`Viewing document: ${docId}\n(This would open the document in the full system)`);
                });
            });
            
            const attachBtns = clone.querySelectorAll('.text-gray-500');
            attachBtns.forEach(btn => {
                if (btn.textContent.includes('📎')) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        alert('Attachments panel would open here');
                    });
                }
            });
        });
    }
    
    // Call init
    initGridView();
    
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
                gridView.classList.add('hidden');
            } else {
                listView.classList.add('hidden');
                gridView.classList.remove('hidden');
            }
        });
    });
    
    // Search function
    function performSearch() {
        const searchTerm = mainSearch ? mainSearch.value.toLowerCase() : '';
        const category = filterCategory ? filterCategory.value : 'all';
        const status = filterStatus ? filterStatus.value : 'all';
        const area = filterArea ? filterArea.value : 'all';
        const author = filterAuthor ? filterAuthor.value.toLowerCase() : '';
        const version = filterVersion ? filterVersion.value.toLowerCase() : '';
        const dateFrom = filterDateFrom ? filterDateFrom.value : '';
        const dateTo = filterDateTo ? filterDateTo.value : '';
        
        let visibleCount = 0;
        
        // Filter both list and grid items
        const itemsToFilter = [...searchResults];
        
        itemsToFilter.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            const itemCategory = item.getAttribute('data-category') || '';
            const itemStatus = item.getAttribute('data-status') || '';
            
            // Search term match
            let matchesSearch = true;
            if (searchTerm) {
                matchesSearch = itemText.includes(searchTerm);
            }
            
            // Category match
            let matchesCategory = true;
            if (category !== 'all') {
                matchesCategory = itemCategory === category;
            }
            
            // Status match
            let matchesStatus = true;
            if (status !== 'all') {
                matchesStatus = itemStatus === status;
            }
            
            // Area match (simplified - would be more complex in real system)
            let matchesArea = true;
            if (area !== 'all') {
                matchesArea = itemText.includes(area);
            }
            
            // Author match
            let matchesAuthor = true;
            if (author) {
                matchesAuthor = itemText.includes(author);
            }
            
            // Version match
            let matchesVersion = true;
            if (version) {
                matchesVersion = itemText.includes(version);
            }
            
            // Date match (simplified - would need actual date parsing in real system)
            let matchesDate = true;
            
            // Combine all filters
            if (matchesSearch && matchesCategory && matchesStatus && matchesArea && matchesAuthor && matchesVersion && matchesDate) {
                item.classList.remove('hidden');
                visibleCount++;
                
                // Also update corresponding grid item if exists
                const gridItems = document.querySelectorAll('#gridView .search-result');
                gridItems.forEach(gridItem => {
                    if (gridItem.textContent === item.textContent) {
                        gridItem.classList.remove('hidden');
                    }
                });
            } else {
                item.classList.add('hidden');
                
                // Also hide corresponding grid item
                const gridItems = document.querySelectorAll('#gridView .search-result');
                gridItems.forEach(gridItem => {
                    if (gridItem.textContent === item.textContent) {
                        gridItem.classList.add('hidden');
                    }
                });
            }
        });
        
        // Update result count
        if (resultCount) resultCount.textContent = visibleCount;
        if (paginationInfo) paginationInfo.textContent = `Showing 1 to ${Math.min(visibleCount, 6)} of ${visibleCount} results`;
        
        console.log(`Search completed: ${visibleCount} results found`);
    }
    
    // Search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Clear filters
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            // Clear all input fields
            if (mainSearch) mainSearch.value = '';
            if (filterCategory) filterCategory.value = 'all';
            if (filterStatus) filterStatus.value = 'all';
            if (filterArea) filterArea.value = 'all';
            if (filterAuthor) filterAuthor.value = '';
            if (filterDateFrom) filterDateFrom.value = '';
            if (filterDateTo) filterDateTo.value = '';
            if (filterVersion) filterVersion.value = '';
            if (filterKeyword) filterKeyword.value = '';
            
            // Show all results
            searchResults.forEach(item => {
                item.classList.remove('hidden');
            });
            
            // Show all grid items
            document.querySelectorAll('#gridView .search-result').forEach(item => {
                item.classList.remove('hidden');
            });
            
            // Update count
            if (resultCount) resultCount.textContent = searchResults.length;
            if (paginationInfo) paginationInfo.textContent = `Showing 1 to ${Math.min(searchResults.length, 6)} of ${searchResults.length} results`;
        });
    }
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            console.log('Sorting by:', sortBy);
            
            // In a real system, this would reorder the results
            // For demo, just show an alert
            alert(`Sort by ${sortBy} would reorder the results in the full system.`);
        });
    }
    
    // View document buttons
    const viewDocBtns = document.querySelectorAll('.view-doc');
    viewDocBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docId = this.getAttribute('data-doc') || 'document';
            const docRow = this.closest('.search-result');
            const docTitle = docRow?.querySelector('h3')?.textContent || docId;
            alert(`Viewing: ${docTitle}\n(This would open the document in the full system)`);
        });
    });
    
    // Attachment buttons
    const attachBtns = document.querySelectorAll('.text-gray-500');
    attachBtns.forEach(btn => {
        if (btn.textContent.includes('📎')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Attachments and version history would open here');
            });
        }
    });
    
    // Recent search remove buttons
    const recentSearchRemove = document.querySelectorAll('.bg-gray-100 button');
    recentSearchRemove.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tag = this.closest('.bg-gray-100');
            if (tag) {
                tag.remove();
            }
        });
    });
    
    // Pagination buttons (demo only)
    const paginationPrev = document.querySelector('.pagination-prev');
    const paginationNext = document.querySelector('.pagination-next');
    
    if (paginationPrev) {
        paginationPrev.addEventListener('click', function() {
            alert('Previous page would load in the full system');
        });
    }
    
    if (paginationNext) {
        paginationNext.addEventListener('click', function() {
            alert('Next page would load in the full system');
        });
    }
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'search.html';
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
    
    // Initial search count
    if (resultCount) resultCount.textContent = searchResults.length;
});