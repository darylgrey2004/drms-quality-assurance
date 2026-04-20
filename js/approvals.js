// js/approvals.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Approvals page JS loaded successfully');
    
    // DOM elements
    const searchInput = document.getElementById('searchApprovals');
    const workflowStage = document.getElementById('workflowStage');
    const approvalStatus = document.getElementById('approvalStatus');
    const refreshBtn = document.getElementById('refreshApprovals');
    const tabLinks = document.querySelectorAll('#workflowTabs a');
    const approvalItems = document.querySelectorAll('.approval-item');
    const selectAllCheckbox = document.getElementById('selectAll');
    const bulkAction = document.getElementById('bulkAction');
    const applyBulk = document.getElementById('applyBulk');
    
    // Action buttons
    const viewBtns = document.querySelectorAll('.view-approval');
    const validateBtns = document.querySelectorAll('.validate-btn');
    const approveBtns = document.querySelectorAll('.approve-btn');
    const rejectBtns = document.querySelectorAll('.reject-btn');
    
    // Stats counters
    const pendingCount = document.getElementById('pendingCount');
    const validationCount = document.getElementById('validationCount');
    const approvalCount = document.getElementById('approvalCount');
    
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
            
            // Filter items based on tab
            filterByTab(tabId);
        });
    });
    
    // Filter by tab function
    function filterByTab(tabId) {
        approvalItems.forEach(item => {
            const stage = item.getAttribute('data-stage') || '';
            const status = item.getAttribute('data-status') || '';
            
            let show = false;
            
            switch(tabId) {
                case 'all':
                    show = true;
                    break;
                case 'pending':
                    show = (stage === 'validate' || stage === 'approve') && status === 'pending';
                    break;
                case 'validating':
                    show = stage === 'validate' && status === 'pending';
                    break;
                case 'approving':
                    show = stage === 'approve' && status === 'review';
                    break;
                case 'recent':
                    show = status === 'approved' || stage === 'lock';
                    break;
            }
            
            if (show) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Update counts after filtering
        updateVisibleCount();
    }
    
    // Update visible count
    function updateVisibleCount() {
        const visibleItems = document.querySelectorAll('.approval-item:not(.hidden)');
        console.log(`Showing ${visibleItems.length} items`);
    }
    
    // Filter function for search and dropdowns
    function filterApprovals() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const stage = workflowStage ? workflowStage.value : 'all';
        const status = approvalStatus ? approvalStatus.value : 'all';
        
        approvalItems.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            const itemStage = item.getAttribute('data-stage') || '';
            const itemStatus = item.getAttribute('data-status') || '';
            
            // Search match
            const matchesSearch = searchTerm === '' || itemText.includes(searchTerm);
            
            // Stage match
            let matchesStage = stage === 'all';
            if (!matchesStage) {
                matchesStage = itemStage === stage;
            }
            
            // Status match
            let matchesStatus = status === 'all';
            if (!matchesStatus) {
                matchesStatus = itemStatus === status;
            }
            
            // Show/hide based on all filters
            if (matchesSearch && matchesStage && matchesStatus) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
        
        updateVisibleCount();
    }
    
    // Add event listeners for filters
    if (searchInput) searchInput.addEventListener('input', filterApprovals);
    if (workflowStage) workflowStage.addEventListener('change', filterApprovals);
    if (approvalStatus) approvalStatus.addEventListener('change', filterApprovals);
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Clear filters
            if (searchInput) searchInput.value = '';
            if (workflowStage) workflowStage.value = 'all';
            if (approvalStatus) approvalStatus.value = 'all';
            
            // Reset to All tab
            tabLinks.forEach(link => {
                if (link.getAttribute('data-tab') === 'all') {
                    link.click();
                }
            });
            
            // Show all items
            approvalItems.forEach(item => {
                item.classList.remove('hidden');
            });
            
            // Visual feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="mr-2">✓</span> Refreshed';
            setTimeout(() => {
                this.innerHTML = '<span class="mr-2">🔄</span> Refresh';
            }, 1000);
            
            updateVisibleCount();
        });
    }
    
    // View button handlers
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docId = this.getAttribute('data-id') || 'document';
            const approvalItem = this.closest('.approval-item');
            const docTitle = approvalItem?.querySelector('.font-medium')?.textContent || docId;
            
            console.log(`Viewing approval item: ${docTitle}`);
            alert(`Viewing: ${docTitle}\n(This would open the document review panel in the full system)`);
        });
    });
    
    // Validate button handlers
    validateBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docId = this.getAttribute('data-id') || 'document';
            const approvalItem = this.closest('.approval-item');
            const docTitle = approvalItem?.querySelector('.font-medium')?.textContent || docId;
            
            if (confirm(`Validate document: ${docTitle}?`)) {
                alert(`Document validated successfully!\nIt will now move to Approval stage.`);
                
                // Update UI (demo)
                const stageSpan = approvalItem?.querySelector('.col-span-2 span:first-child');
                const statusSpan = approvalItem?.querySelector('.col-span-1 span');
                
                if (stageSpan) {
                    stageSpan.className = 'bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full';
                    stageSpan.textContent = 'Approval';
                }
                if (statusSpan) {
                    statusSpan.className = 'badge-pending px-2 py-1 rounded-full text-xs';
                    statusSpan.textContent = 'Under Review';
                }
                
                // Update data attributes
                if (approvalItem) {
                    approvalItem.setAttribute('data-stage', 'approve');
                    approvalItem.setAttribute('data-status', 'review');
                }
            }
        });
    });
    
    // Approve button handlers
    approveBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docId = this.getAttribute('data-id') || 'document';
            const approvalItem = this.closest('.approval-item');
            const docTitle = approvalItem?.querySelector('.font-medium')?.textContent || docId;
            
            if (confirm(`Approve document: ${docTitle}?`)) {
                alert(`Document approved successfully!\nIt will now be locked.`);
                
                // Update UI (demo)
                const stageSpan = approvalItem?.querySelector('.col-span-2 span:first-child');
                const statusSpan = approvalItem?.querySelector('.col-span-1 span');
                const actionButtons = approvalItem?.querySelectorAll('.col-span-2 button');
                
                if (stageSpan) {
                    stageSpan.className = 'bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full';
                    stageSpan.textContent = 'Locked';
                }
                if (statusSpan) {
                    statusSpan.className = 'badge-approved px-2 py-1 rounded-full text-xs';
                    statusSpan.textContent = 'Approved';
                }
                
                // Disable action buttons except view
                if (actionButtons) {
                    actionButtons.forEach(btn => {
                        if (!btn.classList.contains('view-approval')) {
                            btn.disabled = true;
                            btn.classList.add('text-gray-400');
                        }
                    });
                }
                
                // Update data attributes
                if (approvalItem) {
                    approvalItem.setAttribute('data-stage', 'lock');
                    approvalItem.setAttribute('data-status', 'approved');
                }
            }
        });
    });
    
    // Reject button handlers
    rejectBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const docId = this.getAttribute('data-id') || 'document';
            const approvalItem = this.closest('.approval-item');
            const docTitle = approvalItem?.querySelector('.font-medium')?.textContent || docId;
            
            const reason = prompt(`Please provide reason for rejecting: ${docTitle}`);
            if (reason !== null) {
                alert(`Document rejected.\nReason: ${reason}\n\nIt will be returned to the uploader.`);
                
                // Remove item (demo)
                if (approvalItem) {
                    approvalItem.remove();
                }
            }
        });
    });
    
    // Select all functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const visibleItems = document.querySelectorAll('.approval-item:not(.hidden)');
            visibleItems.forEach(item => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'item-checkbox hidden';
                // In a real system, you'd add checkboxes to each row
            });
        });
    }
    
    // Bulk actions
    if (applyBulk) {
        applyBulk.addEventListener('click', function() {
            const action = bulkAction ? bulkAction.value : '';
            
            if (!action) {
                alert('Please select an action');
                return;
            }
            
            const selectedItems = document.querySelectorAll('.approval-item:not(.hidden)'); // In real system, only checked ones
            if (selectedItems.length === 0) {
                alert('No items selected');
                return;
            }
            
            alert(`Bulk action: ${action} applied to ${selectedItems.length} items`);
        });
    }
    
    // Pagination buttons (demo)
    const paginationButtons = document.querySelectorAll('.flex.gap-1 button');
    paginationButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === 'Previous' || this.textContent === 'Next') {
                alert(`${this.textContent} page would load in the full system`);
            } else {
                // Page number click
                paginationButtons.forEach(b => b.classList.remove('bg-teal-700', 'text-white'));
                this.classList.add('bg-teal-700', 'text-white');
            }
        });
    });
    
    // Optional: Add active state tracking for sidebar navigation
    const currentPath = window.location.pathname.split('/').pop() || 'approvals.html';
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
    
    // Initialize with All tab
    filterByTab('all');
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