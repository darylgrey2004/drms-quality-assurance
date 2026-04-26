// js/evaluator-search.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Search JS loaded');

    // ── Heartbeat: Update lastActive status ──
    const token = localStorage.getItem('token');
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    if (token) {
        sendHeartbeat();
        setInterval(sendHeartbeat, 2 * 60 * 1000);
    }

    // Mock data - in real app, this would come from an API
    const mockDocuments = [
        {
            title: 'Quality Management System Manual',
            category: 'ISO',
            categoryClass: 'badge-iso',
            area: 'Clause 4-10',
            status: 'Approved',
            statusClass: 'status-approved',
            version: 'v3.2',
            author: 'Dr. Santos',
            date: '2026-02-15',
            description: 'Comprehensive quality manual covering ISO 9001:2015 requirements.'
        },
        {
            title: 'Curriculum Development Framework',
            category: 'AACCUP',
            categoryClass: 'badge-aaccup',
            area: 'Area II, III',
            status: 'Pending',
            statusClass: 'status-pending',
            version: 'v1.0',
            author: 'Prof. Garcia',
            date: '2026-02-20',
            description: 'Framework for curriculum development aligned with AACCUP standards.'
        },
        {
            title: 'Research Output Compilation 2025',
            category: 'COE',
            categoryClass: 'badge-coe',
            area: 'Indicator 2',
            status: 'Draft',
            statusClass: 'status-draft',
            version: 'v0.3',
            author: 'Dr. Reyes',
            date: '2026-02-25',
            description: 'Compilation of faculty research outputs for COE Indicator 2.'
        },
        {
            title: 'Faculty Profile and Qualifications',
            category: 'AACCUP',
            categoryClass: 'badge-aaccup',
            area: 'Area II',
            status: 'Approved',
            statusClass: 'status-approved',
            version: 'v2.1',
            author: 'Dean Cruz',
            date: '2026-01-10',
            description: 'Comprehensive faculty profiles and qualifications.'
        },
        {
            title: 'Internal Audit Report Q4 2025',
            category: 'ISO',
            categoryClass: 'badge-iso',
            area: 'Clause 9',
            status: 'Expired',
            statusClass: 'status-expired',
            version: 'v1.5',
            author: 'QA Office',
            date: '2025-12-01',
            description: 'Internal audit findings and corrective actions.'
        }
    ];

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

    let currentPage = 1;
    let currentResults = [...mockDocuments];

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

        results.forEach(doc => {
            const resultEl = document.createElement('div');
            resultEl.className = 'search-result';
            resultEl.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="${doc.categoryClass}">${doc.category}</span>
                            <span class="${doc.statusClass}">${doc.status}</span>
                        </div>
                        <h3 class="font-medium text-gray-800 text-lg">${doc.title}</h3>
                        <p class="text-sm text-gray-600 mt-1">${doc.description}</p>
                        <div class="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                            <span>📁 ${doc.area}</span>
                            <span>👤 ${doc.author}</span>
                            <span>📅 ${doc.date}</span>
                            <span>📌 v${doc.version}</span>
                        </div>
                    </div>
                    <div class="flex items-center mt-3 md:mt-0">
                        <button class="view-btn" data-doc='${JSON.stringify(doc)}'>View Document</button>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(resultEl);
        });

        // Add view button listeners
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const doc = JSON.parse(this.getAttribute('data-doc'));
                alert(`📄 Viewing Document (Read-Only)\n\nTitle: ${doc.title}\nCategory: ${doc.category}\nArea: ${doc.area}\nStatus: ${doc.status}\nAuthor: ${doc.author}\nDate: ${doc.date}\nVersion: ${doc.version}\n\nDescription: ${doc.description}\n\nThis is a view-only preview. In the full system, the complete document would open.`);
            });
        });

        resultCount.textContent = results.length;
        paginationInfo.textContent = `Showing 1 to ${results.length} of ${mockDocuments.length} documents`;
    }

    // Filter results
    function filterResults() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = filterCategory.value;
        const status = filterStatus.value;
        const date = filterDate.value;

        let filtered = mockDocuments.filter(doc => {
            // Search filter
            const matchesSearch = searchTerm === '' || 
                doc.title.toLowerCase().includes(searchTerm) ||
                doc.author.toLowerCase().includes(searchTerm) ||
                doc.description.toLowerCase().includes(searchTerm);

            // Category filter
            const matchesCategory = category === 'all' || 
                doc.category.toLowerCase() === category;

            // Status filter
            const matchesStatus = status === 'all' || 
                doc.status.toLowerCase() === status;

            // Date filter (simplified for demo)
            let matchesDate = true;
            if (date !== 'all') {
                const docDate = new Date(doc.date);
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

        currentResults = filtered;
        displayResults(filtered);
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
            const page = this.getAttribute('data-page');
            if (page === 'prev' && currentPage > 1) {
                currentPage--;
            } else if (page === 'next' && currentPage < 4) {
                currentPage++;
            } else if (!isNaN(page)) {
                currentPage = parseInt(page);
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
            if (nextBtn) nextBtn.disabled = currentPage === 4;

            alert(`📑 Page ${currentPage} would load more documents in the full system.`);
        });
    });

    // Initial display
    displayResults(mockDocuments);
});