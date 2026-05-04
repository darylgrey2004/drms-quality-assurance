// js/evaluator-search.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Search JS loaded');

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }

    // Heartbeat
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
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

    // Helper functions
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
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Search documents from API
    async function performSearch() {
        const searchTerm = searchInput?.value || '';
        const category = filterCategory?.value || 'all';
        const department = filterDepartment?.value || 'all';
        const status = filterStatus?.value || 'all';
        const sort = sortSelect?.value || 'relevance';

        // Show loading
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (resultsContainer) resultsContainer.classList.add('hidden');
        if (noResults) noResults.classList.add('hidden');

        try {
            // Build query params
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm);
            if (category !== 'all') params.append('category', category);
            if (department !== 'all') params.append('department', department);
            if (status !== 'all') params.append('status', status);
            if (sort !== 'relevance') params.append('sort', sort);

            const response = await fetch(`http://127.0.0.1:3000/api/documents/search?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const documents = await response.json();
            console.log('Search results:', documents.length);

            currentResults = documents;
            currentPage = 1;
            displayResults();

        } catch (error) {
            console.error('Search error:', error);
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (noResults) {
                noResults.classList.remove('hidden');
                noResults.querySelector('p').textContent = 'Error loading search results. Please try again.';
            }
        }
    }

    // Display results
    function displayResults() {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageDocuments = currentResults.slice(start, end);

        if (currentResults.length === 0) {
            if (resultsContainer) resultsContainer.classList.add('hidden');
            if (noResults) noResults.classList.remove('hidden');
            if (resultCount) resultCount.textContent = '0';
            if (paginationInfo) paginationInfo.textContent = 'Showing 0 to 0 of 0 documents';
            renderPagination();
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
                    <div class="search-result">
                        <div class="flex flex-col md:flex-row justify-between gap-3">
                            <div class="flex-1">
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    <span class="${getCategoryBadge(categoryClass)} px-2 py-1 rounded-full text-xs">${escapeHtml(categoryDisplay)}</span>
                                    <span class="${getStatusBadge(statusClass)} px-2 py-1 rounded-full text-xs">${getStatusText(doc.workflow_status)}</span>
                                </div>
                                <h3 class="font-medium text-gray-800">${escapeHtml(doc.title)}</h3>
                                <p class="text-xs text-gray-500 mt-1">by ${escapeHtml(doc.author_name || 'Unknown')} · ${formatDate(doc.created_at)} · ${escapeHtml(doc.version || 'v1.0')}</p>
                                <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(doc.description || 'No description available')}</p>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <span class="badge-department px-2 py-1 rounded-full text-xs">${escapeHtml(departmentDisplay)}</span>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button class="view-btn px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50 transition" data-doc-id="${doc.id}">View</button>
                                <button class="btn-details px-3 py-1.5 rounded text-xs" data-doc-id="${doc.id}">Details</button>
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
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.dataset.docId;
                const doc = currentResults.find(d => d.id == docId);
                if (doc) {
                    alert(`View-Only Mode\n\nOpening: ${doc.title}\n\nThis would display the document content in a preview modal.`);
                }
            });
        });

        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const docId = this.dataset.docId;
                const doc = currentResults.find(d => d.id == docId);
                if (doc) {
                    const deptDisplay = doc.department_name || doc.department_code || doc.area || 'N/A';
                    alert(`Document Details\n\nTitle: ${doc.title}\nAuthor: ${doc.author_name || 'Unknown'}\nCategory: ${doc.category_display_name || doc.category}\nDepartment: ${deptDisplay}\nStatus: ${doc.workflow_status}\nVersion: ${doc.version || 'v1.0'}\nDescription: ${doc.description || 'No description'}`);
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
    if (filterStatus) filterStatus.addEventListener('change', performSearch);
    if (sortSelect) sortSelect.addEventListener('change', performSearch);

    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterCategory) filterCategory.value = 'all';
            if (filterDepartment) filterDepartment.value = 'all';
            if (filterStatus) filterStatus.value = 'all';
            if (sortSelect) sortSelect.value = 'relevance';
            performSearch();
        });
    }

    // Initial search (load all locked documents for evaluator)
    performSearch();
});
