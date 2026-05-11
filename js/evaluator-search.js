// js/evaluator-search.js

const API_BASE = 'http://localhost:3000';

// Helper functions (defined globally for use in modals)
function getCategoryBadge(categoryClass) {
    const badges = {
        'instruction': 'badge-instruction',
        'research': 'badge-research',
        'extension': 'badge-extension',
        'employment': 'badge-employment'
    };
    return badges[categoryClass] || 'badge-instruction';
}

function getStatusBadge(statusClass) {
    const badges = {
        'approved': 'status-approved',
        'pending': 'status-pending',
        'draft': 'status-draft',
        'rejected': 'status-pending',
        'locked': 'status-approved',
        'validated': 'status-pending'
    };
    return badges[statusClass] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        'approved': 'Approved',
        'pending': 'Pending Review',
        'draft': 'Draft',
        'rejected': 'Rejected',
        'locked': 'Locked',
        'validated': 'Validated'
    };
    return texts[status.toLowerCase()] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Search JS loaded');

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        window.location.href = 'landing.html';
        return;
    }

    // Update sidebar user info
    updateSidebarUser();

    // Setup mobile sidebar
    setupMobileSidebar();

    // Heartbeat
    function sendHeartbeat() {
        fetch(`${API_BASE}/api/user/heartbeat`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterCategory = document.getElementById('filterCategory');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterStatus = document.getElementById('filterStatus');
    const clearFilters = document.getElementById('clearFilters');
    const sortSelect = document.getElementById('sortResults');
    const resultsContainer = document.getElementById('searchResults');
    const resultCount = document.getElementById('resultCount');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResults = document.getElementById('noResults');
    const paginationInfo = document.getElementById('paginationInfo');
    const pagination = document.getElementById('pagination');

    let currentPage = 1;
    let currentResults = [];
    const itemsPerPage = 5;

    // Search documents from API
    async function performSearch() {
        const searchTerm = searchInput?.value?.trim() || '';
        const category = filterCategory?.value || 'all';
        const department = filterDepartment?.value || 'all';
        // Evaluators can only see locked documents - status is always 'locked'
        const status = 'locked';
        const sort = sortSelect?.value || 'date_desc';

        console.log('Performing search with:', { searchTerm, category, department, status, sort });

        // Show loading
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (resultsContainer) resultsContainer.innerHTML = '';
        if (noResults) noResults.classList.add('hidden');

        try {
            // Build query params
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm);
            if (category && category !== 'all') params.append('category', category);
            if (department && department !== 'all') params.append('department', department.toUpperCase());
            // Always filter for locked documents for evaluators
            params.append('status', 'locked');
            if (sort && sort !== 'relevance') params.append('sort', sort);

            const url = `${API_BASE}/api/documents/search?${params.toString()}`;
            console.log('Fetching:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const documents = await response.json();
            console.log('Search results:', documents.length, 'documents');

            currentResults = documents;
            currentPage = 1;
            displayResults();

        } catch (error) {
            console.error('Search error:', error);
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (resultsContainer) resultsContainer.innerHTML = '';
            if (noResults) {
                noResults.classList.remove('hidden');
                const noResultsP = noResults.querySelector('p');
                if (noResultsP) noResultsP.textContent = 'Error loading search results. Please try again.';
            }
            if (resultCount) resultCount.textContent = '0';
            if (paginationInfo) paginationInfo.textContent = 'Showing 0 to 0 of 0 documents';
        }
    }

    // Display results
    function displayResults() {
        console.log('Displaying results:', currentResults.length, 'total documents');
        
        if (loadingIndicator) loadingIndicator.classList.add('hidden');

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageDocuments = currentResults.slice(start, end);

        if (currentResults.length === 0) {
            if (resultsContainer) {
                resultsContainer.classList.add('hidden');
                resultsContainer.innerHTML = '';
            }
            if (noResults) noResults.classList.remove('hidden');
            if (resultCount) resultCount.textContent = '0';
            if (paginationInfo) paginationInfo.textContent = 'Showing 0 to 0 of 0 documents';
            if (pagination) pagination.innerHTML = '';
            return;
        }

        if (resultsContainer) {
            resultsContainer.classList.remove('hidden');
            resultsContainer.innerHTML = pageDocuments.map(doc => {
                const categoryClass = (doc.category || '').toLowerCase();
                const statusClass = (doc.workflow_status || '').toLowerCase();
                const categoryDisplay = doc.category_display_name || doc.category || 'N/A';
                const departmentDisplay = doc.department_name || doc.department_code || doc.area || 'N/A';

                return `
                    <div class="search-result bg-white rounded-lg p-4 border border-gray-200 hover:border-teal-300 transition">
                        <div class="flex flex-col md:flex-row justify-between gap-3">
                            <div class="flex-1">
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    <span class="${getCategoryBadge(categoryClass)} px-2 py-1 rounded-full text-xs">${escapeHtml(categoryDisplay)}</span>
                                    <span class="${getStatusBadge(statusClass)} px-2 py-1 rounded-full text-xs">${getStatusText(doc.workflow_status || 'pending')}</span>
                                </div>
                                <h3 class="font-medium text-gray-800 text-base">${escapeHtml(doc.title || 'Untitled')}</h3>
                                <p class="text-xs text-gray-500 mt-1">by ${escapeHtml(doc.author_name || 'Unknown')} · ${formatDate(doc.created_at)} · ${escapeHtml(doc.version || 'v1.0')}</p>
                                <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(doc.description || 'No description available')}</p>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <span class="badge-department px-2 py-1 rounded-full text-xs">${escapeHtml(departmentDisplay)}</span>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn-view view-doc-btn" data-doc-id="${doc.id}">View</button>
                                <button class="btn-details details-doc-btn" data-doc-id="${doc.id}">Details</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (noResults) noResults.classList.add('hidden');
        if (resultCount) resultCount.textContent = currentResults.length;

        const startNum = currentResults.length > 0 ? start + 1 : 0;
        const endNum = Math.min(end, currentResults.length);
        if (paginationInfo) paginationInfo.textContent = `Showing ${startNum} to ${endNum} of ${currentResults.length} documents`;

        renderPagination();
        attachViewHandlers();
    }

    function attachViewHandlers() {
        // View document buttons - open preview modal
        document.querySelectorAll('.view-doc-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.dataset.docId;
                const doc = currentResults.find(d => d.id == docId);
                if (doc) {
                    openPreviewModal(doc);
                }
            });
        });

        // Details buttons - open details modal
        document.querySelectorAll('.details-doc-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.dataset.docId;
                const doc = currentResults.find(d => d.id == docId);
                if (doc) {
                    openDetailsModal(doc);
                }
            });
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(currentResults.length / itemsPerPage);
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;

        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            const active = i === currentPage ? 'bg-teal-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50';
            html += `<button class="px-3 py-1.5 ${active} rounded-lg text-sm" data-page="${i}">${i}</button>`;
        }

        html += `<button class="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

        pagination.innerHTML = html;

        pagination.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page === 'prev' && currentPage > 1) {
                    currentPage--;
                    displayResults();
                } else if (page === 'next' && currentPage < totalPages) {
                    currentPage++;
                    displayResults();
                } else if (!isNaN(page)) {
                    currentPage = parseInt(page);
                    displayResults();
                }
            });
        });
    }

    // Event listeners
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    if (filterCategory) filterCategory.addEventListener('change', performSearch);
    if (filterDepartment) filterDepartment.addEventListener('change', performSearch);
    // Status filter removed - evaluators can only see locked documents
    if (sortSelect) sortSelect.addEventListener('change', performSearch);

    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterCategory) filterCategory.value = 'all';
            if (filterDepartment) filterDepartment.value = 'all';
            // Status always stays 'locked' for evaluators
            if (sortSelect) sortSelect.value = 'date_desc';
            performSearch();
        });
    }

    // Initial search (load all approved/locked documents for evaluator)
    performSearch();

    // Modal close handlers
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    const docDetailsModal = document.getElementById('docDetailsModal');
    const docDetailsCloseBtn = document.getElementById('docDetailsCloseBtn');
    const docDetailsCloseBtn2 = document.getElementById('docDetailsCloseBtn2');

    if (docPreviewCloseBtn) {
        docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    }
    if (docPreviewModal) {
        docPreviewModal.addEventListener('click', (e) => {
            if (e.target === docPreviewModal) closePreviewModal();
        });
    }
    if (docDetailsCloseBtn) {
        docDetailsCloseBtn.addEventListener('click', closeDetailsModal);
    }
    if (docDetailsCloseBtn2) {
        docDetailsCloseBtn2.addEventListener('click', closeDetailsModal);
    }
    if (docDetailsModal) {
        docDetailsModal.addEventListener('click', (e) => {
            if (e.target === docDetailsModal) closeDetailsModal();
        });
    }
});

