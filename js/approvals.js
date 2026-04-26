document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || '').toString().toLowerCase().trim();
    const API_BASE = 'http://localhost:3000';
    if (!token) { window.location.href = 'landing.html'; return; }
    if (role !== 'admin' && role !== 'dean') { window.location.href = 'user-approvals.html'; return; }

    const approvalsList = document.getElementById('approvalsList');

    // ── Heartbeat: Update session activity ──
    if (token && sessionManager) {
        sessionManager.initializeHeartbeat(2 * 60 * 1000);
    }

    // Access guard: approvals action view is for Dean/Admin on this page.
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }
    if (role !== 'admin' && role !== 'dean') {
        window.location.href = 'user-approvals.html';
        return;
    }
    
    // DOM elements
    const searchInput = document.getElementById('searchApprovals');
    const workflowStage = document.getElementById('workflowStage');
    const approvalStatus = document.getElementById('approvalStatus');
    const refreshBtn = document.getElementById('refreshApprovals');
    let queue = [];

    function statusText(status) {
        const map = {
            validated_coordinator: 'Awaiting Final Approval',
            approved: 'Approved',
            locked: 'Locked'
        };
        return map[status] || status;
    }

    function stageText(status) {
        if (status === 'validated_coordinator') return 'Approval';
        if (status === 'approved') return 'Lock';
        return 'Locked';
    }

    function closePreviewModal() {
        if (!docPreviewModal || !docPreviewFrame) return;
        docPreviewModal.classList.add('hidden');
        docPreviewModal.classList.remove('flex');
        docPreviewFrame.src = 'about:blank';
    }

    if (docPreviewCloseBtn) docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    if (docPreviewBackdrop) docPreviewBackdrop.addEventListener('click', closePreviewModal);
    
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
    
    // Action handling is delegated near the bottom so dynamic rows also work.
    
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

    // Pull latest approval items from backend and prepend them.
    if (token && approvalsList) {
        fetch(`${API_BASE}/api/documents/approvals`, {
            headers: { 'x-auth-token': token }
        })
            .then((r) => r.json())
            .then((docs) => {
                if (!Array.isArray(docs) || docs.length === 0) return;

                docs.slice(0, 10).reverse().forEach((d) => {
                    const item = document.createElement('div');
                    item.className = 'grid grid-cols-12 py-3 text-sm items-center approval-item';
                    const stage = d.workflow_status === 'validated' ? 'approve' : 'validate';
                    const status = d.workflow_status === 'validated' ? 'review' : 'pending';
                    item.setAttribute('data-stage', stage);
                    item.setAttribute('data-status', status);

                    const stageChipClass = stage === 'approve'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700';
                    const stageText = stage === 'approve' ? 'Approval' : 'Validation';

                    const statusChipClass = status === 'review'
                        ? 'badge-pending'
                        : 'badge-pending';
                    const statusText = status === 'review' ? 'Under Review' : 'Pending';

                    const fileHref = d.file_url ? `${API_BASE}${d.file_url}` : '#';
                    item.innerHTML = `
                        <div class="col-span-4">
                            <div class="font-medium text-gray-800">${d.title || 'Untitled'}</div>
                            <div class="text-xs text-gray-400">by ${d.author_name || 'Uploader'}</div>
                        </div>
                        <div class="col-span-2 text-gray-600">${(d.category || '').toUpperCase()}</div>
                        <div class="col-span-2">
                            <span class="${stageChipClass} text-xs px-2 py-1 rounded-full">${stageText}</span>
                        </div>
                        <div class="col-span-1">
                            <span class="${statusChipClass} px-2 py-1 rounded-full text-xs">${statusText}</span>
                        </div>
                        <div class="col-span-1 text-gray-600">${d.version || 'v1.0'}</div>
                        <div class="col-span-2 text-xs space-x-2">
                            <a class="action-link view-approval" data-id="${d.id}" href="${fileHref}" target="_blank" rel="noreferrer">👁 View</a>
                            <button class="action-link validate-btn" data-id="${d.id}">✓ Validate</button>
                            <button class="action-link-danger reject-btn" data-id="${d.id}">✕</button>
                        </div>
                    `;
                    approvalsList.prepend(item);
                });
            })
            .catch(() => {});
    }

    // Delegate click handlers so dynamically added rows work too.
    if (approvalsList) {
        approvalsList.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-approval');
            const validateBtn = e.target.closest('.validate-btn');
            const rejectBtn = e.target.closest('.reject-btn');
            if (!viewBtn && !validateBtn && !rejectBtn) return;

            const approvalItem = e.target.closest('.approval-item');
            const docTitle = approvalItem?.querySelector('.font-medium')?.textContent || 'document';

            if (viewBtn) {
                const href = viewBtn.getAttribute('href') || '';
                const ext = getFileExtFromUrl(href);
                if (ext && !previewableExt.includes(ext)) {
                    e.preventDefault();
                    const proceed = confirm('Preview is not supported for this file type.\n\nPress OK to download, or Cancel to stay on this page.');
                    if (proceed) window.open(href, '_blank');
                    return;
                }
                e.preventDefault();
                openPreviewModal(href, docTitle);
                return;
            }

            e.preventDefault();
            if (validateBtn) {
                // Update status on the same page
                const stageSpan = approvalItem?.querySelector('.col-span-2 span:first-of-type');
                const statusSpan = approvalItem?.querySelector('.col-span-1 span');
                const docId = validateBtn.getAttribute('data-id') || '';
                
                // Update visual display
                if (stageSpan) {
                    stageSpan.className = 'bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full';
                    stageSpan.textContent = 'Approval';
                }
                if (statusSpan) {
                    statusSpan.className = 'badge-pending px-2 py-1 rounded-full text-xs';
                    statusSpan.textContent = 'Under Review';
                }
                if (approvalItem) {
                    approvalItem.setAttribute('data-stage', 'approve');
                    approvalItem.setAttribute('data-status', 'review');
                }
                
                // Send validation status to backend
                if (token && docId) {
                    fetch(`${API_BASE}/api/documents/${docId}/validate`, {
                        method: 'PUT',
                        headers: {
                            'x-auth-token': token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ workflow_status: 'validated' })
                    })
                    .then(r => r.json())
                    .then(data => {
                        console.log('Document validated successfully:', data);
                    })
                    .catch(err => console.error('Validation error:', err));
                }
                
                return;
            }

            if (rejectBtn) {
                const reason = prompt(`Please provide reason for rejecting: ${docTitle}`);
                if (reason !== null && approvalItem) approvalItem.remove();
            }
        });
    }
});