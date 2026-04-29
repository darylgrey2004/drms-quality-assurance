// js/approvals.js - Admin Approvals Page

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (user.role || '').toLowerCase();
    const API_BASE = 'http://localhost:3000';

    // Access guard
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }
    if (role !== 'admin' && role !== 'dean') {
        window.location.href = 'user-approvals.html';
        return;
    }

    // DOM elements
    const approvalsList = document.getElementById('approvalsList');
    const mobileApprovalsList = document.getElementById('mobileApprovalsList');
    const searchInput = document.getElementById('searchApprovals');
    const workflowStage = document.getElementById('workflowStage');
    const approvalStatus = document.getElementById('approvalStatus');
    const refreshBtn = document.getElementById('refreshApprovals');
    const tabLinks = document.querySelectorAll('#workflowTabs a');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');
    
    // Preview modal elements
    const docPreviewModal = document.getElementById('docPreviewModal');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    const docPreviewFrame = document.getElementById('docPreviewFrame');
    const docPreviewTitle = document.getElementById('docPreviewTitle');
    
    // Lock modal elements
    const lockModal = document.getElementById('lockModal');
    const lockModalCloseBtn = document.getElementById('lockModalCloseBtn');
    const lockModalCancelBtn = document.getElementById('lockModalCancelBtn');
    const lockModalConfirmBtn = document.getElementById('lockModalConfirmBtn');
    const lockDocTitle = document.getElementById('lockDocTitle');
    const lockComment = document.getElementById('lockComment');
    
    let currentLockDocId = null;

    let allDocuments = [];
    let filteredDocuments = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentTab = 'all';

    // Load stats and documents
    loadStats();
    loadDocuments();

    // Load statistics
    function loadStats() {
        fetch(`${API_BASE}/api/approvals/stats`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(stats => {
            document.getElementById('statPendingReview').textContent = (stats.pending || 0) + (stats.validated || 0);
            document.getElementById('statAwaitingValidation').textContent = stats.pending || 0;
            document.getElementById('statPendingApproval').textContent = stats.validated || 0;
            document.getElementById('statApprovedMonth').textContent = stats.approved_month || 0;
        })
        .catch(() => {});
    }

    // Load documents
    function loadDocuments() {
        console.log('Loading documents from API...');
        fetch(`${API_BASE}/api/approvals/pending`, {
            headers: { 'x-auth-token': token }
        })
        .then(r => {
            console.log('API Response status:', r.status);
            return r.json();
        })
        .then(docs => {
            console.log('Documents received:', docs);
            allDocuments = docs;
            applyFilters();
        })
        .catch(err => {
            console.error('Error loading documents:', err);
        });
    }

    // Get workflow stage for filtering
    function getWorkflowStage(status) {
        const statusMap = {
            'draft': 'draft',
            'pending': 'validate',
            'validated': 'approve',
            'approved': 'lock',
            'locked': 'locked',
            'rejected': 'rejected'
        };
        return statusMap[status] || 'unknown';
    }

    // Apply filters
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const stage = workflowStage.value;
        const status = approvalStatus.value;

        filteredDocuments = allDocuments.filter(doc => {
            const matchesSearch = !searchTerm || 
                doc.title.toLowerCase().includes(searchTerm) ||
                (doc.author_name || '').toLowerCase().includes(searchTerm) ||
                (doc.department_name || '').toLowerCase().includes(searchTerm) ||
                (doc.department_code || '').toLowerCase().includes(searchTerm);

            const docStage = getWorkflowStage(doc.workflow_status);
            const matchesStage = stage === 'all' || 
                (stage === 'upload' && doc.workflow_status === 'draft') ||
                (stage === 'validate' && doc.workflow_status === 'pending') ||
                (stage === 'approve' && doc.workflow_status === 'validated') ||
                (stage === 'lock' && doc.workflow_status === 'approved');

            const matchesStatus = status === 'all' ||
                (status === 'pending' && doc.workflow_status === 'pending') ||
                (status === 'review' && doc.workflow_status === 'validated') ||
                (status === 'approved' && doc.workflow_status === 'approved') ||
                (status === 'locked' && doc.workflow_status === 'locked') ||
                (status === 'rejected' && doc.workflow_status === 'rejected');

            const matchesTab = currentTab === 'all' ||
                (currentTab === 'pending' && (doc.workflow_status === 'pending' || doc.workflow_status === 'validated')) ||
                (currentTab === 'validating' && doc.workflow_status === 'pending') ||
                (currentTab === 'approving' && doc.workflow_status === 'validated') ||
                (currentTab === 'recent' && (doc.workflow_status === 'approved' || doc.workflow_status === 'locked'));

            return matchesSearch && matchesStage && matchesStatus && matchesTab;
        });

        currentPage = 1;
        renderDocuments();
        renderPagination();
    }

    // Get status badge class
    function getStatusBadge(status) {
        const badges = {
            'draft': 'bg-gray-100 text-gray-700',
            'pending': 'bg-amber-100 text-amber-700',
            'validated': 'bg-blue-100 text-blue-700',
            'approved': 'bg-green-100 text-green-700',
            'locked': 'bg-purple-100 text-purple-700',
            'rejected': 'bg-red-100 text-red-700'
        };
        return badges[status] || 'bg-gray-100 text-gray-700';
    }

    // Get status text
    function getStatusText(status) {
        const texts = {
            'draft': 'Draft',
            'pending': 'Validation',
            'validated': 'Approval',
            'approved': 'Approved',
            'locked': 'Locked',
            'rejected': 'Rejected'
        };
        return texts[status] || status;
    }

    // Open preview modal
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

    // Close preview modal
    function closePreviewModal() {
        if (!docPreviewModal || !docPreviewFrame) return;
        docPreviewModal.classList.add('hidden');
        docPreviewModal.classList.remove('flex');
        docPreviewFrame.src = 'about:blank';
    }

    // Preview modal event listeners
    if (docPreviewCloseBtn) docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    if (docPreviewModal) {
        docPreviewModal.addEventListener('click', (e) => {
            if (e.target === docPreviewModal) closePreviewModal();
        });
    }
    
    // Lock modal functions
    function openLockModal(docId, title) {
        currentLockDocId = docId;
        if (lockDocTitle) lockDocTitle.textContent = title;
        if (lockComment) lockComment.value = '';
        if (lockModal) {
            lockModal.classList.remove('hidden');
            lockModal.classList.add('flex');
        }
    }
    
    function closeLockModal() {
        currentLockDocId = null;
        if (lockModal) {
            lockModal.classList.add('hidden');
            lockModal.classList.remove('flex');
        }
    }
    
    // Lock modal event listeners
    if (lockModalCloseBtn) lockModalCloseBtn.addEventListener('click', closeLockModal);
    if (lockModalCancelBtn) lockModalCancelBtn.addEventListener('click', closeLockModal);
    if (lockModalConfirmBtn) {
        lockModalConfirmBtn.addEventListener('click', () => {
            if (currentLockDocId) {
                const comments = lockComment ? lockComment.value : '';
                confirmLockDocument(currentLockDocId, comments);
                closeLockModal();
            }
        });
    }
    if (lockModal) {
        lockModal.addEventListener('click', (e) => {
            if (e.target === lockModal) closeLockModal();
        });
    }

    // Get action buttons based on workflow status
    function getActionButtons(doc) {
        const status = doc.workflow_status;
        const isAdmin = role === 'admin';
        const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : '#';
        
        let buttons = `<button class="btn-view text-xs text-teal-600 hover:underline font-medium px-1" data-id="${doc.id}" data-url="${fileUrl}" data-title="${doc.title}">View</button>`;

        // Show buttons based on current workflow status
        if (status === 'draft' || status === 'pending') {
            // Pending documents: Show Validate and Reject
            buttons += ` <button class="btn-validate text-xs text-green-600 hover:underline font-medium px-1" data-id="${doc.id}">Validate</button>`;
            buttons += ` <button class="btn-reject text-xs text-red-600 hover:underline font-medium px-1" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'validated') {
            // Validated documents: Show Approve and Reject
            buttons += ` <button class="btn-approve text-xs text-blue-600 hover:underline font-medium px-1" data-id="${doc.id}">Approve</button>`;
            buttons += ` <button class="btn-reject text-xs text-red-600 hover:underline font-medium px-1" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'approved') {
            // Approved documents: Show Lock
            buttons += ` <button class="btn-lock text-xs text-purple-600 hover:underline font-medium px-1" data-id="${doc.id}" data-title="${doc.title}">Lock</button>`;
        } else if (status === 'locked' && isAdmin) {
            // Locked documents: Show Unlock (admin only)
            buttons += ` <button class="btn-unlock text-xs text-orange-600 hover:underline font-medium px-1" data-id="${doc.id}">Unlock</button>`;
        }

        return buttons;
    }

    // Get mobile action buttons
    function getMobileActionButtons(doc) {
        const status = doc.workflow_status;
        const isAdmin = role === 'admin';
        const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : '#';
        
        let buttons = `<button class="btn-view text-xs px-2 py-1 bg-teal-600 text-white rounded" data-id="${doc.id}" data-url="${fileUrl}" data-title="${doc.title}">View</button>`;

        // Show buttons based on current workflow status
        if (status === 'draft' || status === 'pending') {
            buttons += ` <button class="btn-validate text-xs px-2 py-1 bg-green-600 text-white rounded" data-id="${doc.id}">Validate</button>`;
            buttons += ` <button class="btn-reject text-xs px-2 py-1 bg-red-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'validated') {
            buttons += ` <button class="btn-approve text-xs px-2 py-1 bg-blue-600 text-white rounded" data-id="${doc.id}">Approve</button>`;
            buttons += ` <button class="btn-reject text-xs px-2 py-1 bg-red-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Reject</button>`;
        } else if (status === 'approved') {
            buttons += ` <button class="btn-lock text-xs px-2 py-1 bg-purple-600 text-white rounded" data-id="${doc.id}" data-title="${doc.title}">Lock</button>`;
        } else if (status === 'locked' && isAdmin) {
            buttons += ` <button class="btn-unlock text-xs px-2 py-1 bg-orange-600 text-white rounded" data-id="${doc.id}">Unlock</button>`;
        }

        return buttons;
    }

    // Render documents
    function renderDocuments() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageDocuments = filteredDocuments.slice(start, end);

        console.log('Rendering documents:', pageDocuments.length, 'of', filteredDocuments.length);

        if (pageDocuments.length === 0) {
            approvalsList.innerHTML = '<div class="col-span-12 py-8 text-center text-gray-500">No documents found</div>';
            mobileApprovalsList.innerHTML = '<div class="p-4 text-center text-gray-500">No documents found</div>';
            return;
        }

        // Desktop view
        approvalsList.innerHTML = pageDocuments.map(doc => {
            const statusBadge = getStatusBadge(doc.workflow_status);
            const statusText = getStatusText(doc.workflow_status);
            const deptCode = doc.department_code || 'N/A';

            return `
                <div class="grid grid-cols-12 py-3 text-sm items-center approval-item" data-id="${doc.id}" data-stage="${getWorkflowStage(doc.workflow_status)}" data-status="${doc.workflow_status}">
                    <div class="col-span-1"><input type="checkbox" class="doc-checkbox rounded border-gray-300 text-teal-600"></div>
                    <div class="col-span-3">
                        <div class="font-medium text-gray-800">${doc.title}</div>
                        <div class="text-xs text-gray-400">by ${doc.author_name || 'Unknown'} · ${new Date(doc.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="col-span-2"><span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">${(doc.category_name || doc.category || 'N/A').toUpperCase()}</span></div>
                    <div class="col-span-1"><span class="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">${deptCode}</span></div>
                    <div class="col-span-2"><span class="${statusBadge} text-xs px-2 py-1 rounded-full font-medium">${statusText}</span></div>
                    <div class="col-span-1 text-gray-600">${doc.version || 'v1.0'}</div>
                    <div class="col-span-2">
                        <div class="flex flex-wrap gap-2">
                            ${getActionButtons(doc)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Mobile view
        mobileApprovalsList.innerHTML = pageDocuments.map(doc => {
            const statusBadge = getStatusBadge(doc.workflow_status);
            const statusText = getStatusText(doc.workflow_status);
            const deptCode = doc.department_code || 'N/A';

            return `
                <div class="border rounded-lg p-4 bg-white" data-id="${doc.id}">
                    <div class="flex items-start gap-2 mb-2">
                        <input type="checkbox" class="doc-checkbox mt-1 rounded border-gray-300 text-teal-600">
                        <div class="flex-1">
                            <div class="font-medium text-gray-800">${doc.title}</div>
                            <div class="text-xs text-gray-400">by ${doc.author_name || 'Unknown'} · ${new Date(doc.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-2">
                        <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">${(doc.category_name || doc.category || 'N/A').toUpperCase()}</span>
                        <span class="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">${deptCode}</span>
                        <span class="${statusBadge} text-xs px-2 py-1 rounded-full font-medium">${statusText}</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-3">${doc.version || 'v1.0'}</div>
                    <div class="flex flex-wrap gap-2">
                        ${getMobileActionButtons(doc)}
                    </div>
                </div>
            `;
        }).join('');

        attachActionHandlers();
    }

    // Render pagination
    function renderPagination() {
        const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, filteredDocuments.length);

        paginationInfo.textContent = `Showing ${start} to ${end} of ${filteredDocuments.length}`;

        let buttons = '<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm" data-page="prev">Previous</button>';
        for (let i = 1; i <= totalPages; i++) {
            const active = i === currentPage ? 'bg-teal-600 text-white' : 'bg-white border text-gray-600';
            buttons += `<button class="px-3 py-1 ${active} rounded-lg text-sm" data-page="${i}">${i}</button>`;
        }
        buttons += '<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm" data-page="next">Next</button>';

        paginationButtons.innerHTML = buttons;

        paginationButtons.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                if (page === 'prev' && currentPage > 1) currentPage--;
                else if (page === 'next' && currentPage < totalPages) currentPage++;
                else if (!isNaN(page)) currentPage = parseInt(page);
                renderDocuments();
                renderPagination();
            });
        });
    }

    // Update document status in UI
    function updateDocumentStatus(docId, newStatus) {
        const doc = allDocuments.find(d => d.id === docId);
        if (doc) {
            doc.workflow_status = newStatus;
            applyFilters();
        }
    }

    // Attach action handlers
    function attachActionHandlers() {
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = btn.getAttribute('data-url');
                const title = btn.getAttribute('data-title');
                openPreviewModal(url, title);
            });
        });

        document.querySelectorAll('.btn-validate').forEach(btn => {
            btn.addEventListener('click', () => handleValidate(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => handleApprove(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.btn-lock').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-id');
                const title = btn.getAttribute('data-title');
                openLockModal(docId, title);
            });
        });

        document.querySelectorAll('.btn-unlock').forEach(btn => {
            btn.addEventListener('click', () => handleUnlock(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => handleReject(btn.getAttribute('data-id'), btn.getAttribute('data-title')));
        });
    }

    // Handle validate
    function handleValidate(docId) {
        if (!confirm('Validate this document? It will move to the approval stage.')) return;

        console.log('Validating document:', docId);

        fetch(`${API_BASE}/api/approvals/${docId}/validate`, {
            method: 'POST',
            headers: { 
                'x-auth-token': token,
                'Content-Type': 'application/json'
            }
        })
        .then(r => {
            console.log('Validate response status:', r.status);
            return r.json();
        })
        .then(data => {
            console.log('Validate response:', data);
            if (data.msg) {
                alert(data.msg);
            }
            if (data.document && data.document.workflow_status) {
                updateDocumentStatus(parseInt(docId), data.document.workflow_status);
            } else {
                updateDocumentStatus(parseInt(docId), 'validated');
            }
            loadStats();
        })
        .catch(err => {
            console.error('Validate error:', err);
            alert('Failed to validate document: ' + err.message);
        });
    }

    // Handle approve
    function handleApprove(docId) {
        if (!confirm('Approve this document? It will be ready to lock.')) return;

        console.log('Approving document:', docId);

        fetch(`${API_BASE}/api/approvals/${docId}/approve`, {
            method: 'POST',
            headers: { 
                'x-auth-token': token,
                'Content-Type': 'application/json'
            }
        })
        .then(r => {
            console.log('Approve response status:', r.status);
            return r.json();
        })
        .then(data => {
            console.log('Approve response:', data);
            if (data.msg) {
                alert(data.msg);
            }
            if (data.document && data.document.workflow_status) {
                updateDocumentStatus(parseInt(docId), data.document.workflow_status);
            } else {
                updateDocumentStatus(parseInt(docId), 'approved');
            }
            loadStats();
        })
        .catch(err => {
            console.error('Approve error:', err);
            alert('Failed to approve document: ' + err.message);
        });
    }

    // Handle lock (called from modal)
    function confirmLockDocument(docId, comments) {
        fetch(`${API_BASE}/api/approvals/${docId}/lock`, {
            method: 'POST',
            headers: { 
                'x-auth-token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comments })
        })
        .then(r => r.json())
        .then(() => {
            updateDocumentStatus(parseInt(docId), 'locked');
            loadStats();
        })
        .catch(() => alert('Failed to lock document'));
    }

    // Handle lock - removed, now using modal
    // function handleLock(docId) { ... }

    // Handle unlock
    function handleUnlock(docId) {
        if (!confirm('Unlock this document? It will return to approved status.')) return;

        fetch(`${API_BASE}/api/approvals/${docId}/unlock`, {
            method: 'POST',
            headers: { 'x-auth-token': token }
        })
        .then(r => r.json())
        .then(() => {
            updateDocumentStatus(parseInt(docId), 'approved');
            loadStats();
        })
        .catch(() => alert('Failed to unlock document'));
    }

    // Handle reject
    function handleReject(docId, title) {
        const reason = prompt(`Reject "${title}"?\n\nProvide reason:`);
        if (!reason) return;

        fetch(`${API_BASE}/api/approvals/${docId}/reject`, {
            method: 'POST',
            headers: { 
                'x-auth-token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        })
        .then(r => r.json())
        .then(() => {
            updateDocumentStatus(parseInt(docId), 'rejected');
            loadStats();
        })
        .catch(() => alert('Failed to reject document'));
    }

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (workflowStage) workflowStage.addEventListener('change', applyFilters);
    if (approvalStatus) approvalStatus.addEventListener('change', applyFilters);
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        loadStats();
        loadDocuments();
    });

    // Tab switching
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            currentTab = this.getAttribute('data-tab');

            tabLinks.forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });

            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');

            applyFilters();
        });
    });
});
