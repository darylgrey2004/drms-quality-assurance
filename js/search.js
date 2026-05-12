// js/search.js

const API_BASE = window.API_CONFIG?.API_BASE || 'http://localhost:3000';
let allDocuments = [];
let filteredDocuments = [];
let currentPage = 1;
const itemsPerPage = 6;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Search page JS loaded successfully');
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }
    
    // ── Heartbeat: Update lastActive status ──
    function sendHeartbeat() {
        fetch(`${window.API_CONFIG?.API_BASE || 'http://localhost:3000'}/api/user/heartbeat`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);
    
    // Update user info in sidebar
    updateUserInfo();
    
    // DOM elements
    const searchForm = document.getElementById('searchForm');
    const mainSearch = document.getElementById('mainSearch');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterAuthor = document.getElementById('filterAuthor');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const filterVersion = document.getElementById('filterVersion');
    const filterKeyword = document.getElementById('filterKeyword');
    const clearBtn = document.getElementById('clearSearch');
    const sortSelect = document.getElementById('sortResults');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const listView = document.getElementById('listView');
    const gridView = document.getElementById('gridView');
    const resultCount = document.getElementById('resultCount');
    const paginationInfo = document.getElementById('paginationInfo');
    const loadingResults = document.getElementById('loadingResults');
    const noResults = document.getElementById('noResults');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    // Modal elements
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewFrame = document.getElementById('docPreviewFrame');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    const docDetailsModal = document.getElementById('docDetailsModal');
    const docDetailsTitle = document.getElementById('docDetailsTitle');
    const docDetailsContent = document.getElementById('docDetailsContent');
    const docDetailsCloseBtn = document.getElementById('docDetailsCloseBtn');
    const docDetailsCloseBtn2 = document.getElementById('docDetailsCloseBtn2');
    
    // Load documents from backend
    loadDocuments();
    
    // Event listeners
    if (searchForm) searchForm.addEventListener('submit', performSearch);
    if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);
    if (sortSelect) sortSelect.addEventListener('change', sortResults);
    if (prevPageBtn) prevPageBtn.addEventListener('click', previousPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', nextPage);
    
    // View toggle
    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const view = this.dataset.view;
            viewToggles.forEach(t => {
                t.classList.remove('active-view', 'bg-teal-700', 'text-white');
                t.classList.add('bg-white', 'text-gray-600');
            });
            this.classList.remove('bg-white', 'text-gray-600');
            this.classList.add('active-view', 'bg-teal-700', 'text-white');
            
            if (view === 'list') {
                if (listView) listView.classList.remove('hidden');
                if (gridView) gridView.classList.add('hidden');
            } else {
                if (listView) listView.classList.add('hidden');
                if (gridView) gridView.classList.remove('hidden');
            }
        });
    });
    
    // Modal close handlers
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
    
    // Load recent searches
    loadRecentSearches();
    
    // Mobile sidebar toggle
    setupMobileSidebar();
    
    // Active navigation state
    setActiveNav();
});

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInitials = document.getElementById('userInitials');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (user.firstName && user.lastName) {
        const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
        if (userInitials) userInitials.textContent = initials;
        if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
    }
    
    if (user.role && userRole) {
        const roleMap = {
            'admin': 'Administrator',
            'dean': 'Dean',
            'faculty': 'Faculty Member',
            'area-chair': 'Dept. Head',
            'department-head': 'Dept. Head',
            'evaluator': 'External Evaluator'
        };
        userRole.textContent = roleMap[user.role] || user.role;
    }
}

