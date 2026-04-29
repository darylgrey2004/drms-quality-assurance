// js/user-evidence-map.js

document.addEventListener('DOMContentLoaded', async function() {
    console.log('User Evidence Map JS loaded');

    // Initialize user session (handled by user-session.js)
    const session = await initializeUserPage();
    if (!session) return;
    
    const { token, user, role } = session;

    // Tab switching
    const tabLinks = document.querySelectorAll('#mapTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('searchMap');
    const standardFilter = document.getElementById('standardFilter');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');

            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');

            tabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(tabId + 'Tab').classList.remove('hidden');

            if (standardFilter) standardFilter.value = tabId;
        });
    });

    // Search filter
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('.tab-content:not(.hidden) .border.rounded-lg').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(term) ? 'block' : 'none';
            });
        });
    }

    // Standard filter
    if (standardFilter) {
        standardFilter.addEventListener('change', function() {
            const value = this.value;
            tabLinks.forEach(link => {
                if (link.getAttribute('data-tab') === value) {
                    link.click();
                }
            });
        });
    }

    // View buttons (view-only)
    document.querySelectorAll('.border.rounded-lg').forEach(item => {
        item.addEventListener('click', function() {
            const clause = this.querySelector('h4')?.textContent || 'item';
            alert(`Viewing details for: ${clause}\n\nThis shows which documents are mapped to this standard.`);
        });
    });
});
