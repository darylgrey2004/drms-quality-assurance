// js/user-approvals.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('User Approvals JS loaded');

    // DOM elements
    const searchInput = document.getElementById('searchApprovals');
    const priorityFilter = document.getElementById('priorityFilter');
    const areaFilter = document.getElementById('areaFilter');
    const approveBtns = document.querySelectorAll('.approve-btn');
    const reviewBtns = document.querySelectorAll('.review-btn');
    const returnBtns = document.querySelectorAll('.return-btn');

    // Filter function
    function filterApprovals() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const priority = priorityFilter?.value || 'all';
        const area = areaFilter?.value || 'all';

        document.querySelectorAll('.border-l-4').forEach(item => {
            const text = item.textContent.toLowerCase();
            const hasUrgent = item.classList.contains('border-red-500');
            const areaText = item.querySelector('.bg-amber-100, .bg-blue-100, .bg-indigo-100')?.textContent.toLowerCase() || '';

            const matchesSearch = searchTerm === '' || text.includes(searchTerm);
            const matchesPriority = priority === 'all' || 
                (priority === 'urgent' && hasUrgent) ||
                (priority === 'normal' && !hasUrgent);
            const matchesArea = area === 'all' || areaText.includes(area);

            item.style.display = (matchesSearch && matchesPriority && matchesArea) ? 'block' : 'none';
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterApprovals);
    if (priorityFilter) priorityFilter.addEventListener('change', filterApprovals);
    if (areaFilter) areaFilter.addEventListener('change', filterApprovals);

    // Approve button
    approveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.border-l-4');
            const title = item.querySelector('h3')?.textContent || 'Document';
            
            if (confirm(`Approve "${title}"?`)) {
                alert('Document approved successfully!');
                item.remove();
                updateStats();
            }
        });
    });

    // Review button
    reviewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.border-l-4');
            const title = item.querySelector('h3')?.textContent || 'Document';
            
            alert(`Opening review panel for: ${title}\n\nThis would show the document for detailed review.`);
        });
    });

    // Return button
    returnBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.border-l-4');
            const title = item.querySelector('h3')?.textContent || 'Document';
            
            const reason = prompt(`Provide feedback for returning "${title}":`);
            if (reason) {
                alert(`Document returned to faculty.\nFeedback: ${reason}`);
                item.remove();
                updateStats();
            }
        });
    });

    // Update stats after actions
    function updateStats() {
        const pendingCount = document.querySelectorAll('.border-l-4').length;
        const pendingElement = document.querySelector('.grid .stat-card:first-child .text-3xl');
        if (pendingElement) {
            pendingElement.textContent = pendingCount;
        }
    }

    // Stats cards click (for demo)
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', function() {
            const label = this.querySelector('.text-gray-500')?.textContent;
            if (label === 'Pending Review') {
                alert('Showing all pending approvals');
            } else if (label === 'Approved (This Month)') {
                alert('Showing approved documents this month');
            }
        });
    });
});