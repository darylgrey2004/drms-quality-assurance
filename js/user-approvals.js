// js/user-approvals.js

document.addEventListener('DOMContentLoaded', async function() {
    const session = await initializeUserPage();
    if (!session) return;

    const { token, user, role } = session;
    const API_BASE = 'http://localhost:3000';
    const normalizedRole = (role || '').toLowerCase();

    // Only area-chair, dean, and admin can access
    if (normalizedRole !== 'area-chair' && normalizedRole !== 'department-head' && normalizedRole !== 'dean' && normalizedRole !== 'admin') {
        window.location.href = 'user-dashboard.html';
        return; 
    }

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const searchInput       = document.getElementById('searchApprovals');
    const workflowStage     = document.getElementById('workflowStage');
    const approvalStatus    = document.getElementById('approvalStatus');
    const refreshBtn        = document.getElementById('refreshApprovals');
    const tabLinks          = document.querySelectorAll('#workflowTabs a');
    const desktopContainer  = document.getElementById('approvalsList');
    const mobileContainer   = document.getElementById('mobileApprovalsList');
    const paginationInfo    = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');

    // Preview modal
    const docPreviewModal    = document.getElementById('docPreviewModal');
    const docPreviewCloseBtn = document.getElementById('docPreviewCloseBtn');
    const docPreviewFrame    = document.getElementById('docPreviewFrame');
    const docPreviewTitle    = document.getElementById('docPreviewTitle');

    // Rejection modal
    const rejectionModal    = document.getElementById('rejectionModal');
    const closeRejectionBtn = document.getElementById('closeRejectionModal');
    const cancelRejection   = document.getElementById('cancelRejection');
    const submitRejection   = document.getElementById('submitRejection');
    const rejectionComment  = document.getElementById('rejectionComment');
    const modalDocTitle     = document.getElementById('modalDocTitle');
    const modalDocDate      = document.getElementById('modalDocDate');
    const modalDocCategory  = document.getElementById('modalDocCategory');
    const modalDocAuthor    = document.getElementById('modalDocAuthor');

    // Lock modal
    const lockModal          = document.getElementById('lockModal');
    const lockModalCloseBtn  = document.getElementById('lockModalCloseBtn');
    const lockModalCancelBtn = document.getElementById('lockModalCancelBtn');
    const lockModalConfirmBtn= document.getElementById('lockModalConfirmBtn');
    const lockDocTitle       = document.getElementById('lockDocTitle');
    const lockComment        = document.getElementById('lockComment');

    // Toast
    const actionToast     = document.getElementById('actionToast');
    const actionToastMsg  = document.getElementById('actionToastMsg');
    const actionToastIcon = document.getElementById('actionToastIcon');
    const actionErrorModal    = document.getElementById('actionErrorModal');
    const actionErrorMessage  = document.getElementById('actionErrorMessage');
    const closeActionErrorBtn = document.getElementById('closeActionErrorBtn');

    let allDocuments = [], filteredDocuments = [];
    let currentPage = 1, currentTab = 'all';
    const itemsPerPage = 10;
    let pendingRejectDocId = null, currentLockDocId = null;
    let toastTimer;

    // Initialize Bulk Action Modal
    const bulkActionModalManager = new BulkActionModalManager();

    // ── Helpers ───────────────────────────────────────────────────────────────
    function showToast(msg, isError = false) {
        if (!actionToast) return;
        actionToastIcon.textContent = isError ? '✕' : '✓';
        actionToastMsg.textContent = msg;
        actionToast.querySelector('div').className = `flex items-center gap-3 ${isError ? 'bg-red-700' : 'bg-gray-900'} text-white px-4 py-3 rounded-xl shadow-xl text-sm max-w-sm`;
        actionToast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => actionToast.classList.add('hidden'), 3500);
    }

    function showErrorModal(msg) {
        if (!actionErrorModal) { alert(msg); return; }
        actionErrorMessage.textContent = msg;
        actionErrorModal.classList.remove('hidden');
        actionErrorModal.classList.add('flex');
    }

    if (closeActionErrorBtn) closeActionErrorBtn.addEventListener('click', () => {
        actionErrorModal.classList.add('hidden');
        actionErrorModal.classList.remove('flex');
    });

    // ── Preview modal ─────────────────────────────────────────────────────────
    function openPreviewModal(url, title) {
        if (!docPreviewModal || !docPreviewFrame) { window.open(url, '_blank'); return; }
        if (docPreviewTitle) docPreviewTitle.textContent = title || 'Document Preview';
        docPreviewFrame.src = url;
        docPreviewModal.classList.remove('hidden');
        docPreviewModal.classList.add('flex');
    }
    function closePreviewModal() {
        if (!docPreviewModal) return;
        docPreviewModal.classList.add('hidden');
        docPreviewModal.classList.remove('flex');
        if (docPreviewFrame) docPreviewFrame.src = 'about:blank';
    }
    if (docPreviewCloseBtn) docPreviewCloseBtn.addEventListener('click', closePreviewModal);
    if (docPreviewModal) docPreviewModal.addEventListener('click', e => { if (e.target === docPreviewModal) closePreviewModal(); });

    // ── Rejection modal ───────────────────────────────────────────────────────
    function openRejectionModal(doc) {
        pendingRejectDocId = doc.id;
        if (modalDocTitle)    modalDocTitle.textContent    = doc.title;
        if (modalDocDate)     modalDocDate.textContent     = new Date(doc.created_at).toLocaleDateString();
        if (modalDocCategory) modalDocCategory.textContent = `${doc.category_name || doc.category || 'N/A'} / ${doc.department_code || 'N/A'}`;
        if (modalDocAuthor)   modalDocAuthor.textContent   = doc.author_name || 'Unknown';
        if (rejectionComment) rejectionComment.value = '';
        if (rejectionModal) {
            rejectionModal.classList.remove('hidden');
            setTimeout(() => rejectionModal.classList.add('active'), 10);
        }
    }
    function closeRejectionModal() {
        pendingRejectDocId = null;
        if (rejectionModal) {
            rejectionModal.classList.remove('active');
            setTimeout(() => rejectionModal.classList.add('hidden'), 300);
        }
    }
    if (closeRejectionBtn) closeRejectionBtn.addEventListener('click', closeRejectionModal);
    if (cancelRejection)   cancelRejection.addEventListener('click', closeRejectionModal);
    if (rejectionModal)    rejectionModal.addEventListener('click', e => { if (e.target === rejectionModal) closeRejectionModal(); });

    if (submitRejection) {
        submitRejection.addEventListener('click', async () => {
            const reason = rejectionComment?.value?.trim();
            if (!reason) { showToast('Please provide a rejection reason.', true); return; }
            if (!pendingRejectDocId) {
                showErrorModal('No document selected for rejection.');
                return;
            }
            
            console.log('Submitting rejection for document ID:', pendingRejectDocId);
            console.log('Rejection reason:', reason);
            
            try {
                const res = await fetch(`${API_BASE}/api/approvals/${pendingRejectDocId}/reject`, {
                    method: 'POST',
                    headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                });
                
                console.log('Rejection response status:', res.status);
                
                const data = await res.json();
                console.log('Rejection response data:', data);
                
                if (!res.ok) throw new Error(data.msg || 'Failed to reject');
                
                closeRejectionModal();
                showToast('Document rejected successfully.');
                updateDocumentStatus(pendingRejectDocId, 'rejected');
                loadStats();
            } catch (err) {
                console.error('Rejection error:', err);
                showErrorModal(err.message || 'Failed to reject document');
            }
        });
    }

    // ── Lock modal ────────────────────────────────────────────────────────────
    function openLockModal(docId, title) {
        currentLockDocId = docId;
        if (lockDocTitle) lockDocTitle.textContent = title;
        if (lockComment)  lockComment.value = '';
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
    if (lockModalCloseBtn)  lockModalCloseBtn.addEventListener('click', closeLockModal);
    if (lockModalCancelBtn) lockModalCancelBtn.addEventListener('click', closeLockModal);
    if (lockModal) lockModal.addEventListener('click', e => { if (e.target === lockModal) closeLockModal(); });

    if (lockModalConfirmBtn) {
        lockModalConfirmBtn.addEventListener('click', async () => {
            if (!currentLockDocId) return;
            const comments = lockComment?.value || '';
            try {
                const res = await fetch(`${API_BASE}/api/approvals/${currentLockDocId}/lock`, {
                    method: 'POST',
                    headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ comments })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Failed to lock');
                closeLockModal();
                showToast('Document locked successfully.');
                updateDocumentStatus(currentLockDocId, 'locked');
                loadStats();
            } catch (err) {
                closeLockModal();
                showErrorModal(err.message);
            }
        });
    }

    // ── Bulk Actions ──────────────────────────────────────────────────────────
    const selectAllCheckbox = document.getElementById('selectAll');
    const selectedCountSpan = document.getElementById('selectedCount');
    const bulkActionSelect = document.getElementById('bulkAction');
    const applyBulkBtn = document.getElementById('applyBulk');
    
    function getSelectedDocumentIds() {
        const checkboxes = document.querySelectorAll('.doc-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-id')));
    }
    
    function updateSelectedCount() {
        const selectedIds = getSelectedDocumentIds();
        if (selectedCountSpan) selectedCountSpan.textContent = `${selectedIds.length} selected`;
        
        if (selectAllCheckbox) {
            const allCheckboxes = document.querySelectorAll('.doc-checkbox');
            if (allCheckboxes.length > 0) {
                const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = !allChecked && selectedIds.length > 0;
            }
        }
    }
    
    function clearAllSelections() {
        const checkboxes = document.querySelectorAll('.doc-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        updateSelectedCount();
    }
    
    async function performBulkAction() {
        const action = bulkActionSelect?.value;
        if (!action) {
            showToast('Please select an action to perform', true);
            return;
        }
        
        const selectedIds = getSelectedDocumentIds();
        if (selectedIds.length === 0) {
            showToast('Please select at least one document', true);
            return;
        }
        
        // Role-based permission checks
        const isAreaChair = normalizedRole === 'area-chair' || normalizedRole === 'department-head';
        const isDeanOrAdmin = normalizedRole === 'dean' || normalizedRole === 'admin';
        const isAdmin = normalizedRole === 'admin';
        
        if (action === 'approve' && !isDeanOrAdmin) {
            showToast('Only Dean and Admin can approve documents.', true);
            return;
        }
        
        // Get selected documents with full details
        const selectedDocuments = allDocuments.filter(doc => selectedIds.includes(doc.id));
        
        // Open comprehensive modal
        bulkActionModalManager.open({
            action: action,
            documents: selectedDocuments,
            requiresComment: action === 'reject',
            commentLabel: action === 'reject' ? 'Reason for Rejection' : 'Comments (Optional)',
            commentPlaceholder: action === 'reject' 
                ? 'Please provide a detailed reason for rejecting these documents...'
                : 'Add any comments for this action...',
            commentHint: action === 'reject' ? 'This reason will be sent to all document authors.' : '',
            onConfirm: async (comment) => {
                await executeBulkAction(action, selectedIds, comment);
            }
        });
    }
    
    async function executeBulkAction(action, selectedIds, comment) {
        // Show progress
        showToast(`Processing ${selectedIds.length} documents...`, false);
        
        let successCount = 0;
        let failCount = 0;
        const errors = [];
        
        // Process each document
        for (const docId of selectedIds) {
            try {
                let response;
                let newStatus;
                const body = comment ? { comments: comment, reason: comment } : {};
                
                if (action === 'validate') {
                    response = await fetch(`${API_BASE}/api/approvals/${docId}/validate`, {
                        method: 'POST',
                        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    newStatus = 'validated';
                } else if (action === 'approve') {
                    response = await fetch(`${API_BASE}/api/approvals/${docId}/approve`, {
                        method: 'POST',
                        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    newStatus = 'approved';
                } else if (action === 'reject') {
                    response = await fetch(`${API_BASE}/api/approvals/${docId}/reject`, {
                        method: 'POST',
                        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason: comment })
                    });
                    newStatus = 'rejected';
                } else {
                    continue;
                }
                
                const data = await response.json();
                if (response.ok) {
                    successCount++;
                    updateDocumentStatus(docId, newStatus);
                } else {
                    failCount++;
                    errors.push(`Doc ${docId}: ${data.msg || 'Failed'}`);
                }
            } catch (err) {
                failCount++;
                errors.push(`Doc ${docId}: ${err.message}`);
            }
        }
        
        // Show results
        const actionNames = {
            'validate': 'validated',
            'approve': 'approved',
            'reject': 'rejected'
        };
        
        if (failCount === 0) {
            showToast(`Successfully ${actionNames[action]} ${successCount} document(s).`);
        } else {
            showToast(`${actionNames[action]} ${successCount} documents, ${failCount} failed.`, true);
            if (errors.length > 0) {
                console.error('Bulk action errors:', errors);
            }
        }
        
        // Clear selections and refresh
        clearAllSelections();
        if (bulkActionSelect) bulkActionSelect.value = '';
        loadStats();
        loadDocuments();
    }

    // ── Data loading ──────────────────────────────────────────────────────────
    loadStats();
    loadDocuments();

    async function loadStats() {
        try {
            const res = await fetch(`${API_BASE}/api/approvals/stats`, { headers: { 'x-auth-token': token } });
            if (!res.ok) throw new Error();
            const stats = await res.json();
            document.getElementById('statPendingReview').textContent  = (stats.pending || 0) + (stats.validated || 0);
            document.getElementById('statApprovedMonth').textContent  = stats.approved_month || 0;
            document.getElementById('statRejected').textContent       = stats.rejected || 0;
            document.getElementById('statAvgProcessing').textContent  = stats.avg_days ? `${stats.avg_days}d` : '—';
            document.getElementById('urgentCount').textContent        = stats.pending > 0 ? `${stats.pending} pending` : 'No pending';
            document.getElementById('approvedChange').textContent     = stats.approved_month > 0 ? `${stats.approved_month} this month` : 'None this month';
            document.getElementById('rejectedNote').textContent       = stats.rejected > 0 ? 'Awaiting resubmission' : 'None rejected';
            document.getElementById('slaNote').textContent            = 'Within SLA';
            const badge = document.getElementById('approvalsBadge');
            if (badge) {
                badge.textContent = stats.pending || 0;
                badge.style.display = stats.pending > 0 ? 'inline-block' : 'none';
            }
        } catch { /* keep previous values */ }
    }

    async function loadDocuments() {
        try {
            console.log('Loading approval documents...');
            console.log('API URL:', `${API_BASE}/api/approvals/pending`);
            console.log('Token:', token ? 'Present' : 'Missing');
            console.log('User role:', normalizedRole);
            
            const res = await fetch(`${API_BASE}/api/approvals/pending`, { 
                headers: { 'x-auth-token': token } 
            });
            
            console.log('Response status:', res.status);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ msg: 'Unknown error' }));
                throw new Error(errorData.msg || `HTTP ${res.status}: ${res.statusText}`);
            }
            
            allDocuments = await res.json();
            console.log('Approval documents loaded:', allDocuments);
            console.log('Number of documents:', allDocuments.length);
            applyFilters();
        } catch (err) {
            console.error('Load documents error:', err);
            showToast('Failed to load documents: ' + err.message, true);
            const msg = '<div class="col-span-12 py-8 text-center text-red-500">Failed to load documents: ' + err.message + '</div>';
            if (desktopContainer) desktopContainer.innerHTML = msg;
            if (mobileContainer)  mobileContainer.innerHTML  = msg;
        }
    }

    // ── Filtering ─────────────────────────────────────────────────────────────
    function applyFilters() {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const stage  = workflowStage?.value  || 'all';
        const status = approvalStatus?.value || 'all';

        filteredDocuments = allDocuments.filter(doc => {
            const matchesSearch = !searchTerm ||
                doc.title.toLowerCase().includes(searchTerm) ||
                (doc.author_name    || '').toLowerCase().includes(searchTerm) ||
                (doc.department_name|| '').toLowerCase().includes(searchTerm) ||
                (doc.department_code|| '').toLowerCase().includes(searchTerm);

            const matchesStage =
                stage === 'all' ||
                (stage === 'upload'   && doc.workflow_status === 'draft')     ||
                (stage === 'validate' && doc.workflow_status === 'pending')   ||
                (stage === 'approve'  && doc.workflow_status === 'validated') ||
                (stage === 'lock'     && doc.workflow_status === 'approved');

            const matchesStatus =
                status === 'all' ||
                (status === 'pending'  && doc.workflow_status === 'pending')   ||
                (status === 'review'   && doc.workflow_status === 'validated') ||
                (status === 'approved' && doc.workflow_status === 'approved')  ||
                (status === 'locked'   && doc.workflow_status === 'locked')    ||
                (status === 'rejected' && doc.workflow_status === 'rejected');

            const matchesTab =
                currentTab === 'all' ||
                (currentTab === 'pending'   && (doc.workflow_status === 'pending' || doc.workflow_status === 'validated')) ||
                (currentTab === 'validating'&& doc.workflow_status === 'pending')   ||
                (currentTab === 'approving' && doc.workflow_status === 'validated') ||
                (currentTab === 'recent'    && (doc.workflow_status === 'approved' || doc.workflow_status === 'locked'));

            return matchesSearch && matchesStage && matchesStatus && matchesTab;
        });

        currentPage = 1;
        renderDocuments();
        renderPagination();
    }

    // ── Rendering ─────────────────────────────────────────────────────────────
    const statusBadges = {
        draft:     'bg-gray-100 text-gray-700',
        pending:   'bg-amber-100 text-amber-700',
        validated: 'bg-blue-100 text-blue-700',
        approved:  'bg-green-100 text-green-700',
        locked:    'bg-purple-100 text-purple-700',
        rejected:  'bg-red-100 text-red-700'
    };
    const statusTexts = {
        draft: 'Draft', pending: 'Pending Validation', validated: 'Pending Approval',
        approved: 'Approved', locked: 'Locked', rejected: 'Rejected'
    };

    function getActionButtons(doc, mobile = false) {
        const s = doc.workflow_status;
        const isAreaChair = normalizedRole === 'area-chair' || normalizedRole === 'department-head';
        const isDeanOrAdmin = normalizedRole === 'dean' || normalizedRole === 'admin';
        const isAdmin     = normalizedRole === 'admin';
        const fileUrl = doc.file_url ? `${API_BASE}${doc.file_url}` : '#';

        const cls = mobile
            ? { view: 'btn-view text-xs px-2 py-1', validate: 'btn-validate text-xs px-2 py-1', approve: 'btn-approve text-xs px-2 py-1', lock: 'btn-lock text-xs px-2 py-1', reject: 'btn-reject text-xs px-2 py-1', awaiting: 'btn-awaiting text-xs px-2 py-1', delete: 'btn-delete text-xs px-2 py-1' }
            : { view: 'btn-view text-xs', validate: 'btn-validate text-xs', approve: 'btn-approve text-xs', lock: 'btn-lock text-xs', reject: 'btn-reject text-xs', awaiting: 'btn-awaiting text-xs', delete: 'btn-delete text-xs' };

        let btns = `<button class="${cls.view} btn-view-action" data-id="${doc.id}" data-url="${fileUrl}" data-title="${doc.title}">View</button>`;

        if (s === 'draft' || s === 'pending') {
            // Area-chair and above can validate
            btns += ` <button class="${cls.validate} btn-validate-action" data-id="${doc.id}">Validate</button>`;
            btns += ` <button class="${cls.reject} btn-reject-action" data-id="${doc.id}">Reject</button>`;
        } else if (s === 'validated') {
            if (isDeanOrAdmin) {
                // Only Dean / Admin can approve
                btns += ` <button class="${cls.approve} btn-approve-action" data-id="${doc.id}">Approve</button>`;
                btns += ` <button class="${cls.reject} btn-reject-action" data-id="${doc.id}">Reject</button>`;
            } else if (isAreaChair) {
                // Area-chair/Dept. Head cannot approve — show informational badge
                btns += ` <span class="${cls.awaiting}" title="Awaiting Dean/Admin approval">Awaiting Approval</span>`;
            }
        } else if (s === 'approved') {
            // RULE: Only Admin can lock documents
            if (isAdmin) {
                btns += ` <button class="${cls.lock} btn-lock-action" data-id="${doc.id}" data-title="${doc.title}">Lock</button>`;
            }
        } else if (s === 'locked' && isAdmin) {
            btns += ` <button class="btn-unlock text-xs btn-unlock-action" data-id="${doc.id}">Unlock</button>`;
        } else if (s === 'rejected') {
            // Rejected documents: Show Comments and Delete
            btns += ` <button class="btn-comments text-xs btn-comments-action" data-id="${doc.id}">Comments</button>`;
            btns += ` <button class="${cls.delete} btn-delete-action" data-id="${doc.id}">Delete</button>`;
        }

        return btns;
    }

    function renderDocuments() {
        const start = (currentPage - 1) * itemsPerPage;
        const page  = filteredDocuments.slice(start, start + itemsPerPage);

        if (!desktopContainer || !mobileContainer) return;

        if (page.length === 0) {
            desktopContainer.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-gray-500">No documents found</td></tr>';
            mobileContainer.innerHTML  = '<div class="py-8 text-center text-gray-500">No documents found</div>';
            return;
        }

        desktopContainer.innerHTML = page.map(doc => `
            <tr class="hover:bg-gray-50" data-id="${doc.id}">
                <td class="py-3 px-4"><input type="checkbox" class="doc-checkbox rounded border-gray-300 text-teal-600"></td>
                <td class="py-3 px-4">
                    <div class="font-medium text-gray-800">${doc.title}</div>
                    <div class="text-xs text-gray-400">by ${doc.author_name || 'Unknown'} · ${new Date(doc.created_at).toLocaleDateString()}</div>
                </td>
                <td class="py-3 px-4"><span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">${(doc.category_name || doc.category || 'N/A').toUpperCase()}</span></td>
                <td class="py-3 px-4">${renderStandardsBadges(doc.standards || [])}</td>
                <td class="py-3 px-4"><span class="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">${doc.department_code || 'N/A'}</span></td>
                <td class="py-3 px-4"><span class="${statusBadges[doc.workflow_status] || 'bg-gray-100 text-gray-700'} text-xs px-2 py-1 rounded-full font-medium">${statusTexts[doc.workflow_status] || doc.workflow_status}</span></td>
                <td class="py-3 px-4 text-gray-600">${doc.version || 'v1.0'}</td>
                <td class="py-3 px-4"><div class="flex flex-wrap gap-1">${getActionButtons(doc)}</div></td>
            </tr>`).join('');

        mobileContainer.innerHTML = page.map(doc => `
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
                    <span class="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">${doc.department_code || 'N/A'}</span>
                    <span class="${statusBadges[doc.workflow_status] || 'bg-gray-100 text-gray-700'} text-xs px-2 py-1 rounded-full font-medium">${statusTexts[doc.workflow_status] || doc.workflow_status}</span>
                </div>
                <div class="text-sm text-gray-600 mb-3">${doc.version || 'v1.0'}</div>
                <div class="flex flex-wrap gap-2">${getActionButtons(doc, true)}</div>
            </div>`).join('');

        attachActionHandlers();
        
        // Attach checkbox listeners for bulk actions
        document.querySelectorAll('.doc-checkbox').forEach(cb => {
            cb.addEventListener('change', updateSelectedCount);
        });
    }

    function renderStandardsBadges(standards) {
        if (!standards || standards.length === 0) {
            return '<span class="text-xs text-gray-400">—</span>';
        }
        const visible = standards.slice(0, 2);
        const remaining = standards.length - 2;
        let html = visible.map(s => `<span class="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs mr-1 mb-1">${s}</span>`).join('');
        if (remaining > 0) {
            html += `<span class="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">+${remaining}</span>`;
        }
        return html;
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end   = Math.min(currentPage * itemsPerPage, filteredDocuments.length);
        if (paginationInfo) paginationInfo.textContent = `Showing ${start} to ${end} of ${filteredDocuments.length}`;
        if (!paginationButtons) return;

        let html = '<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm" data-page="prev">Previous</button>';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="px-3 py-1 ${i === currentPage ? 'bg-teal-600 text-white' : 'bg-white border text-gray-600'} rounded-lg text-sm" data-page="${i}">${i}</button>`;
        }
        html += '<button class="px-3 py-1 bg-white border rounded-lg text-gray-600 text-sm" data-page="next">Next</button>';
        paginationButtons.innerHTML = html;

        paginationButtons.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = btn.getAttribute('data-page');
                if (p === 'prev' && currentPage > 1) currentPage--;
                else if (p === 'next' && currentPage < totalPages) currentPage++;
                else if (!isNaN(p)) currentPage = parseInt(p);
                renderDocuments();
                renderPagination();
            });
        });
    }

    function updateDocumentStatus(docId, newStatus) {
        const doc = allDocuments.find(d => d.id === docId || d.id === parseInt(docId));
        if (doc) { doc.workflow_status = newStatus; applyFilters(); }
    }

    // ── Action handlers ───────────────────────────────────────────────────────
    function attachActionHandlers() {
        document.querySelectorAll('.btn-view-action').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                openPreviewModal(btn.getAttribute('data-url'), btn.getAttribute('data-title'));
            });
        });

        document.querySelectorAll('.btn-validate-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const docId = btn.getAttribute('data-id');
                if (!confirm('Validate this document? It will move to the approval stage.')) return;
                try {
                    const res = await fetch(`${API_BASE}/api/approvals/${docId}/validate`, {
                        method: 'POST', headers: { 'x-auth-token': token }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.msg || 'Failed to validate');
                    showToast('Document validated successfully.');
                    updateDocumentStatus(parseInt(docId), 'validated');
                    loadStats();
                } catch (err) { showErrorModal(err.message); }
            });
        });

        document.querySelectorAll('.btn-approve-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const docId = btn.getAttribute('data-id');
                if (!confirm('Approve this document?')) return;
                try {
                    const res = await fetch(`${API_BASE}/api/approvals/${docId}/approve`, {
                        method: 'POST', headers: { 'x-auth-token': token }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.msg || 'Failed to approve');
                    showToast('Document approved successfully.');
                    updateDocumentStatus(parseInt(docId), 'approved');
                    loadStats();
                } catch (err) { showErrorModal(err.message); }
            });
        });

        document.querySelectorAll('.btn-lock-action').forEach(btn => {
            btn.addEventListener('click', () => {
                openLockModal(btn.getAttribute('data-id'), btn.getAttribute('data-title'));
            });
        });

        document.querySelectorAll('.btn-unlock-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const docId = btn.getAttribute('data-id');
                if (!confirm('Unlock this document? It will return to approved status.')) return;
                try {
                    const res = await fetch(`${API_BASE}/api/approvals/${docId}/unlock`, {
                        method: 'POST', headers: { 'x-auth-token': token }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.msg || 'Failed to unlock');
                    showToast('Document unlocked.');
                    updateDocumentStatus(parseInt(docId), 'approved');
                    loadStats();
                } catch (err) { showErrorModal(err.message); }
            });
        });

        document.querySelectorAll('.btn-reject-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = parseInt(btn.getAttribute('data-id'));
                console.log('Reject button clicked for document ID:', docId);
                const doc = allDocuments.find(d => d.id === docId || d.id === String(docId));
                console.log('Found document:', doc);
                if (doc) {
                    openRejectionModal(doc);
                } else {
                    console.error('Document not found in allDocuments array');
                    showErrorModal('Document not found. Please refresh the page and try again.');
                }
            });
        });

        document.querySelectorAll('.btn-comments-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const docId = btn.getAttribute('data-id');
                try {
                    const res = await fetch(`${API_BASE}/api/documents/${docId}/comments`, {
                        headers: { 'x-auth-token': token }
                    });
                    const data = await res.json();
                    const doc = allDocuments.find(d => d.id == docId);
                    openCommentsModal(doc, data.comments || []);
                } catch (err) {
                    showErrorModal('Failed to load comments');
                }
            });
        });

        document.querySelectorAll('.btn-delete-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const docId = btn.getAttribute('data-id');
                if (!confirm('Delete this rejected document? This action cannot be undone.')) return;
                try {
                    const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': token }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.msg || 'Failed to delete');
                    showToast('Document deleted successfully.');
                    loadDocuments();
                    loadStats();
                } catch (err) {
                    showErrorModal(err.message);
                }
            });
        });
    }

    function openCommentsModal(doc, comments) {
        const commentsModal = document.getElementById('commentsModal');
        const commentsDocTitle = document.getElementById('commentsDocTitle');
        const commentsDocDate = document.getElementById('commentsDocDate');
        const commentsListContainer = document.getElementById('commentsListContainer');
        
        if (!commentsModal) return;
        
        if (commentsDocTitle) commentsDocTitle.textContent = doc?.title || 'Unknown';
        if (commentsDocDate) commentsDocDate.textContent = doc?.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A';
        
        if (commentsListContainer) {
            if (comments.length === 0) {
                commentsListContainer.innerHTML = '<div class="text-center text-gray-500 py-4">No comments found</div>';
            } else {
                commentsListContainer.innerHTML = comments.map(c => {
                    const date = new Date(c.created_at).toLocaleString();
                    const reviewer = c.reviewer_name || 'Reviewer';
                    const text = c.reason || c.comments || 'No comment provided';
                    return `
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-reviewer">${reviewer}</span>
                                <span class="comment-date">${date}</span>
                            </div>
                            <div class="comment-text">${text}</div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        commentsModal.classList.remove('hidden');
        setTimeout(() => commentsModal.classList.add('active'), 10);
    }

    function closeCommentsModal() {
        const commentsModal = document.getElementById('commentsModal');
        if (!commentsModal) return;
        commentsModal.classList.remove('active');
        setTimeout(() => commentsModal.classList.add('hidden'), 300);
    }

    const closeCommentsModalBtn = document.getElementById('closeCommentsModal');
    const closeCommentsBtn = document.getElementById('closeCommentsBtn');
    if (closeCommentsModalBtn) closeCommentsModalBtn.addEventListener('click', closeCommentsModal);
    if (closeCommentsBtn) closeCommentsBtn.addEventListener('click', closeCommentsModal);
    
    const commentsModal = document.getElementById('commentsModal');
    if (commentsModal) {
        commentsModal.addEventListener('click', e => {
            if (e.target === commentsModal) closeCommentsModal();
        });
    }

    // ── Event listeners ───────────────────────────────────────────────────────
    if (searchInput)    searchInput.addEventListener('input', applyFilters);
    if (workflowStage)  workflowStage.addEventListener('change', applyFilters);
    if (approvalStatus) approvalStatus.addEventListener('change', applyFilters);
    if (refreshBtn)     refreshBtn.addEventListener('click', () => { loadStats(); loadDocuments(); });
    
    // Bulk action listeners
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.doc-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateSelectedCount();
        });
    }
    if (applyBulkBtn) applyBulkBtn.addEventListener('click', performBulkAction);

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
