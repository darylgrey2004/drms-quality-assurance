// js/documents.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Documents page JS loaded successfully');
    
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const docRows = document.querySelectorAll('.doc-row');
    const docCount = document.getElementById('docCount');
    const uploadBtn = document.getElementById('uploadBtn');
    const filterBtn = document.getElementById('filterBtn');
    
    // Update document count
    function updateDocCount() {
        const visibleRows = document.querySelectorAll('.doc-row:not(.hidden)');
        docCount.textContent = visibleRows.length;
    }
    
    // Filter function
    function filterDocuments() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const category = categoryFilter ? categoryFilter.value : 'all';
        const status = statusFilter ? statusFilter.value : 'all';
        
        docRows.forEach(row => {
            const title = row.querySelector('.font-medium')?.textContent.toLowerCase() || '';
            const author = row.querySelector('.text-gray-400')?.textContent.toLowerCase() || '';
            const categoryText = row.querySelector('.col-span-2.text-gray-600')?.textContent.toLowerCase() || '';
            const statusSpan = row.querySelector('[class*="badge-"]')?.textContent.toLowerCase() || '';
            
            // Search match
            const matchesSearch = searchTerm === '' || 
                                 title.includes(searchTerm) || 
                                 author.includes(searchTerm) ||
                                 categoryText.includes(searchTerm);
            
            // Category match
            let matchesCategory = category === 'all';
            if (!matchesCategory) {
                if (category === 'iso' && categoryText.includes('iso')) matchesCategory = true;
                if (category === 'aaccup' && categoryText.includes('aaccup')) matchesCategory = true;
                if (category === 'coe' && categoryText.includes('coe')) matchesCategory = true;
            }
            
            // Status match
            let matchesStatus = status === 'all';
            if (!matchesStatus) {
                if (status === 'approved' && statusSpan.includes('approved')) matchesStatus = true;
                if (status === 'pending' && (statusSpan.includes('pending') || statusSpan.includes('review'))) matchesStatus = true;
                if (status === 'draft' && statusSpan.includes('draft')) matchesStatus = true;
                if (status === 'expired' && statusSpan.includes('expired')) matchesStatus = true;
            }
            
            // Show/hide based on all filters
            if (matchesSearch && matchesCategory && matchesStatus) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        });
        
        updateDocCount();
    }
    
    // Add event listeners for filters
    if (searchInput) searchInput.addEventListener('input', filterDocuments);
    if (categoryFilter) categoryFilter.addEventListener('change', filterDocuments);
    if (statusFilter) statusFilter.addEventListener('change', filterDocuments);
    
    // Action button handlers
    const viewBtns = document.querySelectorAll('.view-btn');
    const attachBtns = document.querySelectorAll('.attach-btn');
    const editBtns = document.querySelectorAll('.edit-btn');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docRow = this.closest('.doc-row');
            const docTitle = docRow?.querySelector('.font-medium')?.textContent || 'Document';
            console.log(`View document: ${docTitle}`);
            alert(`Viewing: ${docTitle}\n(This would open the document viewer in the full system)`);
        });
    });
    
    attachBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docRow = this.closest('.doc-row');
            const docTitle = docRow?.querySelector('.font-medium')?.textContent || 'Document';
            console.log(`Attachments for: ${docTitle}`);
            alert(`Attachments for: ${docTitle}\n(This would show version history and attachments)`);
        });
    });
    
    editBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docRow = this.closest('.doc-row');
            const docTitle = docRow?.querySelector('.font-medium')?.textContent || 'Document';
            console.log(`Edit document: ${docTitle}`);
            alert(`Editing: ${docTitle}\n(This would open the document editor)`);
        });
    });
    
    // Upload button handler
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            console.log('Upload button clicked');
            alert('Upload new document - This would open the upload form');
        });
    }
    
    // Filter button handler
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            console.log('Filter button clicked');
            alert('Advanced filters would open here');
        });
    }
    
    // Initialize count
    updateDocCount();
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'documents.html';
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