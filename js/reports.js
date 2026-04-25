// js/reports.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    // DOM elements
    const reportPeriod = document.getElementById('reportPeriod');
    const reportFormat = document.getElementById('reportFormat');
    const generateBtn = document.getElementById('generateReport');
    const exportBtn = document.getElementById('exportReport');
    const tabLinks = document.querySelectorAll('#reportTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    const generateGapReport = document.getElementById('generateGapReport');
    
    const reportRows = document.querySelectorAll('.grid.grid-cols-12.py-3');

    function api(path) {
        return fetch(`http://localhost:3000${path}`, {
            headers: token ? { 'x-auth-token': token } : {}
        }).then((r) => r.json());
    }
    
    // Tab switching functionality
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get tab id
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab styling
            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            // Show selected tab
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.remove('hidden');
                activeTab.classList.add('block');
            }
        });
    });
    
    // Generate report button
    if (generateBtn) {
        generateBtn.addEventListener('click', async function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="mr-2">⏳</span> Generating...';
            this.disabled = true;
            const stats = await api('/api/documents/stats').catch(() => null);
            const blob = new Blob([JSON.stringify(stats || {}, null, 2)], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = `reports-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(href);
            this.innerHTML = originalText;
            this.disabled = false;
        });
    }
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', async function() {
            const docs = await api('/api/documents').catch(() => []);
            const blob = new Blob([JSON.stringify(docs || [], null, 2)], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = `documents-export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(href);
        });
    }
    
    // Generate Gap Report button (in Completeness tab)
    if (generateGapReport) {
        generateGapReport.addEventListener('click', async function(e) {
            e.preventDefault();
            const docs = await api('/api/documents').catch(() => []);
            const missing = (Array.isArray(docs) ? docs : []).filter((d) => String(d.workflow_status || '').toLowerCase() !== 'approved');
            const blob = new Blob([JSON.stringify(missing, null, 2)], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = `gap-report-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(href);
        });
    }
    
    // Download buttons in recent reports
    document.querySelectorAll('.text-teal-600').forEach(btn => {
        if (btn.textContent.includes('📥 Download')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const reportRow = this.closest('.grid');
                const reportName = reportRow?.querySelector('.font-medium')?.textContent || 'Report';
                const blob = new Blob([reportName], { type: 'text/plain' });
                const href = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = href;
                a.download = `${reportName.replace(/\s+/g, '-').toLowerCase()}.txt`;
                a.click();
                URL.revokeObjectURL(href);
            });
        }
    });
    
    // View buttons in recent reports
    document.querySelectorAll('.text-gray-500').forEach(btn => {
        if (btn.textContent.includes('👁️ View')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const reportRow = this.closest('.grid');
                const reportName = reportRow?.querySelector('.font-medium')?.textContent || 'Report';
                const preview = window.open('', '_blank');
                if (preview) {
                    preview.document.write(`<h2>${reportName}</h2><p>Generated from backend data.</p>`);
                    preview.document.close();
                }
            });
        }
    });
    
    // Custom period handling
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            if (this.value === 'custom') this.value = 'this-month';
        });
    }
    
    // View All link
    const viewAllLink = document.querySelector('a[href="#"].text-sm.text-teal-700');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('overviewTab')?.classList.remove('hidden');
        });
    }

    api('/api/documents/stats').then((stats) => {
        const total = stats?.total || 0;
        if (reportRows.length > 0) {
            const firstMetric = reportRows[0].querySelector('.font-medium');
            if (firstMetric) firstMetric.textContent = `Total Documents: ${total}`;
        }
    }).catch(() => {});
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'reports.html';
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
    
    // Initialize with Overview tab active
    // Already set in HTML
});