// js/reports.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reports page JS loaded successfully');
    
    // DOM elements
    const reportPeriod = document.getElementById('reportPeriod');
    const reportFormat = document.getElementById('reportFormat');
    const generateBtn = document.getElementById('generateReport');
    const exportBtn = document.getElementById('exportReport');
    const tabLinks = document.querySelectorAll('#reportTabs a');
    const tabContents = document.querySelectorAll('.tab-content');
    const generateGapReport = document.getElementById('generateGapReport');
    
    // Download buttons in recent reports
    const downloadBtns = document.querySelectorAll('.text-teal-600:contains("📥 Download")');
    const viewBtns = document.querySelectorAll('.text-gray-500:contains("👁️ View")');
    
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
        generateBtn.addEventListener('click', function() {
            const period = reportPeriod ? reportPeriod.value : 'this-month';
            const format = reportFormat ? reportFormat.value : 'pdf';
            
            // Find active tab
            let activeTab = 'overview';
            tabLinks.forEach(link => {
                if (link.classList.contains('active-tab')) {
                    activeTab = link.getAttribute('data-tab');
                }
            });
            
            console.log(`Generating ${format} report for ${activeTab} (${period})`);
            
            // Visual feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="mr-2">⏳</span> Generating...';
            this.disabled = true;
            
            setTimeout(() => {
                alert(`Report generated successfully!\n\nType: ${activeTab} report\nPeriod: ${period}\nFormat: ${format}\n\nIn a full system, this would download the report.`);
                this.innerHTML = originalText;
                this.disabled = false;
            }, 1500);
        });
    }
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const format = reportFormat ? reportFormat.value : 'pdf';
            
            // Find active tab
            let activeTab = 'overview';
            tabLinks.forEach(link => {
                if (link.classList.contains('active-tab')) {
                    activeTab = link.getAttribute('data-tab');
                }
            });
            
            alert(`Exporting current view as ${format.toUpperCase()}\n\nThis would download the visible data in ${format.toUpperCase()} format.`);
        });
    }
    
    // Generate Gap Report button (in Completeness tab)
    if (generateGapReport) {
        generateGapReport.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Generating detailed gap analysis report...\n\nThis would create a comprehensive report of all missing documents by area and priority.');
        });
    }
    
    // Download buttons in recent reports
    document.querySelectorAll('.text-teal-600').forEach(btn => {
        if (btn.textContent.includes('📥 Download')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const reportRow = this.closest('.grid');
                const reportName = reportRow?.querySelector('.font-medium')?.textContent || 'Report';
                alert(`Downloading: ${reportName}`);
            });
        }
    });
    
    // View buttons in recent reports
    document.querySelectorAll('.text-gray-500').forEach(btn => {
        if (btn.textContent.includes('👁️ View')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const reportRow = this.closest('.grid');
                const reportName = reportRow?.query.querySelector('.font-medium')?.textContent || 'Report';
                alert(`Viewing: ${reportName}\n\nThis would open the report in a preview window.`);
            });
        }
    });
    
    // Custom period handling
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            if (this.value === 'custom') {
                const startDate = prompt('Enter start date (YYYY-MM-DD):', '2026-01-01');
                const endDate = prompt('Enter end date (YYYY-MM-DD):', '2026-12-31');
                
                if (startDate && endDate) {
                    alert(`Custom range: ${startDate} to ${endDate}`);
                } else {
                    // Reset to previous value if cancelled
                    this.value = 'this-month';
                }
            }
        });
    }
    
    // View All link
    const viewAllLink = document.querySelector('a[href="#"].text-sm.text-teal-700');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Viewing all generated reports...\n\nThis would navigate to a full reports archive.');
        });
    }
    
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