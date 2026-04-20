// js/evaluator-evidence-map.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Evidence Map JS loaded');

    // Tab switching
    const tabLinks = document.querySelectorAll('#mapTabs a');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');

            // Update active tab
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');

            // Show selected tab
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(tabId + 'Tab').classList.remove('hidden');
        });
    });

    // Evidence items
    const evidenceItems = document.querySelectorAll('.border.rounded-lg');
    evidenceItems.forEach(item => {
        item.addEventListener('click', function() {
            const clause = this.querySelector('h4')?.textContent || 'Standard';
            console.log(`Viewing documents for: ${clause}`);
        });
    });

    // Summary cards click - show overview
    const summaryCards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-3 .stat-card');
    summaryCards.forEach(card => {
        card.addEventListener('click', function() {
            const standard = this.querySelector('h3')?.textContent || 'Standard';
            const percentage = this.querySelector('.text-xs')?.textContent || '';
            alert(`📊 ${standard}\n\n${percentage}\n\nThis shows overall completion for this standard. Click on individual clauses to see detailed document mapping.`);
        });
    });

    // View-only mode indicator
    console.log('Evidence Map loaded in view-only mode');

    // Any attempt to interact with edit features
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Edit') ||
            e.target.closest('button')?.textContent.includes('Add') ||
            e.target.closest('button')?.textContent.includes('Delete')) {
            e.preventDefault();
            alert('❌ Edit actions are disabled. You have view-only access.');
        }
    });
});
// Mobile Sidebar Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.w-72');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar && overlay) {
        // Toggle sidebar when hamburger menu is clicked
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
        
        // Close sidebar when overlay is clicked
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
        
        // Close sidebar when a navigation link is clicked (optional)
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });
    }
    
    // Close sidebar when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    });
});