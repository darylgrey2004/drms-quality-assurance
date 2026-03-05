// js/user-search.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Search JS loaded');

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
    const searchResults = document.querySelectorAll('.search-result');
    const viewButtons = document.querySelectorAll('.view-result');

    // Toggle advanced filters
    if (toggleFilters && advancedFilters) {
        toggleFilters.addEventListener('click', function() {
            advancedFilters.classList.toggle('hidden');
            this.querySelector('span').textContent = advancedFilters.classList.contains('hidden') ? '▼' : '▲';
        });
    }

    // Search function
    function performSearch() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const category = filterCategory?.value || 'all';
        const status = filterStatus?.value || 'all';
        
        let visibleCount = 0;

        searchResults.forEach(result => {
            const text = result.textContent.toLowerCase();
            const categoryBadge = result.querySelector('.bg-teal-100, .bg-amber-100, .bg-indigo-100')?.textContent.toLowerCase() || '';
            const statusBadge = result.querySelector('.bg-green-100, .bg-amber-100, .bg-blue-100')?.textContent.toLowerCase() || '';

            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesCategory = category === 'all' || categoryBadge.includes(category);
            const matchesStatus = status === 'all' || statusBadge.includes(status);

            if (matchesSearch && matchesCategory && matchesStatus) {
                result.classList.remove('hidden');
                visibleCount++;
            } else {
                result.classList.add('hidden');
            }
        });

        if (resultCount) resultCount.textContent = visibleCount;
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
            alert(`Sort by ${sortBy} would reorder results in the full system.`);
        });
    }

    // View result buttons
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const result = this.closest('.search-result');
            const title = result?.querySelector('h3')?.textContent || 'Document';
            alert(`Viewing: ${title}\n\nThis would open the document.`);
        });
    });

    // Pagination
    document.querySelectorAll('.flex.gap-2 button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === 'Previous' || this.textContent === 'Next') {
                alert(this.textContent + ' page');
            } else if (this.textContent.match(/^\d+$/)) {
                document.querySelectorAll('.flex.gap-2 button').forEach(b => {
                    if (b.textContent.match(/^\d+$/)) {
                        b.classList.remove('bg-teal-700', 'text-white');
                        b.classList.add('bg-white', 'border', 'text-gray-600');
                    }
                });
                this.classList.add('bg-teal-700', 'text-white');
                alert(`Page ${this.textContent}`);
            }
        });
    });
});