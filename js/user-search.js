// js/user-search.js

const API_BASE = window.API_CONFIG?.API_BASE || 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Search JS loaded');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;

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
    const resultsContainer = document.getElementById('searchResultsContainer');
    
    let allDocuments = [];
    let filteredDocuments = [];

    // Load documents from API
    await loadDocuments();
    
    // Toggle advanced filters
    if (toggleFilters && advancedFilters) {
        toggleFilters.addEventListener('click', function() {
            advancedFilters.classList.toggle('hidden');
            this.querySelector('span').textContent = advancedFilters.classList.contains('hidden') ? '▼' : '▲';
        });
    }
    
    async function loadDocuments() {
        try {
            const response = await fetch(`${API_BASE}/api/documents/search?scope=mine`, {
                headers: { 'x-auth-token': token }
            });
            
            if (!response.ok) throw new Error('Failed to load documents');
            
            allDocuments = await response.json();
            console.log('Loaded documents:', allDocuments.length);
            performSearch();
        } catch (error) {
            console.error('Error loading documents:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="text-center text-gray-500 py-8">Error loading documents. Please try again.</div>';
            }
        }
    }

    // Search function
    async function performSearch() {
        const searchTerm = searchInput?.value || '';
        const category = filterCategory?.value || 'all';
        const status = filterStatus?.value || 'all';
        const department = document.getElementById('filterDepartment')?.value || 'all';
        const author = document.getElementById('filterAuthor')?.value || '';
        const dateFrom = document.getElementById('filterDateFrom')?.value || '';
        const dateTo = document.getElementById('filterDateTo')?.value || '';
        const sortBy = sortSelect?.value || 'relevance';
        
        // Build query params
        const params = new URLSearchParams();
        params.append('scope', 'mine');
        if (searchTerm) params.append('q', searchTerm);
        if (category !== 'all') params.append('category', category);
        if (status !== 'all') params.append('status', status);
        if (department !== 'all') params.append('department', department);
        if (author) params.append('author', author);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (sortBy !== 'relevance') params.append('sort', sortBy);
        
        try {
            const response = await fetch(`${API_BASE}/api/documents/search?${params.toString()}`, {
                headers: { 'x-auth-token': token }
            });
            
            if (!response.ok) throw new Error('Search failed');
            
            filteredDocuments = await response.json();
            renderResults();
        } catch (error) {
            console.error('Search error:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="text-center text-gray-500 py-8">Error searching documents. Please try again.</div>';
            }
        }
    }
    
    function renderResults() {
        if (!resultsContainer) return;
        
        if (resultCount) resultCount.textContent = filteredDocuments.length;
        
        if (filteredDocuments.length === 0) {
            resultsContainer.innerHTML = '<div class="text-center text-gray-500 py-8">No documents found matching your search criteria.</div>';
            return;
        }
        
        resultsContainer.innerHTML = filteredDocuments.map(doc => {
            const categoryBadge = getCategoryBadge(doc.category_display_name || doc.category);
            const statusBadge = getStatusBadge(doc.workflow_status);
            
            return `
                <div class="search-result border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-semibold text-gray-800">${doc.title}</h3>
                        <div class="flex gap-2">
                            ${categoryBadge}
                            ${statusBadge}
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${doc.description || 'No description available'}</p>
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span>By ${doc.author_name || 'Unknown'} · ${formatDate(doc.created_at)}</span>
                        <span>${doc.department_code || doc.area} · ${doc.version || 'v1.0'}</span>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <button class="view-doc-btn px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm" data-id="${doc.id}" data-title="${doc.title.replace(/"/g, '&quot;')}">
                            View Document
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        attachViewHandlers();
    }
    
    function getCategoryBadge(category) {
        const badges = {
            'instruction': '<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Instruction</span>',
            'research': '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Research</span>',
            'extension': '<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Extension</span>',
            'employment': '<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">Employment</span>'
        };
        return badges[category?.toLowerCase()] || '<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">Unknown</span>';
    }
    
    function getStatusBadge(status) {
        const badges = {
            'approved': '<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Approved</span>',
            'locked': '<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">Locked</span>',
            'validated': '<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Validated</span>',
            'pending': '<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Pending</span>',
            'rejected': '<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejected</span>'
        };
        return badges[status?.toLowerCase()] || '<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">Unknown</span>';
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'Unknown';
        }
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
    const filterDepartment = document.getElementById('filterDepartment');
    const filterAuthor = document.getElementById('filterAuthor');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    if (filterDepartment) filterDepartment.addEventListener('change', performSearch);
    if (filterAuthor) {
        let timeout;
        filterAuthor.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(performSearch, 300);
        });
    }
    if (filterDateFrom) filterDateFrom.addEventListener('change', performSearch);
    if (filterDateTo) filterDateTo.addEventListener('change', performSearch);

    // Clear filters button
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            if (filterCategory) filterCategory.value = 'all';
            if (filterStatus) filterStatus.value = 'all';
            if (filterDepartment) filterDepartment.value = 'all';
            if (filterAuthor) filterAuthor.value = '';
            if (filterDateFrom) filterDateFrom.value = '';
            if (filterDateTo) filterDateTo.value = '';
            if (sortSelect) sortSelect.value = 'relevance';
            performSearch();
        });
    }

    // Sort results
    if (sortSelect) {
        sortSelect.addEventListener('change', performSearch);
    }
    
    // Setup preview modal
    setupPreviewModal();
    
    function setupPreviewModal() {
        const docPreviewModal = document.getElementById('docPreviewModal');
        const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
        
        if (docPreviewCloseBtn) {
            docPreviewCloseBtn.addEventListener('click', closePreviewModal);
        }
        
        if (docPreviewModal) {
            docPreviewModal.addEventListener('click', (e) => {
                if (e.target === docPreviewModal) closePreviewModal();
            });
        }
    }
    
    function closePreviewModal() {
        const docPreviewModal = document.getElementById('docPreviewModal');
        const docPreviewFrame = document.getElementById('docPreviewFrame');
        
        if (!docPreviewModal) return;
        
        docPreviewModal.classList.add('hidden');
        docPreviewModal.classList.remove('flex');
        if (docPreviewFrame) docPreviewFrame.src = 'about:blank';
    }
    
    function openPreviewModal(url, title) {
        const docPreviewModal = document.getElementById('docPreviewModal');
        const docPreviewFrame = document.getElementById('docPreviewFrame');
        const docPreviewTitle = document.getElementById('docPreviewTitle');
        
        if (!docPreviewModal || !docPreviewFrame) {
            window.open(url, '_blank');
            return;
        }
        
        if (docPreviewTitle) docPreviewTitle.textContent = title || 'Document Preview';
        docPreviewFrame.src = url;
        docPreviewModal.classList.remove('hidden');
        docPreviewModal.classList.add('flex');
    }
    
    function attachViewHandlers() {
        document.querySelectorAll('.view-doc-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const docId = this.getAttribute('data-id');
                const title = this.getAttribute('data-title');
                
                try {
                    const response = await fetch(`${API_BASE}/api/documents/${docId}/download`, {
                        method: 'GET',
                        headers: { 'x-auth-token': token }
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.msg || 'Failed to view document');
                    }
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    openPreviewModal(url, title);
                } catch (error) {
                    console.error('View error:', error);
                    alert('Failed to view document: ' + error.message);
                }
            });
        });
    }
});