// Modal functions
function openPreviewModal(doc) {
    const modal = document.getElementById('docPreviewModal');
    const title = document.getElementById('docPreviewTitle');
    const frame = document.getElementById('docPreviewFrame');
    
    if (modal && title && frame) {
        title.textContent = doc.title || 'Document Preview';
        frame.src = doc.file_url ? `${API_BASE}${doc.file_url}` : 'about:blank';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closePreviewModal() {
    const modal = document.getElementById('docPreviewModal');
    const frame = document.getElementById('docPreviewFrame');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (frame) frame.src = 'about:blank';
    }
}

function openDetailsModal(doc) {
    const modal = document.getElementById('docDetailsModal');
    const title = document.getElementById('docDetailsTitle');
    const content = document.getElementById('docDetailsContent');
    
    if (!modal || !content) return;
    
    if (title) title.textContent = `Document Details: ${doc.title || 'Untitled'}`;
    
    // Format keywords as badges
    let keywordsHtml = '';
    if (doc.keywords) {
        const keywords = doc.keywords.split(',').map(k => k.trim());
        keywordsHtml = `
            <div class="flex flex-wrap gap-2 mt-2">
                ${keywords.map(k => `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">${escapeHtml(k)}</span>`).join('')}
            </div>
        `;
    } else {
        keywordsHtml = '<p class="text-gray-400 text-sm italic">No keywords provided</p>';
    }
    
    const date = formatDate(doc.created_at);
    const uploader = doc.author_name || (doc.uploader_firstName && doc.uploader_lastName 
        ? `${doc.uploader_firstName} ${doc.uploader_lastName}` 
        : 'Unknown');
    const categoryDisplay = doc.category_display_name || doc.category || 'N/A';
    const departmentDisplay = doc.department_name || doc.department_code || doc.area || 'N/A';
    
    content.innerHTML = `
        <div class="border-b pb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Document Information</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <span class="text-gray-500">Title:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.title || 'Untitled')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Version:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.version || 'v1.0')}</p>
                </div>
                <div>
                    <span class="text-gray-500">Category:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(categoryDisplay)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Department:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(departmentDisplay)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Status:</span>
                    <p class="font-medium mt-1">${getStatusText(doc.workflow_status)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Uploaded by:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(uploader)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Uploaded on:</span>
                    <p class="font-medium text-gray-800 mt-1">${date}</p>
                </div>
                ${doc.expiry_date ? `
                <div>
                    <span class="text-gray-500">Expiry Date:</span>
                    <p class="font-medium text-gray-800 mt-1">${formatDate(doc.expiry_date)}</p>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="border-b pb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Description / Notes</h4>
            <div class="bg-gray-50 rounded-lg p-4">
                ${doc.description ? `<p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(doc.description)}</p>` : '<p class="text-gray-400 text-sm italic">No description provided</p>'}
            </div>
        </div>
        
        <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Keywords</h4>
            ${keywordsHtml}
        </div>
        
        <div class="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
            <div class="flex items-center gap-2 text-xs text-gray-600">
                <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span class="font-medium">View-Only Access:</span>
                <span>You can view this document but cannot edit or modify it.</span>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDetailsModal() {
    const modal = document.getElementById('docDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Update sidebar user info
function updateSidebarUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInitialsElem = document.getElementById('sidebarInitials');
    const userNameElem = document.getElementById('sidebarName');
    const userRoleElem = document.getElementById('sidebarRole');
    const sidebarPortalElem = document.getElementById('sidebarPortal');
    const sidebarAccessElem = document.getElementById('sidebarAccess');
    
    if (user.firstName && user.lastName) {
        const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
        if (userInitialsElem) userInitialsElem.textContent = initials;
        if (userNameElem) userNameElem.textContent = `${user.firstName} ${user.lastName}`;
    }
    if (user.role && userRoleElem) {
        const roleMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'faculty': 'Faculty Member',
            'area-chair': 'Dept. Head',
            'department-head': 'Dept. Head',
            'evaluator': 'External Evaluator'
        };
        userRoleElem.textContent = roleMap[user.role] || user.role;
    }
    if (user.role === 'evaluator' && sidebarPortalElem) {
        sidebarPortalElem.textContent = 'Evaluator Portal';
        if (sidebarAccessElem) sidebarAccessElem.textContent = 'View-Only Access · Read Only';
    }
}

// Setup mobile sidebar toggle
function setupMobileSidebar() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('mainSidebar');
    
    if (!menuToggle || !sidebar) return;
    
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
    }
    
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        document.body.style.overflow = 'hidden';
    }
    
    // Ensure button is visible on mobile
    function checkMobile() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'flex';
        } else {
            menuToggle.style.display = 'none';
            closeSidebar();
        }
    }
    
    // Initial check
    checkMobile();
    
    // Toggle click
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
    
    // Overlay click
    overlay.addEventListener('click', closeSidebar);
    
    // Close when clicking on nav links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        checkMobile();
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}
