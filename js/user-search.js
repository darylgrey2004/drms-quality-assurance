// js/user-search.js

const API_BASE = 'http://localhost:3000';

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
            const response = await fetch(`${API_BASE}/api/documents?scope=mine`, {
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
    function performSearch() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const category = filterCategory?.value || 'all';
        const status = filterStatus?.value || 'all';
        
        filteredDocuments = allDocuments.filter(doc => {
            const matchesSearch = !searchTerm || 
                doc.title.toLowerCase().includes(searchTerm) ||
                (doc.description || '').toLowerCase().includes(searchTerm) ||
                (doc.keywords || '').toLowerCase().includes(searchTerm) ||
                (doc.author_name || '').toLowerCase().includes(searchTerm);
            
            const matchesCategory = category === 'all' || 
                doc.category === category || 
                doc.category_name === category;
            
            const matchesStatus = status === 'all' || 
                doc.workflow_status === status;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
        
        renderResults();
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
                        <button onclick="viewDocument(${doc.id}, '${doc.title.replace(/'/g, "\\'")}')"
                                class="view-result px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm">
                            View Document
                        </button>
                    </div>
                </div>
            `;
        }).join('');
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
            'rejected': '<span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejected</span>',
            'draft': '<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">Draft</span>'
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
    if (filterDate) filterDate.addEventListener('change', performSearch);

    // Sort results
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            
            if (sortBy === 'date-desc') {
                filteredDocuments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (sortBy === 'date-asc') {
                filteredDocuments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            } else if (sortBy === 'title-asc') {
                filteredDocuments.sort((a, b) => a.title.localeCompare(b.title));
            } else if (sortBy === 'title-desc') {
                filteredDocuments.sort((a, b) => b.title.localeCompare(a.title));
            }
            
            renderResults();
        });
    }
});

// Global function for viewing documents
function viewDocument(docId, title) {
    console.log('View document:', docId, title);
    window.location.href = `view-document.html?id=${docId}`;
}