async function loadDocuments() {
    const token = localStorage.getItem('token');
    const loadingResults = document.getElementById('loadingResults');
    const listView = document.getElementById('listView');
    
    if (loadingResults) loadingResults.classList.remove('hidden');
    if (listView) listView.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE}/api/documents?scope=all`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        
        allDocuments = await response.json();
        filteredDocuments = [...allDocuments];
        
        renderSearchResults();
        
    } catch (error) {
        console.error('Error loading documents:', error);
        if (listView) {
            listView.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load documents. Please try again.</div>';
        }
    } finally {
        if (loadingResults) loadingResults.classList.add('hidden');
    }
}

async function performSearch(e) {
    if (e) e.preventDefault();
    
    const searchTerm = document.getElementById('mainSearch')?.value || '';
    const category = document.getElementById('filterCategory')?.value || 'all';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const department = document.getElementById('filterDepartment')?.value || 'all';
    const author = document.getElementById('filterAuthor')?.value || '';
    const version = document.getElementById('filterVersion')?.value || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    const keyword = document.getElementById('filterKeyword')?.value || '';
    const sortBy = document.getElementById('sortResults')?.value || 'relevance';
    
    const loadingResults = document.getElementById('loadingResults');
    const listView = document.getElementById('listView');
    
    if (loadingResults) loadingResults.classList.remove('hidden');
    if (listView) listView.innerHTML = '';
    
    try {
        // Build query params
        const params = new URLSearchParams();
        params.append('scope', 'all');
        if (searchTerm) params.append('q', searchTerm);
        if (category !== 'all') params.append('category', category);
        if (status !== 'all') params.append('status', status);
        if (department !== 'all') params.append('department', department);
        if (author) params.append('author', author);
        if (version) params.append('version', version);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (sortBy !== 'relevance') params.append('sort', sortBy);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/documents/search?${params.toString()}`, {
            headers: { 'x-auth-token': token }
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        filteredDocuments = await response.json();
        currentPage = 1;
        renderSearchResults();
        
        // Save to recent searches
        if (searchTerm) {
            addToRecentSearches(searchTerm);
        }
    } catch (error) {
        console.error('Search error:', error);
        if (listView) {
            listView.innerHTML = '<div class="text-center py-8 text-red-500">Search failed. Please try again.</div>';
        }
    } finally {
        if (loadingResults) loadingResults.classList.add('hidden');
    }
}

function renderSearchResults() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageResults = filteredDocuments.slice(start, end);
    
    const resultCount = document.getElementById('resultCount');
    const paginationInfo = document.getElementById('paginationInfo');
    const listView = document.getElementById('listView');
    const gridView = document.getElementById('gridView');
    const noResults = document.getElementById('noResults');
    
    // Update result count
    if (resultCount) resultCount.textContent = filteredDocuments.length;
    if (paginationInfo) {
        const startNum = filteredDocuments.length > 0 ? start + 1 : 0;
        const endNum = Math.min(end, filteredDocuments.length);
        paginationInfo.textContent = `Showing ${startNum} to ${endNum} of ${filteredDocuments.length} results`;
    }
    
    // Show/hide no results
    if (filteredDocuments.length === 0) {
        if (listView) listView.classList.add('hidden');
        if (gridView) gridView.classList.add('hidden');
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    
    if (noResults) noResults.classList.add('hidden');
    if (listView) listView.classList.remove('hidden');
    
    // Render list view
    if (listView) {
        listView.innerHTML = pageResults.map(doc => createListCard(doc)).join('');
    }
    
    // Render grid view
    if (gridView) {
        gridView.innerHTML = pageResults.map(doc => createGridCard(doc)).join('');
    }
    
    // Attach event listeners to buttons
    attachResultListeners();
    
    // Update pagination buttons
    updatePaginationButtons();
}

