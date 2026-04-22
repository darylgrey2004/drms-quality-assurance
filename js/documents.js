// js/documents.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Documents page JS loaded successfully');

    const token = localStorage.getItem('token');
    const API_BASE = 'http://localhost:3000';
    const documentsList = document.getElementById('documentsList');
    
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const docRows = document.querySelectorAll('.doc-row');
    const docCount = document.getElementById('docCount');
    const uploadBtn = document.getElementById('uploadBtn');
    const filterBtn = document.getElementById('filterBtn');
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewBackdrop = document.getElementById('docPreviewBackdrop');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    const docPreviewFrame = document.getElementById('docPreviewFrame');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    
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
    
    const previewableExt = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt'];
    function getFileExtFromUrl(url) {
        try {
            const clean = String(url || '').split('?')[0].split('#')[0];
            return clean.includes('.') ? clean.split('.').pop().toLowerCase() : '';
        } catch (_e) {
            return '';
        }
    }

    function openPreviewModal(url, title) {
        if (!docPreviewModal || !docPreviewFrame) {
            window.open(url, '_blank');
            return;
        }
        if (docPreviewTitle) docPreviewTitle.textContent = title || 'Document Preview';
        docPreviewFrame.src = url;
        docPreviewModal.classList.remove('hidden');
        docPreviewModal.classList.add('flex');
    }

    function closePreviewModal() {
        if (!docPreviewModal || !docPreviewFrame) return;
        docPreviewModal.classList.add('hidden');
        docPreviewModal.classList.remove('flex');
        docPreviewFrame.src = 'about:blank';
    }

    if (docPreviewCloseBtn) docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    if (docPreviewBackdrop) docPreviewBackdrop.addEventListener('click', closePreviewModal);

    viewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Dynamic rows use <a href="http://localhost:3000/uploads/...">
            if (this.tagName.toLowerCase() === 'a') {
                const href = this.getAttribute('href') || '';
                const ext = getFileExtFromUrl(href);
                const docRow = this.closest('.doc-row');
                const docTitle = docRow?.querySelector('.font-medium')?.textContent || 'Document Preview';
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

            // Static fallback rows use buttons
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

    // Pull latest documents from backend and prepend them.
    if (token && documentsList) {
        fetch(`${API_BASE}/api/documents?scope=all`, {
            headers: { 'x-auth-token': token }
        })
            .then((r) => r.json())
            .then((docs) => {
                if (!Array.isArray(docs) || docs.length === 0) return;
                // Keep existing static rows as fallback; just add newest dynamic rows on top.
                docs.slice(0, 10).reverse().forEach((d) => {
                    const row = document.createElement('div');
                    row.className = `grid grid-cols-12 py-3 text-sm items-center doc-row`;
                    row.setAttribute('data-category', d.category || '');
                    row.setAttribute('data-status', d.workflow_status || '');

                    const statusText =
                        d.workflow_status === 'approved' ? 'Approved' :
                        d.workflow_status === 'validated' ? 'Validated' :
                        d.workflow_status === 'draft' ? 'Draft' :
                        d.workflow_status === 'rejected' ? 'Rejected' :
                        'Pending Review';
                    const statusClass =
                        d.workflow_status === 'approved' ? 'badge-approved' :
                        d.workflow_status === 'draft' ? 'badge-draft' :
                        d.workflow_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'badge-pending';

                    const created = d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : '';
                    const authorLine = `by ${d.author_name || 'Uploader'}${created ? ` · ${created}` : ''}`;

                    const fileHref = d.file_url ? `${API_BASE}${d.file_url}` : '#';
                    row.innerHTML = `
                        <div class="col-span-4">
                            <div class="font-medium text-gray-800">${d.title || 'Untitled'}</div>
                            <div class="text-xs text-gray-400">${authorLine}</div>
                        </div>
                        <div class="col-span-2 text-gray-600">${(d.category || '').toUpperCase()}</div>
                        <div class="col-span-2 text-gray-600">${d.area || '-'}</div>
                        <div class="col-span-1"><span class="${statusClass} px-2 py-1 rounded-full text-xs">${statusText}</span></div>
                        <div class="col-span-1 text-gray-600">${d.version || 'v1.0'}</div>
                        <div class="col-span-2 text-teal-600 text-xs space-x-2">
                            <a class="hover:underline view-btn" href="${fileHref}" target="_blank" rel="noreferrer">👁️</a>
                            <button class="hover:underline attach-btn">📎</button>
                            <button class="hover:underline edit-btn">✏️</button>
                        </div>
                    `;
                    documentsList.prepend(row);
                });

                // Refresh cached row node list by reloading page filters on next tick
                setTimeout(updateDocCount, 0);
            })
            .catch(() => {});
    }
    
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