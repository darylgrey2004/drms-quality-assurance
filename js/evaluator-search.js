document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const filterDate = document.getElementById('filterDate');
    const clearFilters = document.getElementById('clearFilters');
    const sortSelect = document.getElementById('sortResults');
    const resultsContainer = document.getElementById('searchResults');
    const resultCount = document.getElementById('resultCount');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResults = document.getElementById('noResults');
    const paginationInfo = document.getElementById('paginationInfo');
    const pagination = document.getElementById('pagination');

    let allDocuments = [];
    let currentPage = 1;
    const pageSize = 8;

    function api(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: { 'x-auth-token': token }
        }).then(async (res) => {
            const payload = await res.json().catch(() => []);
            if (!res.ok) throw new Error(payload?.msg || payload?.error?.message || 'Request failed');
            return payload;
        });
    }

    // Display results
    function displayResults(results) {
        resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            noResults.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            pagination.classList.add('hidden');
            paginationInfo.classList.add('hidden');
            return;
        }

        noResults.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        pagination.classList.remove('hidden');
        paginationInfo.classList.remove('hidden');

        const total = results.length;
        const start = (currentPage - 1) * pageSize;
        const pageRows = results.slice(start, start + pageSize);

        pageRows.forEach(doc => {
            const resultEl = document.createElement('div');
            resultEl.className = 'search-result';
            resultEl.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="badge-iso">${doc.category || '-'}</span>
                            <span class="status-pending">${doc.workflow_status || '-'}</span>
                        </div>
                        <h3 class="font-medium text-gray-800 text-lg">${doc.title || 'Untitled'}</h3>
                        <p class="text-sm text-gray-600 mt-1">${doc.description || ''}</p>
                        <div class="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                            <span>📁 ${doc.area || '-'}</span>
                            <span>👤 ${doc.author_name || '-'}</span>
                            <span>📅 ${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}</span>
                            <span>📌 ${doc.version || 'v1.0'}</span>
                        </div>
                    </div>
                    <div class="flex items-center mt-3 md:mt-0">
                        <button class="view-btn" data-id="${doc.id}">View Document</button>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(resultEl);
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                const files = await api(`/api/documents/${id}/files`).catch(() => []);
                if (Array.isArray(files) && files.length > 0) {
                    window.open(`http://localhost:3000${files[0].url_path}`, '_blank');
                }
            });
        });

        resultCount.textContent = String(total);
        paginationInfo.textContent = `Showing ${total === 0 ? 0 : start + 1} to ${Math.min(start + pageRows.length, total)} of ${total} documents`;
    }

    // Filter results
    function filterResults() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = filterCategory.value;
        const status = filterStatus.value;
        const date = filterDate.value;

        let filtered = allDocuments.filter(doc => {
            const matchesSearch = searchTerm === '' || 
                String(doc.title || '').toLowerCase().includes(searchTerm) ||
                String(doc.author_name || '').toLowerCase().includes(searchTerm) ||
                String(doc.description || '').toLowerCase().includes(searchTerm);

            // Category filter
            const matchesCategory = category === 'all' || 
                String(doc.category || '').toLowerCase() === category;

            // Status filter
            const matchesStatus = status === 'all' || 
                String(doc.workflow_status || '').toLowerCase() === status;

            // Date filter (simplified for demo)
            let matchesDate = true;
            if (date !== 'all') {
                const docDate = new Date(doc.created_at);
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

                switch(date) {
                    case 'today':
                        matchesDate = docDate.toDateString() === today.toDateString();
                        break;
                    case 'week':
                        matchesDate = docDate >= weekAgo;
                        break;
                    case 'month':
                        matchesDate = docDate >= monthAgo;
                        break;
                    case 'year':
                        matchesDate = docDate >= yearAgo;
                        break;
                }
            }

            return matchesSearch && matchesCategory && matchesStatus && matchesDate;
        });

        // Sort results
        const sortBy = sortSelect.value;
        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'date_desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date_asc':
                    return new Date(a.date) - new Date(b.date);
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'title_desc':
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });

        currentPage = 1;
        displayResults(filtered);
        return filtered;
    }

    // Event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            loadingIndicator.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            
            setTimeout(() => {
                loadingIndicator.classList.add('hidden');
                filterResults();
            }, 500);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    if (filterCategory) filterCategory.addEventListener('change', filterResults);
    if (filterStatus) filterStatus.addEventListener('change', filterResults);
    if (filterDate) filterDate.addEventListener('change', filterResults);
    if (sortSelect) sortSelect.addEventListener('change', filterResults);

    if (clearFilters) {
        clearFilters.addEventListener('click', function() {
            searchInput.value = '';
            filterCategory.value = 'all';
            filterStatus.value = 'all';
            filterDate.value = 'all';
            sortSelect.value = 'relevance';
            filterResults();
        });
    }

    // Pagination
    document.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', function() {
            const filtered = filterResults();
            const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
            const page = this.getAttribute('data-page');
            if (page === 'prev' && currentPage > 1) {
                currentPage--;
            } else if (page === 'next' && currentPage < totalPages) {
                currentPage++;
            } else if (!isNaN(page)) {
                currentPage = Math.min(totalPages, parseInt(page, 10));
            }

            // Update pagination buttons
            document.querySelectorAll('[data-page]').forEach(b => {
                if (!isNaN(b.getAttribute('data-page'))) {
                    if (parseInt(b.getAttribute('data-page')) === currentPage) {
                        b.classList.add('bg-teal-700', 'text-white');
                        b.classList.remove('bg-white', 'text-gray-600', 'border');
                    } else {
                        b.classList.remove('bg-teal-700', 'text-white');
                        b.classList.add('bg-white', 'border', 'text-gray-600');
                    }
                }
            });

            // Enable/disable prev/next
            const prevBtn = document.querySelector('[data-page="prev"]');
            const nextBtn = document.querySelector('[data-page="next"]');
            if (prevBtn) prevBtn.disabled = currentPage === 1;
            if (nextBtn) nextBtn.disabled = currentPage === totalPages;
            displayResults(filtered);
        });
    });

    api('/api/documents')
        .then((docs) => {
            allDocuments = Array.isArray(docs) ? docs : [];
            displayResults(allDocuments);
        })
        .catch(() => {
            allDocuments = [];
            displayResults([]);
        });
});