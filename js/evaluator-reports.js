// js/evaluator-reports.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Reports JS loaded');

    // Tab switching
    const tabLinks = document.querySelectorAll('#reportTabs a');
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

    // Summary cards click
    const summaryCards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-3 .stat-card');
    summaryCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3')?.textContent || 'Report';
            const percentage = this.querySelector('.text-3xl')?.textContent || '';
            const details = this.querySelector('.text-sm.text-gray-500')?.textContent || '';
            
            alert(`📊 ${title}\n\nCurrent Status: ${percentage}\n${details}\n\nThis shows the overall compliance summary for ${title}.`);
        });
    });

    // Clause status items
    const clauseItems = document.querySelectorAll('.flex.justify-between.items-center');
    clauseItems.forEach(item => {
        item.addEventListener('click', function() {
            const clause = this.querySelector('span:first-child')?.textContent || 'Item';
            const status = this.querySelector('span:last-child')?.textContent || '';
            
            alert(`📋 ${clause}\n\nStatus: ${status}\n\nClick for detailed document list.`);
        });
    });

    // Report items already have onclick handlers
    // Additional logging for analytics
    document.querySelectorAll('.border.rounded-lg').forEach(item => {
        item.addEventListener('click', function() {
            const reportName = this.querySelector('h4')?.textContent || 'Report';
            console.log(`Viewing report: ${reportName}`);
        });
    });

    // Historical timeline items
    const timelineItems = document.querySelectorAll('.border-l-4');
    timelineItems.forEach(item => {
        item.addEventListener('click', function() {
            const year = this.querySelector('.text-sm.text-gray-500')?.textContent || 'Year';
            const value = this.querySelector('.text-lg')?.textContent || '';
            
            alert(`📅 ${year}\n\n${value}\n\nHistorical performance data for this period.`);
        });
    });

    // View-only mode indicator
    console.log('Reports loaded in view-only mode');

    // Any attempt to generate new reports
    document.addEventListener('click', function(e) {
        if (e.target.closest('button')?.textContent.includes('Generate') ||
            e.target.closest('button')?.textContent.includes('Export') ||
            e.target.closest('button')?.textContent.includes('Download')) {
            e.preventDefault();
            alert('❌ Report generation is disabled. You have view-only access to existing reports.');
        }
    });
});