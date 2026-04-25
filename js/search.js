// js/search.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
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
    const searchResultsRoot = document.getElementById('listView');
    const token = localStorage.getItem('token');
    let allDocuments = [];
    
    function getApi(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: { 'x-auth-token': token }
        }).then((r) => r.json());
    }

    async function openDocument(docId) {
        const files = await getApi(`/api/documents/${docId}/files`).catch(() => []);
        if (Array.isArray(files) && files.length > 0) {
            window.open(`http://localhost:3000${files[0].url_path}`, '_blank');
        }
    }

    function renderDocuments(rows) {
        if (!searchResultsRoot) return;
        const html = rows.map((doc) => `
            <div class="search-result bg-white rounded-lg border border-gray-200 p-4 mb-3" data-category="${(doc.category || '').toLowerCase()}" data-status="${(doc.workflow_status || '').toLowerCase()}">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-semibold text-gray-800">${doc.title || 'Untitled'}</h3>
                        <p class="text-xs text-gray-500">${doc.category || '-'} · ${doc.area || '-'} · ${doc.workflow_status || '-'}</p>
                    </div>
                    <div class="space-x-2">
                        <button class="view-doc text-teal-700" data-doc="${doc.id}">👁️</button>
                        <button class="open-files text-gray-500" data-doc="${doc.id}">📎</button>
                    </div>
                </div>
            </div>
        `).join('');
        searchResultsRoot.innerHTML = html;
        if (gridView) gridView.innerHTML = html;
        document.querySelectorAll('.view-doc, .open-files').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openDocument(btn.getAttribute('data-doc'));
            });
        });
    }
    
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
        const itemsToFilter = [...document.querySelectorAll('#listView .search-result')];
        
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
            
            let matchesDate = true;
            if (dateFrom || dateTo) {
                const source = allDocuments.find((d) => String(d.id) === String(item.querySelector('button[data-doc]')?.getAttribute('data-doc')));
                const created = source?.created_at ? new Date(source.created_at) : null;
                if (created) {
                    if (dateFrom) matchesDate = matchesDate && created >= new Date(dateFrom);
                    if (dateTo) matchesDate = matchesDate && created <= new Date(dateTo);
                }
            }
            
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
        if (paginationInfo) paginationInfo.textContent = `Showing ${visibleCount} of ${allDocuments.length} results`;
        
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
            document.querySelectorAll('#listView .search-result').forEach(item => {
                item.classList.remove('hidden');
            });
            
            // Show all grid items
            document.querySelectorAll('#gridView .search-result').forEach(item => {
                item.classList.remove('hidden');
            });
            
            // Update count
            if (resultCount) resultCount.textContent = String(allDocuments.length);
            if (paginationInfo) paginationInfo.textContent = `Showing ${allDocuments.length} of ${allDocuments.length} results`;
        });
    }
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            console.log('Sorting by:', sortBy);
            
            const sorted = [...allDocuments];
            if (sortBy === 'date_asc') sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            if (sortBy === 'date_desc') sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            if (sortBy === 'title_asc') sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
            if (sortBy === 'title_desc') sorted.sort((a, b) => String(b.title || '').localeCompare(String(a.title || '')));
            renderDocuments(sorted);
            performSearch();
        });
    }
    
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
    
    if (paginationPrev) paginationPrev.addEventListener('click', function() {});
    if (paginationNext) paginationNext.addEventListener('click', function() {});
    
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
    
    getApi('/api/documents')
        .then((docs) => {
            allDocuments = Array.isArray(docs) ? docs : [];
            renderDocuments(allDocuments);
            if (resultCount) resultCount.textContent = String(allDocuments.length);
            if (paginationInfo) paginationInfo.textContent = `Showing ${allDocuments.length} of ${allDocuments.length} results`;
        })
        .catch(() => {
            allDocuments = [];
            renderDocuments([]);
            if (resultCount) resultCount.textContent = '0';
            if (paginationInfo) paginationInfo.textContent = 'Showing 0 of 0 results';
        });
});