function createListCard(doc) {
    const categoryBadge = getCategoryBadge(doc.category);
    const statusBadge = getStatusBadge(doc.workflow_status);
    const date = formatDate(doc.created_at);
    const uploader = doc.author_name || (doc.uploader_firstName && doc.uploader_lastName 
        ? `${doc.uploader_firstName} ${doc.uploader_lastName}` 
        : 'Unknown');
    const description = doc.description || 'No description provided';
    const keywords = doc.keywords ? doc.keywords.split(',').map(k => k.trim()) : [];
    
    return `
        <div class="bg-white rounded-xl p-4 stat-card search-result" data-id="${doc.id}">
            <div class="flex flex-col md:flex-row justify-between gap-3">
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        ${categoryBadge}
                        ${statusBadge}
                    </div>
                    <h3 class="font-medium text-gray-800">${escapeHtml(doc.title || 'Untitled')}</h3>
                    <p class="text-xs text-gray-500 mt-1">by ${escapeHtml(uploader)} · ${date} · ${escapeHtml(doc.version || 'v1.0')}</p>
                    <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(description)}</p>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <span class="badge-department px-2 py-1 rounded-full text-xs">${escapeHtml(doc.department_code || doc.area || 'N/A')}</span>
                        ${keywords.slice(0, 2).map(k => `<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">${escapeHtml(k)}</span>`).join('')}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn-view view-doc-btn" data-id="${doc.id}">View</button>
                    <button class="btn-details details-doc-btn" data-id="${doc.id}">Details</button>
                </div>
            </div>
        </div>
    `;
}

function createGridCard(doc) {
    const categoryBadge = getCategoryBadge(doc.category);
    const statusBadge = getStatusBadge(doc.workflow_status);
    const date = formatDate(doc.created_at);
    const uploader = doc.author_name || (doc.uploader_firstName && doc.uploader_lastName 
        ? `${doc.uploader_firstName} ${doc.uploader_lastName}` 
        : 'Unknown');
    const description = doc.description || 'No description provided';
    
    return `
        <div class="bg-white rounded-xl p-4 stat-card search-result h-full flex flex-col" data-id="${doc.id}">
            <div class="flex flex-wrap items-center gap-2 mb-2">
                ${categoryBadge}
                ${statusBadge}
            </div>
            <h3 class="font-medium text-gray-800 text-sm mb-1">${escapeHtml(doc.title || 'Untitled')}</h3>
            <p class="text-xs text-gray-500 mb-2">by ${escapeHtml(uploader)} · ${date}</p>
            <p class="text-xs text-gray-600 line-clamp-2 flex-1">${escapeHtml(description)}</p>
            <div class="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-100">
                <span class="badge-department px-2 py-1 rounded-full text-xs">${escapeHtml(doc.department_code || doc.area || 'N/A')}</span>
                <button class="btn-view view-doc-btn text-xs ml-auto" data-id="${doc.id}">View</button>
                <button class="btn-details details-doc-btn text-xs" data-id="${doc.id}">Details</button>
            </div>
        </div>
    `;
}

function getCategoryBadge(category) {
    const badges = {
        'instruction': 'badge-instruction',
        'research': 'badge-research',
        'extension': 'badge-extension',
        'employment': 'badge-employment'
    };
    const className = badges[category] || 'badge-instruction';
    const displayName = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Other';
    return `<span class="${className} px-2 py-1 rounded-full text-xs">${displayName}</span>`;
}

function getStatusBadge(status) {
    const badges = {
        'approved': 'badge-approved',
        'pending': 'badge-pending',
        'pending_validation': 'badge-pending',
        'validated': 'badge-validated',
        'pending_approval': 'badge-pending',
        'draft': 'badge-draft',
        'rejected': 'badge-rejected',
        'locked': 'badge-locked'
    };
    const className = badges[status] || 'badge-pending';
    const displayName = status ? status.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown';
    return `<span class="${className} px-2 py-1 rounded-full text-xs">${displayName}</span>`;
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

function attachResultListeners() {
    // View document buttons
    document.querySelectorAll('.view-doc-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docId = parseInt(this.dataset.id);
            const doc = allDocuments.find(d => d.id === docId);
            if (doc && doc.file_url) {
                openPreviewModal(doc);
            } else {
                alert('Document preview would open here');
            }
        });
    });
    
    // Details buttons
    document.querySelectorAll('.details-doc-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docId = parseInt(this.dataset.id);
            const doc = allDocuments.find(d => d.id === docId);
            if (doc) {
                openDetailsModal(doc);
            }
        });
    });
}

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
                    <p class="font-medium text-gray-800 mt-1">${getCategoryDisplayName(doc.category)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Department:</span>
                    <p class="font-medium text-gray-800 mt-1">${escapeHtml(doc.department_code || doc.area || 'N/A')}</p>
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

function getCategoryDisplayName(category) {
    const categoryMap = {
        'instruction': 'Instruction',
        'research': 'Research',
        'extension': 'Extension',
        'employment': 'Employment'
    };
    return categoryMap[category] || category || 'Other';
}

function getStatusText(status) {
    const statusMap = {
        'approved': 'Approved',
        'pending': 'Pending',
        'pending_validation': 'Pending Validation',
        'validated': 'Validated',
        'pending_approval': 'Pending Approval',
        'draft': 'Draft',
        'rejected': 'Rejected',
        'locked': 'Locked'
    };
    return statusMap[status] || status || 'Unknown';
}

function updatePaginationButtons() {
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
        prevPageBtn.classList.toggle('opacity-50', currentPage === 1);
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage >= totalPages;
        nextPageBtn.classList.toggle('opacity-50', currentPage >= totalPages);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderSearchResults();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderSearchResults();
    }
}

function sortResults() {
    // Sorting is now handled by backend via query param
    performSearch();
}

function clearAllFilters() {
    const mainSearch = document.getElementById('mainSearch');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterAuthor = document.getElementById('filterAuthor');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const filterVersion = document.getElementById('filterVersion');
    const filterKeyword = document.getElementById('filterKeyword');
    
    if (mainSearch) mainSearch.value = '';
    if (filterCategory) filterCategory.value = 'all';
    if (filterStatus) filterStatus.value = 'all';
    if (filterDepartment) filterDepartment.value = 'all';
    if (filterAuthor) filterAuthor.value = '';
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';
    if (filterVersion) filterVersion.value = '';
    if (filterKeyword) filterKeyword.value = '';
    
    filteredDocuments = [...allDocuments];
    currentPage = 1;
    renderSearchResults();
}

function addToRecentSearches(term) {
    if (!term || term.trim() === '') return;
    
    const recentContainer = document.getElementById('recentSearches');
    if (!recentContainer) return;
    
    // Check if already exists
    const existing = Array.from(recentContainer.querySelectorAll('.recent-search-term')).some(el => 
        el.textContent.replace('✕', '').trim().toLowerCase() === term.toLowerCase()
    );
    
    if (!existing) {
        const tag = document.createElement('span');
        tag.className = 'bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 recent-search-term';
        tag.innerHTML = `${escapeHtml(term)}<button class="remove-search text-gray-400 hover:text-gray-600">✕</button>`;
        recentContainer.insertBefore(tag, recentContainer.firstChild);
        
        // Limit to 10 recent searches
        while (recentContainer.children.length > 10) {
            recentContainer.removeChild(recentContainer.lastChild);
        }
        
        saveRecentSearches();
        attachRecentSearchListeners();
    }
}

function saveRecentSearches() {
    const recentContainer = document.getElementById('recentSearches');
    if (!recentContainer) return;
    
    const searches = Array.from(recentContainer.querySelectorAll('.recent-search-term')).map(el => 
        el.textContent.replace('✕', '').trim()
    );
    localStorage.setItem('recentSearches', JSON.stringify(searches));
}

function loadRecentSearches() {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
        const searches = JSON.parse(saved);
        const recentContainer = document.getElementById('recentSearches');
        if (recentContainer) {
            recentContainer.innerHTML = '';
            searches.forEach(term => {
                const tag = document.createElement('span');
                tag.className = 'bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 recent-search-term';
                tag.innerHTML = `${escapeHtml(term)}<button class="remove-search text-gray-400 hover:text-gray-600">✕</button>`;
                recentContainer.appendChild(tag);
            });
            attachRecentSearchListeners();
        }
    }
}

function attachRecentSearchListeners() {
    document.querySelectorAll('.remove-search').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const tag = this.closest('.recent-search-term');
            if (tag) {
                tag.remove();
                saveRecentSearches();
            }
        });
    });
    
    document.querySelectorAll('.recent-search-term').forEach(tag => {
        tag.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-search')) return;
            const term = this.textContent.replace('✕', '').trim();
            const mainSearch = document.getElementById('mainSearch');
            if (mainSearch) mainSearch.value = term;
            performSearch();
        });
    });
}

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
    }
    
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
    }
    
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    
    overlay.addEventListener('click', closeSidebar);
    
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeSidebar();
    });
}

function setActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'search.html';
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            navLinks.forEach(l => {
                l.classList.remove('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
                l.style.background = '';
            });
            link.classList.add('active-nav', 'bg-teal-800/40', 'border-l-4', 'border-teal-400');
            link.style.background = '#1a4450';
        }
    });
}